import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BookOpen, X, Filter, FileQuestion, CheckCircle, Eye, Loader2, Code, Edit3, Save, Plus, Minus, CheckCheck, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import QuestionSetModal from './QuestionSetModal';
import SolutionSetModal from './SolutionSetModal';
import QuestionText from './QuestionText';

// Memoized component for a single item in view mode
const ItemViewMode = memo(function ItemViewMode({ item, index, onEdit }) {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">
          Q{item.question_label || index + 1}
        </span>
        <div className="flex items-center gap-2">
          {item.has_solution ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCheck className="w-4 h-4" />
              Solution matched
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="w-4 h-4" />
              No solution
            </span>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="mb-3">
        <QuestionText text={item.text || ''} className="text-sm" />
        {item.choices && item.choices.length > 0 && (
          <div className="mt-2 pl-4 space-y-1">
            {item.choices.map((choice, i) => (
              <QuestionText key={i} text={choice} className="text-sm text-gray-600" />
            ))}
          </div>
        )}
      </div>

      {/* Solution */}
      {(item.answer_key || item.worked_solution || item.explanation) && (
        <div className="border-t border-green-200 pt-3 mt-3">
          {item.answer_key && (
            <div className="text-sm">
              <span className="font-medium text-green-700">Answer:</span>{' '}
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold">
                {item.answer_key}
              </span>
            </div>
          )}
          {item.worked_solution && (
            <div className="mt-2">
              <span className="text-sm font-medium text-green-700">Solution:</span>
              <QuestionText text={item.worked_solution} className="text-sm text-gray-700 mt-1" />
            </div>
          )}
          {item.explanation && (
            <div className="mt-2">
              <span className="text-sm font-medium text-green-700">Explanation:</span>
              <QuestionText text={item.explanation} className="text-sm text-gray-700 mt-1" />
            </div>
          )}
        </div>
      )}
    </>
  );
});

// Memoized component for the items list
const ItemsList = memo(function ItemsList({
  editedItems,
  editingItemIndex,
  showJsonView,
  setEditingItemIndex,
  handleItemChange,
  handleChoiceChange,
  handleAddChoice,
  handleRemoveChoice,
}) {
  if (showJsonView) {
    // JSON View
    return (
      <div className="space-y-4">
        {editedItems.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {item.question_label || index + 1}
              </span>
              <span className="text-sm font-medium text-gray-500">question_solution_item_json</span>
              {item.has_solution ? (
                <span className="flex items-center gap-1 text-xs text-green-600 ml-auto">
                  <CheckCheck className="w-3 h-3" />
                  matched
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-orange-500 ml-auto">
                  <AlertCircle className="w-3 h-3" />
                  no solution
                </span>
              )}
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  // Formatted View with Edit capability
  return (
    <div className="space-y-4">
      {editedItems.map((item, index) => (
        <div
          key={index}
          className={`border rounded-lg p-4 ${item.has_solution ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}
        >
          {/* View Mode */}
          {editingItemIndex !== index && (
            <ItemViewMode
              item={item}
              index={index}
              onEdit={() => setEditingItemIndex(index)}
            />
          )}

          {/* Edit Mode */}
          {editingItemIndex === index && (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  <label className="text-sm font-medium text-gray-700">Question Label:</label>
                  <input
                    type="text"
                    value={item.question_label || ''}
                    onChange={(e) => handleItemChange(index, 'question_label', e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setEditingItemIndex(null)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCheck className="w-4 h-4" />
                  Done
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question:</label>
                <textarea
                  value={item.text || ''}
                  onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Choices */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Choices:</label>
                  <button
                    type="button"
                    onClick={() => handleAddChoice(index)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3 h-3" />
                    Add Choice
                  </button>
                </div>
                <div className="space-y-2">
                  {(item.choices || []).map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => handleChoiceChange(index, choiceIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder={`Choice ${choiceIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(index, choiceIndex)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution Fields */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-sm font-medium text-green-700 mb-2">Solution:</p>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Answer Key:</label>
                  <input
                    type="text"
                    value={item.answer_key || ''}
                    onChange={(e) => handleItemChange(index, 'answer_key', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                    placeholder="e.g., A, B, C, D"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Worked Solution:</label>
                  <textarea
                    value={item.worked_solution || ''}
                    onChange={(e) => handleItemChange(index, 'worked_solution', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
                    placeholder="Step-by-step solution..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Explanation:</label>
                  <textarea
                    value={item.explanation || ''}
                    onChange={(e) => handleItemChange(index, 'explanation', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500"
                    placeholder="Additional explanation (optional)..."
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
});

export default function PrepareLessonModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  // State for filters
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // State for selected sets
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState('');
  const [selectedSolutionSetId, setSelectedSolutionSetId] = useState('');

  // State for modals
  const [viewQuestionSet, setViewQuestionSet] = useState(null);
  const [viewSolutionSet, setViewSolutionSet] = useState(null);

  // State for prepared data
  const [preparedData, setPreparedData] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [showJsonView, setShowJsonView] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [commonParentSectionName, setCommonParentSectionName] = useState('');
  const [parentSectionName, setParentSectionName] = useState('');
  const [lessonItemCount, setLessonItemCount] = useState('');

  // Manual range mode state
  const [splitMode, setSplitMode] = useState('auto'); // 'auto' | 'manual'
  const [rangeConfigs, setRangeConfigs] = useState([
    { start: 1, end: '', lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }
  ]);

  // Question type state (for Auto Split mode)
  const [questionType, setQuestionType] = useState('OTHER');

  // Fetch books
  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
    enabled: isOpen,
  });

  // Fetch chapters for selected book
  const { data: chapters } = useQuery({
    queryKey: ['chapters', selectedBookId],
    queryFn: () => api.get(`/chapters/book/${selectedBookId}`),
    enabled: isOpen && !!selectedBookId,
  });

  // Fetch active job for default selections
  const { data: activeJob } = useQuery({
    queryKey: ['activeJob'],
    queryFn: () => api.get('/jobs/active'),
    enabled: isOpen,
  });

  // Set default filters from active job
  useEffect(() => {
    if (isOpen && activeJob?.data?.active_book_id && !selectedBookId) {
      setSelectedBookId(activeJob.data.active_book_id);
    }
    if (isOpen && activeJob?.data?.active_chapter_id && !selectedChapterId) {
      setSelectedChapterId(activeJob.data.active_chapter_id);
    }
  }, [isOpen, activeJob?.data?.active_book_id, activeJob?.data?.active_chapter_id]);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedQuestionSetId('');
      setSelectedSolutionSetId('');
      setPreparedData(null);
      setEditedItems([]);
      setEditingItemIndex(null);
      setShowJsonView(false);
      setLessonName('');
      setCommonParentSectionName('');
      setParentSectionName('');
      setLessonItemCount('');
      setSplitMode('auto');
      setRangeConfigs([{ start: 1, end: '', lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }]);
      setQuestionType('OTHER');
    }
  }, [isOpen]);

  // Reset set selections when book/chapter changes
  useEffect(() => {
    setSelectedQuestionSetId('');
    setSelectedSolutionSetId('');
  }, [selectedBookId, selectedChapterId]);

  // Fetch question sets filtered by book/chapter
  const { data: questionSets, isLoading: isLoadingQuestionSets } = useQuery({
    queryKey: ['questionSets', selectedBookId, selectedChapterId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBookId) params.append('bookId', selectedBookId);
      if (selectedChapterId) params.append('chapterId', selectedChapterId);
      const queryString = params.toString();
      return api.get(`/question-sets${queryString ? `?${queryString}` : ''}`);
    },
    enabled: isOpen,
  });

  // Fetch solution sets filtered by book/chapter
  const { data: solutionSets, isLoading: isLoadingSolutionSets } = useQuery({
    queryKey: ['solutionSets', selectedBookId, selectedChapterId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBookId) params.append('bookId', selectedBookId);
      if (selectedChapterId) params.append('chapterId', selectedChapterId);
      const queryString = params.toString();
      return api.get(`/solution-sets${queryString ? `?${queryString}` : ''}`);
    },
    enabled: isOpen,
  });

  // Fetch selected question set by ID
  const { data: selectedQuestionSet, isLoading: isLoadingSelectedQuestion } = useQuery({
    queryKey: ['questionSet', selectedQuestionSetId],
    queryFn: () => api.get(`/question-sets/${selectedQuestionSetId}`),
    enabled: isOpen && !!selectedQuestionSetId,
  });

  // Fetch selected solution set by ID
  const { data: selectedSolutionSet, isLoading: isLoadingSelectedSolution } = useQuery({
    queryKey: ['solutionSet', selectedSolutionSetId],
    queryFn: () => api.get(`/solution-sets/${selectedSolutionSetId}`),
    enabled: isOpen && !!selectedSolutionSetId,
  });

  // Prepare lesson mutation - calls API to merge questions and solutions
  const prepareLessonMutation = useMutation({
    mutationFn: () => api.post('/lessons/prepare', {
      question_set_id: selectedQuestionSetId,
      solution_set_id: selectedSolutionSetId,
    }),
    onSuccess: (response) => {
      setPreparedData(response.data);
      setEditedItems(response.data.items || []);
      setEditingItemIndex(null);
      // Reset range configs with total items available
      const totalItems = response.data.items?.length || 0;
      setRangeConfigs([{ start: 1, end: totalItems, lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }]);
    },
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: () => {
      const payload = {
        question_set_id: selectedQuestionSetId,
        solution_set_id: selectedSolutionSetId,
        items: editedItems,
        question_type: questionType,
      };

      if (splitMode === 'auto') {
        payload.name = lessonName.trim();
        payload.common_parent_section_name = commonParentSectionName.trim() || null;
        payload.parent_section_name = parentSectionName.trim() || null;
        payload.lesson_item_count = lessonItemCount ? parseInt(lessonItemCount, 10) : null;
      } else {
        // Manual mode - send range_configs with lesson_name and question_type per range
        payload.range_configs = rangeConfigs.map(config => ({
          start: parseInt(config.start, 10),
          end: parseInt(config.end, 10),
          lesson_name: config.lesson_name.trim(),
          parent_section_name: config.parent_section_name.trim() || null,
          common_parent_section_name: config.common_parent_section_name.trim() || null,
          question_type: config.question_type || 'OTHER',
        }));
        // Remove global question_type for manual mode since it's per-range
        delete payload.question_type;
      }

      return api.post('/lessons', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons']);
      handleClose();
    },
  });

  const sortedQuestionSets = questionSets?.data
    ? [...questionSets.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const sortedSolutionSets = solutionSets?.data
    ? [...solutionSets.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const canPrepareLesson = selectedQuestionSetId && selectedSolutionSetId;

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handlePrepareLesson = () => {
    prepareLessonMutation.mutate();
  };

  const handleCreateLesson = (e) => {
    e.preventDefault();
    if (canCreateLesson) {
      createLessonMutation.mutate();
    }
  };

  const handleClose = () => {
    setPreparedData(null);
    setEditedItems([]);
    setEditingItemIndex(null);
    setShowJsonView(false);
    setLessonName('');
    setCommonParentSectionName('');
    setParentSectionName('');
    setLessonItemCount('');
    setSplitMode('auto');
    setRangeConfigs([{ start: 1, end: '', lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }]);
    setQuestionType('OTHER');
    prepareLessonMutation.reset();
    createLessonMutation.reset();
    onClose();
  };

  const handleBackToSelection = () => {
    setPreparedData(null);
    setEditedItems([]);
    setEditingItemIndex(null);
    setShowJsonView(false);
    setLessonName('');
    setCommonParentSectionName('');
    setParentSectionName('');
    setLessonItemCount('');
    setSplitMode('auto');
    setRangeConfigs([{ start: 1, end: '', lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }]);
    setQuestionType('OTHER');
    prepareLessonMutation.reset();
  };

  // Handler to update a specific item field (memoized to prevent re-renders)
  const handleItemChange = useCallback((index, field, value) => {
    setEditedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Handler to update choices array (memoized)
  const handleChoiceChange = useCallback((itemIndex, choiceIndex, value) => {
    setEditedItems(prev => {
      const updated = [...prev];
      const choices = [...(updated[itemIndex].choices || [])];
      choices[choiceIndex] = value;
      updated[itemIndex] = { ...updated[itemIndex], choices };
      return updated;
    });
  }, []);

  // Handler to add a new choice (memoized)
  const handleAddChoice = useCallback((itemIndex) => {
    setEditedItems(prev => {
      const updated = [...prev];
      const choices = [...(updated[itemIndex].choices || []), ''];
      updated[itemIndex] = { ...updated[itemIndex], choices };
      return updated;
    });
  }, []);

  // Handler to remove a choice (memoized)
  const handleRemoveChoice = useCallback((itemIndex, choiceIndex) => {
    setEditedItems(prev => {
      const updated = [...prev];
      const choices = [...(updated[itemIndex].choices || [])];
      choices.splice(choiceIndex, 1);
      updated[itemIndex] = { ...updated[itemIndex], choices };
      return updated;
    });
  }, []);

  // Range config handlers
  const handleRangeConfigChange = useCallback((index, field, value) => {
    setRangeConfigs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleAddRangeConfig = useCallback(() => {
    setRangeConfigs(prev => {
      const lastRange = prev[prev.length - 1];
      const newStart = lastRange?.end ? parseInt(lastRange.end, 10) + 1 : 1;
      return [...prev, { start: newStart, end: '', lesson_name: '', parent_section_name: '', common_parent_section_name: '', question_type: 'OTHER' }];
    });
  }, []);

  const handleRemoveRangeConfig = useCallback((index) => {
    setRangeConfigs(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Validate range configs
  const rangeValidation = useMemo(() => {
    const totalItems = editedItems.length;
    const errors = [];
    const warnings = [];

    if (splitMode !== 'manual' || totalItems === 0) {
      return { errors, warnings, isValid: true };
    }

    // Check if range count exceeds total items
    if (rangeConfigs.length > totalItems) {
      errors.push(`Number of ranges (${rangeConfigs.length}) cannot exceed total items (${totalItems})`);
      return { errors, warnings, isValid: false };
    }

    // Check each range
    const sortedRanges = [...rangeConfigs]
      .map((config, i) => ({ ...config, originalIndex: i }))
      .filter(config => config.start !== '' && config.end !== '')
      .sort((a, b) => parseInt(a.start, 10) - parseInt(b.start, 10));

    for (let idx = 0; idx < rangeConfigs.length; idx++) {
      const config = rangeConfigs[idx];
      const start = parseInt(config.start, 10);
      const end = parseInt(config.end, 10);

      if (!config.lesson_name || !config.lesson_name.trim()) {
        errors.push(`Range ${idx + 1}: Lesson name is required`);
      }

      if (config.start === '' || config.end === '') {
        errors.push(`Range ${idx + 1}: Start and end values are required`);
        continue;
      }

      if (isNaN(start) || isNaN(end)) {
        errors.push(`Range ${idx + 1}: Start and end must be valid numbers`);
        continue;
      }

      if (start < 1) {
        errors.push(`Range ${idx + 1}: Start value must be >= 1`);
      }

      if (end > totalItems) {
        errors.push(`Range ${idx + 1}: End value must be <= ${totalItems} (total items)`);
      }

      if (start > end) {
        errors.push(`Range ${idx + 1}: Start (${start}) must be <= End (${end})`);
      }
    }

    // Check for overlaps
    for (let i = 1; i < sortedRanges.length; i++) {
      const prevEnd = parseInt(sortedRanges[i - 1].end, 10);
      const currStart = parseInt(sortedRanges[i].start, 10);
      if (currStart <= prevEnd) {
        errors.push(`Ranges overlap: ${sortedRanges[i - 1].start}-${sortedRanges[i - 1].end} and ${sortedRanges[i].start}-${sortedRanges[i].end}`);
      }
    }

    // Check for coverage gaps (warning only)
    if (errors.length === 0 && sortedRanges.length > 0) {
      const coveredItems = new Set();
      for (const config of sortedRanges) {
        for (let i = parseInt(config.start, 10); i <= parseInt(config.end, 10); i++) {
          coveredItems.add(i);
        }
      }
      const uncoveredCount = totalItems - coveredItems.size;
      if (uncoveredCount > 0) {
        warnings.push(`${uncoveredCount} items are not covered by any range`);
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }, [splitMode, rangeConfigs, editedItems.length]);

  // Check if form is valid for submission
  const canCreateLesson = useMemo(() => {
    if (splitMode === 'auto') {
      return lessonName.trim() !== '';
    }
    // Manual mode - validation includes lesson_name check per range
    return rangeValidation.isValid && rangeConfigs.some(c => c.start !== '' && c.end !== '' && c.lesson_name.trim() !== '');
  }, [lessonName, splitMode, rangeValidation.isValid, rangeConfigs]);

  if (!isOpen) return null;

  // Show prepared data with viewer/editor
  if (preparedData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-green-50">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Prepare Lesson - Preview</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {preparedData.book?.display_name && <span>{preparedData.book.display_name}</span>}
                  {preparedData.chapter?.display_name && (
                    <>
                      <span>-</span>
                      <span>{preparedData.chapter.display_name}</span>
                    </>
                  )}
                  <span>-</span>
                  <span className="text-green-600">{preparedData.summary?.matched} matched</span>
                  {preparedData.summary?.unmatched > 0 && (
                    <span className="text-orange-500">{preparedData.summary?.unmatched} unmatched</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showJsonView
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showJsonView ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {showJsonView ? 'View' : 'JSON'}
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content - Memoized to prevent re-renders when form inputs change */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50">
            <ItemsList
              editedItems={editedItems}
              editingItemIndex={editingItemIndex}
              showJsonView={showJsonView}
              setEditingItemIndex={setEditingItemIndex}
              handleItemChange={handleItemChange}
              handleChoiceChange={handleChoiceChange}
              handleAddChoice={handleAddChoice}
              handleRemoveChoice={handleRemoveChoice}
            />
          </div>

          {/* Footer - Create Lesson Form */}
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleCreateLesson} className="space-y-4">
              {/* Lesson Name and Question Type Row - Only shown in Auto Split mode */}
              {splitMode === 'auto' && (
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Name
                    </label>
                    <input
                      type="text"
                      value={lessonName}
                      onChange={(e) => setLessonName(e.target.value)}
                      placeholder="e.g., Chapter 3 Practice Problems"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="CHOICE_BASED">Choice Based</option>
                      <option value="PROOF_BASED">Proof Based</option>
                      <option value="MULTI_QUESTIONS">Multi Questions</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="flex items-center gap-6 py-2">
                <span className="text-sm font-medium text-gray-700">Split Mode:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitMode"
                    value="auto"
                    checked={splitMode === 'auto'}
                    onChange={() => setSplitMode('auto')}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Auto Split (Items per Lesson)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitMode"
                    value="manual"
                    checked={splitMode === 'manual'}
                    onChange={() => setSplitMode('manual')}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Manual Ranges</span>
                </label>
              </div>

              {/* Auto Split Mode UI */}
              {splitMode === 'auto' && (
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Section Name
                    </label>
                    <input
                      type="text"
                      value={parentSectionName}
                      onChange={(e) => setParentSectionName(e.target.value)}
                      placeholder="e.g., Section A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Common Parent Section Name
                    </label>
                    <input
                      type="text"
                      value={commonParentSectionName}
                      onChange={(e) => setCommonParentSectionName(e.target.value)}
                      placeholder="e.g., Algebra Basics"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Items per Lesson
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lessonItemCount}
                      onChange={(e) => setLessonItemCount(e.target.value)}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Manual Ranges Mode UI */}
              {splitMode === 'manual' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Range Configurations ({editedItems.length} items available)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddRangeConfig}
                      disabled={rangeConfigs.length >= editedItems.length}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Range
                    </button>
                  </div>

                  {/* Range Config Rows */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {rangeConfigs.map((config, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border space-y-2">
                        {/* Row 1: Lesson Name and Question Type */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Lesson Name *</label>
                            <input
                              type="text"
                              value={config.lesson_name}
                              onChange={(e) => handleRangeConfigChange(index, 'lesson_name', e.target.value)}
                              placeholder="e.g., Chapter 3 Problems"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-36">
                            <label className="block text-xs text-gray-500 mb-1">Question Type</label>
                            <select
                              value={config.question_type || 'OTHER'}
                              onChange={(e) => handleRangeConfigChange(index, 'question_type', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            >
                              <option value="CHOICE_BASED">Choice Based</option>
                              <option value="PROOF_BASED">Proof Based</option>
                              <option value="MULTI_QUESTIONS">Multi Questions</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRangeConfig(index)}
                            disabled={rangeConfigs.length <= 1}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:text-gray-300 disabled:hover:bg-transparent transition-colors mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Row 2: Range and Section Names */}
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <label className="block text-xs text-gray-500 mb-1">Start</label>
                            <input
                              type="number"
                              min="1"
                              max={editedItems.length}
                              value={config.start}
                              onChange={(e) => handleRangeConfigChange(index, 'start', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-20">
                            <label className="block text-xs text-gray-500 mb-1">End</label>
                            <input
                              type="number"
                              min="1"
                              max={editedItems.length}
                              value={config.end}
                              onChange={(e) => handleRangeConfigChange(index, 'end', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Parent Section Name</label>
                            <input
                              type="text"
                              value={config.parent_section_name}
                              onChange={(e) => handleRangeConfigChange(index, 'parent_section_name', e.target.value)}
                              placeholder="e.g., Section A"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Common Parent Section</label>
                            <input
                              type="text"
                              value={config.common_parent_section_name}
                              onChange={(e) => handleRangeConfigChange(index, 'common_parent_section_name', e.target.value)}
                              placeholder="e.g., Algebra"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Validation Messages */}
                  {rangeValidation.errors.length > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-600">
                        {rangeValidation.errors.map((error, i) => (
                          <div key={i}>{error}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rangeValidation.warnings.length > 0 && rangeValidation.errors.length === 0 && (
                    <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700">
                        {rangeValidation.warnings.map((warning, i) => (
                          <div key={i}>{warning}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  disabled={createLessonMutation.isPending}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canCreateLesson || createLessonMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {createLessonMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Lesson{splitMode === 'manual' && rangeConfigs.filter(c => c.start && c.end).length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
            {createLessonMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                Error: {createLessonMutation.error?.response?.data?.error || createLessonMutation.error?.message || 'Failed to create lesson'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main modal - Selection UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-green-50">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Prepare Lesson</h2>
              <p className="text-sm text-gray-500">Select questions and solutions to create a lesson</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Book/Chapter Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setSelectedChapterId('');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Books</option>
                {books?.data?.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.display_name || book.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                disabled={!selectedBookId}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Chapters</option>
                {chapters?.data?.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.display_name || chapter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Extracted Questions Section */}
          <div className="bg-white rounded-lg border mb-6">
            <div className="p-3 border-b bg-blue-50">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Extracted Questions</h3>
              </div>
            </div>
            <div className="p-4">
              <select
                value={selectedQuestionSetId}
                onChange={(e) => setSelectedQuestionSetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              >
                <option value="">Select Question Set</option>
                {isLoadingQuestionSets ? (
                  <option disabled>Loading...</option>
                ) : sortedQuestionSets.length === 0 ? (
                  <option disabled>No question sets available</option>
                ) : (
                  sortedQuestionSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name} ({set.total_questions || 0} questions)
                    </option>
                  ))
                )}
              </select>

              {selectedQuestionSetId && selectedQuestionSet?.data ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <FileQuestion className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium">{selectedQuestionSet.data.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{selectedQuestionSet.data.total_questions || 0}</td>
                        <td className="px-4 py-3">{getStatusBadge(selectedQuestionSet.data.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewQuestionSet(selectedQuestionSet.data)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : isLoadingSelectedQuestion ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a question set</p>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Solutions Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-3 border-b bg-purple-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Extracted Solutions</h3>
              </div>
            </div>
            <div className="p-4">
              <select
                value={selectedSolutionSetId}
                onChange={(e) => setSelectedSolutionSetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4"
              >
                <option value="">Select Solution Set</option>
                {isLoadingSolutionSets ? (
                  <option disabled>Loading...</option>
                ) : sortedSolutionSets.length === 0 ? (
                  <option disabled>No solution sets available</option>
                ) : (
                  sortedSolutionSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name} ({set.total_solutions || 0} solutions)
                    </option>
                  ))
                )}
              </select>

              {selectedSolutionSetId && selectedSolutionSet?.data ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solutions</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                            <span className="text-sm font-medium">{selectedSolutionSet.data.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{selectedSolutionSet.data.total_solutions || 0}</td>
                        <td className="px-4 py-3">{getStatusBadge(selectedSolutionSet.data.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewSolutionSet(selectedSolutionSet.data)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : isLoadingSelectedSolution ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a solution set</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrepareLesson}
            disabled={!canPrepareLesson || prepareLessonMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {prepareLessonMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Prepare Lesson
              </>
            )}
          </button>
        </div>
      </div>

      {/* Question Set Modal */}
      <QuestionSetModal
        isOpen={!!viewQuestionSet}
        onClose={() => setViewQuestionSet(null)}
        questionSet={viewQuestionSet}
      />

      {/* Solution Set Modal */}
      <SolutionSetModal
        isOpen={!!viewSolutionSet}
        onClose={() => setViewSolutionSet(null)}
        solutionSet={viewSolutionSet}
      />
    </div>
  );
}
