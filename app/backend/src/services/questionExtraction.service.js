import { supabase } from '../config/database.js';
import { config } from '../config/index.js';

const LLAMAPARSE_API_URL = config.llamaParse.apiUrl;
const LLAMAPARSE_API_KEY = config.llamaParse.apiKey;

// Parsing instructions for MCQ extraction
const MCQ_PARSING_INSTRUCTIONS = `
Extract all multiple choice questions (MCQs) from this document.

For each question, identify:
1. The question text (including any mathematical notation)
2. All answer choices (labeled A, B, C, D, etc.)

Return the result in the following JSON format:
{
  "questions": [
    {
      "text": "Question text here with $math$ notation preserved",
      "choices": ["A. choice1", "B. choice2", "C. choice3", "D. choice4"]
    }
  ]
}

Important:
- Preserve LaTeX math notation ($...$ and $$...$$)
- Include all answer choices for each question
- Maintain the original question numbering if present
- If a question has sub-parts, treat each sub-part as a separate question
`;

export const questionExtractionService = {
  /**
   * Create a question set from selected scanned items
   * @param {string[]} itemIds - Array of scanned item IDs (in selection order)
   * @param {object} options - Optional name and metadata
   * @returns {Promise<object>} - Created question set record
   */
  async createQuestionSet(itemIds, options = {}) {
    // Fetch scanned items to get book_id and chapter_id from first item
    const { data: items, error: fetchError } = await supabase
      .from('scanned_items')
      .select('id, book_id, chapter_id, latex_doc, latex_conversion_status')
      .in('id', itemIds);

    if (fetchError) throw fetchError;

    if (!items || items.length === 0) {
      throw new Error('No scanned items found for the provided IDs');
    }

    // Validate all items have completed latex conversion
    const incompleteItems = items.filter(
      (item) => item.latex_conversion_status !== 'completed' || !item.latex_doc
    );

    if (incompleteItems.length > 0) {
      throw new Error(
        `${incompleteItems.length} item(s) do not have completed LaTeX conversion`
      );
    }

    // Use book_id and chapter_id from first item
    const firstItem = items[0];

    const { data, error } = await supabase
      .from('question_sets')
      .insert({
        name: options.name || `Question Set ${new Date().toISOString()}`,
        book_id: firstItem.book_id,
        chapter_id: firstItem.chapter_id,
        source_item_ids: itemIds,
        status: 'pending',
        metadata: options.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Extract questions from a question set
   * @param {string} questionSetId - ID of the question set
   * @returns {Promise<object>} - Updated question set with extracted questions
   */
  async extractQuestions(questionSetId) {
    try {
      // Update status to processing
      await this.updateStatus(questionSetId, 'processing');

      // Get question set
      const questionSet = await this.findById(questionSetId);
      if (!questionSet) {
        throw new Error('Question set not found');
      }

      // Combine latex content from source items
      const combinedContent = await this.combineLatexContent(questionSet.source_item_ids);

      // Submit to LlamaParse
      const jobId = await this.submitToLlamaParse(combinedContent);

      // Store the job ID
      await supabase
        .from('question_sets')
        .update({ llamaparse_job_id: jobId })
        .eq('id', questionSetId);

      // Poll for completion
      const rawResult = await this.pollForCompletion(jobId);

      // Parse the result into MCQ format
      const questions = this.parseQuestionsFromContent(rawResult);

      // Update question set with results
      const { data, error } = await supabase
        .from('question_sets')
        .update({
          questions: questions,
          total_questions: questions.questions?.length || 0,
          status: 'completed',
          error_message: null,
        })
        .eq('id', questionSetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Question extraction error:', error);
      await this.updateStatus(questionSetId, 'failed', error.message);
      throw error;
    }
  },

  /**
   * Combine latex documents from scanned items (preserving order)
   * @param {string[]} itemIds - Array of scanned item IDs (in order)
   * @returns {Promise<string>} - Combined LaTeX content
   */
  async combineLatexContent(itemIds) {
    // Fetch items
    const { data: items, error } = await supabase
      .from('scanned_items')
      .select('id, latex_doc')
      .in('id', itemIds);

    if (error) throw error;

    // Create a map for quick lookup
    const itemMap = new Map(items.map((item) => [item.id, item.latex_doc]));

    // Combine in the order of itemIds
    const combinedParts = itemIds.map((id, index) => {
      const latex = itemMap.get(id) || '';
      return `% ========== Document ${index + 1} ==========\n\n${latex}`;
    });

    return combinedParts.join('\n\n');
  },

  /**
   * Submit content to LlamaParse for question extraction
   * @param {string} content - Combined LaTeX/text content
   * @returns {Promise<string>} - Job ID from LlamaParse
   */
  async submitToLlamaParse(content) {
    // Create a text file blob from the combined content
    const blob = new Blob([content], { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', blob, 'questions.txt');
    formData.append('parsing_instruction', MCQ_PARSING_INSTRUCTIONS);
    formData.append('result_type', 'markdown');
    formData.append('premium_mode', 'true');
    formData.append('gpt4o_mode', 'true');

    const response = await fetch(`${LLAMAPARSE_API_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LLAMAPARSE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LlamaParse upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  },

  /**
   * Poll LlamaParse for job completion
   * @param {string} jobId - LlamaParse job ID
   * @returns {Promise<string>} - Extracted content
   */
  async pollForCompletion(jobId, maxAttempts = 120, intervalMs = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${LLAMAPARSE_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'SUCCESS') {
        // Get the result
        return await this.getResult(jobId);
      }

      if (statusData.status === 'ERROR') {
        throw new Error(statusData.error || 'LlamaParse processing failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('LlamaParse extraction timed out');
  },

  /**
   * Get result from LlamaParse
   * @param {string} jobId - LlamaParse job ID
   * @returns {Promise<string>} - Extracted content
   */
  async getResult(jobId) {
    const response = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}/result/markdown`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${LLAMAPARSE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.status}`);
    }

    const result = await response.json();
    return result.markdown || result.text || JSON.stringify(result);
  },

  /**
   * Parse extracted content into MCQ JSON format
   * @param {string} rawContent - Raw extracted content from LlamaParse
   * @returns {object} - Structured questions object
   */
  parseQuestionsFromContent(rawContent) {
    try {
      // Try to find JSON in the response
      const jsonMatch = rawContent.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, try to parse markdown format
      const questions = [];
      const questionRegex = /(?:^|\n)(?:\d+[\.\)]\s*|Q(?:uestion)?[\s\.:]+\d*\s*)(.*?)(?=\n(?:\d+[\.\)]|Q(?:uestion)?[\s\.:]+\d*|\Z))/gis;
      const choiceRegex = /\n\s*([A-E])[\.\)]\s*(.+)/gi;

      let match;
      while ((match = questionRegex.exec(rawContent)) !== null) {
        const questionBlock = match[0];
        const choices = [];

        let choiceMatch;
        while ((choiceMatch = choiceRegex.exec(questionBlock)) !== null) {
          choices.push(`${choiceMatch[1]}. ${choiceMatch[2].trim()}`);
        }

        if (choices.length > 0) {
          // Extract question text (before choices)
          const questionText = questionBlock
            .split(/\n\s*[A-E][\.\)]/)[0]
            .replace(/^\d+[\.\)]\s*/, '')
            .replace(/^Q(?:uestion)?[\s\.:]+\d*\s*/i, '')
            .trim();

          questions.push({
            text: questionText,
            choices: choices,
          });
        }
      }

      return { questions };
    } catch (error) {
      console.error('Error parsing questions:', error);
      // Return raw content wrapped in a structure
      return {
        questions: [],
        raw_content: rawContent,
        parse_error: error.message,
      };
    }
  },

  /**
   * Update question set status
   */
  async updateStatus(questionSetId, status, errorMessage = null) {
    const updateData = { status };
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('question_sets')
      .update(updateData)
      .eq('id', questionSetId);

    if (error) console.error('Failed to update status:', error);
  },

  /**
   * Get question set by ID
   */
  async findById(questionSetId) {
    const { data, error } = await supabase
      .from('question_sets')
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number)
      `)
      .eq('id', questionSetId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get all question sets with optional filters
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('question_sets')
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number)
      `)
      .order('created_at', { ascending: false });

    if (filters.bookId) {
      query = query.eq('book_id', filters.bookId);
    }
    if (filters.chapterId) {
      query = query.eq('chapter_id', filters.chapterId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * Delete a question set
   */
  async delete(questionSetId) {
    const { error } = await supabase
      .from('question_sets')
      .delete()
      .eq('id', questionSetId);

    if (error) throw error;
    return true;
  },
};

export default questionExtractionService;
