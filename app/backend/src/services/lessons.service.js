import { supabase } from '../config/database.js';
import { questionExtractionService } from './questionExtraction.service.js';
import { solutionExtractionService } from './solutionExtraction.service.js';

export const lessonsService = {
  /**
   * Get all lessons with optional filtering
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('lessons')
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number),
        question_set:question_sets(id, name),
        solution_set:solution_sets(id, name)
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
   * Find lesson by ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number),
        question_set:question_sets(id, name),
        solution_set:solution_sets(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    return data;
  },

  /**
   * Create a new lesson by merging question set and solution set
   */
  async create({ name, question_set_id, solution_set_id }) {
    // Fetch question set
    const questionSet = await questionExtractionService.findById(question_set_id);
    if (!questionSet) {
      throw new Error('Question set not found');
    }

    // Fetch solution set
    const solutionSet = await solutionExtractionService.findById(solution_set_id);
    if (!solutionSet) {
      throw new Error('Solution set not found');
    }

    // Validate that both sets belong to the same book and chapter
    if (questionSet.book_id !== solutionSet.book_id) {
      throw new Error('Question set and solution set must belong to the same book');
    }

    if (questionSet.chapter_id !== solutionSet.chapter_id) {
      throw new Error('Question set and solution set must belong to the same chapter');
    }

    // Get questions and solutions arrays
    const questions = questionSet.questions?.questions || [];
    const solutions = solutionSet.solutions?.solutions || [];

    // Create a map of solutions by question_label for quick lookup
    const solutionsMap = new Map();
    solutions.forEach((solution) => {
      if (solution.question_label) {
        solutionsMap.set(String(solution.question_label), solution);
      }
    });

    // Merge questions with solutions based on question_label
    const lessons = questions.map((question) => {
      const questionLabel = String(question.question_label || '');
      const matchingSolution = solutionsMap.get(questionLabel);

      const lesson = {
        question_label: question.question_label,
        text: question.text,
        choices: question.choices || [],
      };

      // Add solution fields if matching solution exists
      if (matchingSolution) {
        if (matchingSolution.answer_key) {
          lesson.answer_key = matchingSolution.answer_key;
        }
        if (matchingSolution.worked_solution) {
          lesson.worked_solution = matchingSolution.worked_solution;
        }
        if (matchingSolution.explanation) {
          lesson.explanation = matchingSolution.explanation;
        }
      }

      return lesson;
    });

    // Create the lesson record
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        name,
        book_id: questionSet.book_id,
        chapter_id: questionSet.chapter_id,
        question_set_id,
        solution_set_id,
        question_solution_json: { lessons },
      })
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number),
        question_set:question_sets(id, name),
        solution_set:solution_sets(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a lesson
   */
  async update(id, updateData) {
    const updates = {};

    if (updateData.name !== undefined) {
      updates.name = updateData.name;
    }

    if (updateData.question_solution_json !== undefined) {
      updates.question_solution_json = updateData.question_solution_json;
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        book:books(id, name, display_name),
        chapter:chapters(id, name, display_name, chapter_number),
        question_set:question_sets(id, name),
        solution_set:solution_sets(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a lesson
   */
  async delete(id) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default lessonsService;
