import { supabase } from '../config/database.js';
import { config } from '../config/index.js';

const LLAMAPARSE_API_URL = config.llamaParse.apiUrl;
const LLAMAPARSE_API_KEY = config.llamaParse.apiKey;

export const Q_START_MARKER = '<<<Q_START>>>';
export const Q_END_MARKER = '<<<Q_END>>>';

const PRE_EXTRACTION_INSTRUCTIONS = `You are a question-boundary annotator. Your job is to take the LaTeX/Markdown content below (produced by an OCR pipeline from a question paper or academic book) and return the SAME content with explicit boundary markers wrapped around each question.

OUTPUT FORMAT — STRICT:
- Wrap every question with the exact tokens ${Q_START_MARKER} and ${Q_END_MARKER}.
- ${Q_START_MARKER} goes at the very beginning of each question (before its number/label, if any).
- ${Q_END_MARKER} goes at the very end of each question (after the last choice or last sub-part).
- Do NOT translate, summarize, rewrite, renumber, or "clean up" the content.
- Preserve ALL original characters, LaTeX commands, math delimiters, line breaks, and whitespace EXACTLY as in the input. The only change you make is INSERTING the two markers around each question.
- Content that is NOT a question (chapter headings, section titles like "LONG ANSWERS (LAT)", page numbers, image references, separator lines, blank lines, orphan numbers like "5." or "20." sitting alone on a line) MUST stay where it is, OUTSIDE any marker pair.

WHAT COUNTS AS A QUESTION:
- A complete instruction or interrogative sentence — ends in "?", or starts with verbs like "Find", "Show", "Prove", "How many", "Which", "Determine", "Calculate", "Solve", "If ...".
- A problem scenario followed by sub-parts (i)/(ii)/(iii) or (a)/(b)/(c) is ONE question; the marker pair must enclose the entire scenario plus all sub-parts.
- An MCQ — the question text PLUS all of its (a)/(b)/(c)/(d) choices — is ONE question; the marker pair must enclose the question text and all choices.

WHAT IS NOT A QUESTION:
- A bare number on its own line (e.g. "4.", "5.", "20.") with no question text immediately attached — this is OCR noise. Leave it untouched, outside any marker.
- Section/chapter titles, page headers/footers.
- Image links like ![](https://...).
- "(Example)" labels or other annotations.

NUMBERING IS UNRELIABLE:
- The OCR may place the question number BEFORE the question text, AFTER the question text, on a separate line, or omit it entirely. Do not rely on numbering to identify boundaries — rely on the question content itself.
- Include any visible question label (the digit/number, if present nearby) INSIDE the marker pair, so downstream consumers can still see it.

EXAMPLE INPUT:
\\section*{LONG ANSWERS (LAT)}

If sum of the 3rd and the 8th terms of an AP is 7 and the sum of the 7th and the 14th terms is $-3$, find the 10th term.

Find the sum of the two middle most terms of the AP.
4.
5.

How many three digit numbers are divisible by 7?
7.

EXAMPLE OUTPUT:
\\section*{LONG ANSWERS (LAT)}

${Q_START_MARKER}
If sum of the 3rd and the 8th terms of an AP is 7 and the sum of the 7th and the 14th terms is $-3$, find the 10th term.
${Q_END_MARKER}

${Q_START_MARKER}
Find the sum of the two middle most terms of the AP.
${Q_END_MARKER}
4.
5.

${Q_START_MARKER}
How many three digit numbers are divisible by 7?
7.
${Q_END_MARKER}

FINAL RULES:
- Output ONLY the annotated content. No JSON, no code fences, no commentary, no preamble like "Here is the annotated content".
- Every question MUST have exactly one ${Q_START_MARKER} and exactly one ${Q_END_MARKER}.
- Marker pairs MUST NOT overlap or nest.
- Do NOT add markers around non-question content.
- If you are unsure whether something is a question, leave it OUTSIDE the markers.`;

export const preExtractionService = {
  /**
   * Annotate a scanned item's latex_doc with question boundary markers.
   * Stores the result in scanned_items.pre_extracted.
   */
  async annotate(scannedItemId) {
    const { data: item, error: fetchError } = await supabase
      .from('scanned_items')
      .select('id, latex_doc, latex_conversion_status')
      .eq('id', scannedItemId)
      .single();

    if (fetchError) throw fetchError;
    if (!item) throw new Error('Scanned item not found');
    if (item.latex_conversion_status !== 'completed' || !item.latex_doc) {
      throw new Error('LaTeX conversion is not completed for this item');
    }

    console.log(`[PRE-EXTRACT] Item ${scannedItemId}: latex_doc size ${Math.round(item.latex_doc.length / 1024)}KB`);
    console.log(`[PRE-EXTRACT] ===== ANNOTATION PROMPT =====`);
    console.log(PRE_EXTRACTION_INSTRUCTIONS);
    console.log(`[PRE-EXTRACT] ===== END PROMPT (length: ${PRE_EXTRACTION_INSTRUCTIONS.length}) =====`);

    const jobId = await this.submitToLlamaParse(item.latex_doc);
    console.log(`[PRE-EXTRACT] LlamaParse job: ${jobId}`);

    const annotated = await this.pollForCompletion(jobId);
    console.log(`[PRE-EXTRACT] Annotated size: ${Math.round(annotated.length / 1024)}KB`);

    const startCount = (annotated.match(new RegExp(Q_START_MARKER, 'g')) || []).length;
    const endCount = (annotated.match(new RegExp(Q_END_MARKER, 'g')) || []).length;
    console.log(`[PRE-EXTRACT] Marker counts — start: ${startCount}, end: ${endCount}`);

    const { data: updated, error: updateError } = await supabase
      .from('scanned_items')
      .update({ pre_extracted: annotated, updated_at: new Date().toISOString() })
      .eq('id', scannedItemId)
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number)
      `)
      .single();

    if (updateError) throw updateError;
    return updated;
  },

  /**
   * Manually overwrite the pre_extracted content for a scanned item.
   * Used when a user edits the markers in the UI.
   */
  async savePreExtracted(scannedItemId, preExtracted) {
    if (typeof preExtracted !== 'string') {
      throw new Error('pre_extracted must be a string');
    }
    const value = preExtracted.length > 0 ? preExtracted : null;

    const { data, error } = await supabase
      .from('scanned_items')
      .update({ pre_extracted: value, updated_at: new Date().toISOString() })
      .eq('id', scannedItemId)
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async submitToLlamaParse(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'pre_extract.txt');
    formData.append('parsing_instruction', PRE_EXTRACTION_INSTRUCTIONS);
    formData.append('result_type', 'markdown');
    formData.append('premium_mode', 'true');

    const response = await fetch(`${LLAMAPARSE_API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LlamaParse upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  },

  async pollForCompletion(jobId, maxAttempts = 120, intervalMs = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      if (statusData.status === 'SUCCESS') {
        return await this.getResult(jobId);
      }
      if (statusData.status === 'ERROR') {
        throw new Error(statusData.error || 'LlamaParse processing failed');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('LlamaParse pre-extraction timed out');
  },

  async getResult(jobId) {
    const response = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}/result/markdown`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.status}`);
    }

    const result = await response.json();
    return result.markdown || result.text || JSON.stringify(result);
  },
};

export default preExtractionService;
