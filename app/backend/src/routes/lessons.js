import { Router } from 'express';
import { questionExtractionService, solutionExtractionService } from '../services/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Create lessons by merging question set and solution set
router.post('/create', asyncHandler(async (req, res) => {
  const { question_set_id, solution_set_id } = req.body;

  if (!question_set_id) {
    return res.status(400).json({
      success: false,
      error: 'question_set_id is required',
    });
  }

  if (!solution_set_id) {
    return res.status(400).json({
      success: false,
      error: 'solution_set_id is required',
    });
  }

  // Fetch question set
  const questionSet = await questionExtractionService.findById(question_set_id);
  if (!questionSet) {
    return res.status(404).json({
      success: false,
      error: 'Question set not found',
    });
  }

  // Fetch solution set
  const solutionSet = await solutionExtractionService.findById(solution_set_id);
  if (!solutionSet) {
    return res.status(404).json({
      success: false,
      error: 'Solution set not found',
    });
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
  // Questions are primary, solutions are added if they match
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

  res.json({
    success: true,
    data: {
      question_set: {
        id: questionSet.id,
        name: questionSet.name,
      },
      solution_set: {
        id: solutionSet.id,
        name: solutionSet.name,
      },
      book: questionSet.book,
      chapter: questionSet.chapter,
      total_lessons: lessons.length,
      lessons,
    },
  });
}));

export default router;
