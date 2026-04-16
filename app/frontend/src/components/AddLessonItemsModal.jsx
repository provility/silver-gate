import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { X, Loader2, AlertCircle, CheckCheck, Save, Square, CheckSquare, Code, Eye } from 'lucide-react';
import QuestionText from './QuestionText';

function ItemsPreview({ items, selectable, selectedIndices, onToggle }) {
  if (!items.length) {
    return <div className="p-6 text-sm text-gray-500">No items to display.</div>;
  }
  return (
    <div className="divide-y">
      {items.map((item, idx) => {
        const isSelected = selectable && selectedIndices?.has(idx);
        const rowClass = selectable
          ? `p-4 ${isSelected ? 'bg-green-50' : 'bg-white'} hover:bg-gray-50 cursor-pointer`
          : 'p-4 bg-white';
        return (
          <div
            key={idx}
            className={rowClass}
            onClick={selectable ? () => onToggle(idx) : undefined}
          >
            <div className="flex items-start gap-3">
              {selectable && (
                <div className="mt-1 text-green-600">
                  {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-700">
                    Q{item.question_label ?? idx + 1}
                  </span>
                  {item.has_solution && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCheck className="w-4 h-4" /> Solution matched
                    </span>
                  )}
                </div>
                <QuestionText text={item.text || ''} className="text-sm" />
                {item.choices && item.choices.length > 0 && (
                  <div className="mt-2 pl-4 space-y-1">
                    {item.choices.map((c, i) => (
                      <QuestionText key={i} text={c} className="text-sm text-gray-600" />
                    ))}
                  </div>
                )}
                {(item.answer_key || item.worked_solution || item.explanation) && (
                  <div className="border-t mt-3 pt-2 text-sm space-y-1">
                    {item.answer_key && (
                      <div>
                        <span className="font-medium text-green-700">Answer:</span>{' '}
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold">
                          {item.answer_key}
                        </span>
                      </div>
                    )}
                    {item.worked_solution && (
                      <div>
                        <span className="font-medium text-green-700">Solution:</span>
                        <QuestionText text={item.worked_solution} className="text-sm text-gray-700" />
                      </div>
                    )}
                    {item.explanation && (
                      <div>
                        <span className="font-medium text-green-700">Explanation:</span>
                        <QuestionText text={item.explanation} className="text-sm text-gray-700" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AddLessonItemsModal({ isOpen, onClose, lesson }) {
  const queryClient = useQueryClient();

  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState('');
  const [selectedSolutionSetId, setSelectedSolutionSetId] = useState('');

  const lessonQuestionType = lesson?.lesson_items?.[0]?.question_type || 'OTHER';
  const [questionType, setQuestionType] = useState(lessonQuestionType);

  useEffect(() => {
    setQuestionType(lessonQuestionType);
  }, [lessonQuestionType]);

  const [fetchedItems, setFetchedItems] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const [primaryTab, setPrimaryTab] = useState('fetched'); // 'fetched' | 'selected'
  const [selectedSubTab, setSelectedSubTab] = useState('editor'); // 'editor' | 'preview'

  const [selectedJsonText, setSelectedJsonText] = useState('');
  const [selectedParsedItems, setSelectedParsedItems] = useState([]);
  const [jsonError, setJsonError] = useState(null);

  const bookId = lesson?.book_id || '';
  const chapterId = lesson?.chapter_id || '';

  const resetAll = () => {
    setSelectedQuestionSetId('');
    setSelectedSolutionSetId('');
    setQuestionType(lessonQuestionType);
    setFetchedItems([]);
    setSelectedIndices(new Set());
    setPrimaryTab('fetched');
    setSelectedSubTab('editor');
    setSelectedJsonText('');
    setSelectedParsedItems([]);
    setJsonError(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const { data: questionSets } = useQuery({
    queryKey: ['questionSets', bookId, chapterId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (bookId) params.append('bookId', bookId);
      if (chapterId) params.append('chapterId', chapterId);
      const qs = params.toString();
      return api.get(`/question-sets${qs ? `?${qs}` : ''}`);
    },
    enabled: isOpen,
  });

  const { data: solutionSets } = useQuery({
    queryKey: ['solutionSets', bookId, chapterId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (bookId) params.append('bookId', bookId);
      if (chapterId) params.append('chapterId', chapterId);
      const qs = params.toString();
      return api.get(`/solution-sets${qs ? `?${qs}` : ''}`);
    },
    enabled: isOpen,
  });

  const sortedQuestionSets = useMemo(
    () => (questionSets?.data ? [...questionSets.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []),
    [questionSets]
  );

  const sortedSolutionSets = useMemo(
    () => (solutionSets?.data ? [...solutionSets.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []),
    [solutionSets]
  );

  const prepareMutation = useMutation({
    mutationFn: async () => {
      const [prepared, freshLesson] = await Promise.all([
        api.post('/lessons/prepare-items', {
          question_set_id: selectedQuestionSetId,
          solution_set_id: selectedSolutionSetId || null,
        }),
        lesson?.id ? api.get(`/lessons/${lesson.id}`) : Promise.resolve(null),
      ]);
      return { prepared, freshLesson };
    },
    onSuccess: ({ prepared, freshLesson }) => {
      const items = prepared.data.items || [];
      const currentItems = freshLesson?.data?.lesson_items || lesson?.lesson_items || [];
      const existingLabels = new Set(
        currentItems
          .map((li) => li.question_label)
          .filter((l) => l !== null && l !== undefined)
          .map((l) => String(l))
      );
      const filtered = items.filter(
        (item) => !existingLabels.has(String(item.question_label))
      );
      setFetchedItems(filtered);
      setSelectedIndices(new Set());
      setSelectedJsonText('');
      setSelectedParsedItems([]);
      setJsonError(null);
      setPrimaryTab('fetched');
    },
  });

  // Whenever selection changes, rebuild the selected JSON from the fetched items.
  // This discards any in-tab edits in "Selected Items → JSON Editor" — that is
  // intentional: the selection drives what's editable.
  useEffect(() => {
    const picked = [...selectedIndices]
      .sort((a, b) => a - b)
      .map((idx) => {
        const item = fetchedItems[idx] || {};
        const { has_solution, ...rest } = item;
        return rest;
      });
    setSelectedJsonText(JSON.stringify(picked, null, 2));
    setSelectedParsedItems(picked);
    setJsonError(null);
  }, [selectedIndices, fetchedItems]);

  // When switching into the Selected > Preview sub-tab, parse the latest JSON.
  useEffect(() => {
    if (primaryTab !== 'selected' || selectedSubTab !== 'preview') return;
    try {
      const parsed = JSON.parse(selectedJsonText || '[]');
      if (!Array.isArray(parsed)) {
        setJsonError('JSON must be an array of items');
        return;
      }
      setSelectedParsedItems(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  }, [primaryTab, selectedSubTab, selectedJsonText]);

  const appendMutation = useMutation({
    mutationFn: () => {
      // Ensure latest JSON is parsed before submit
      let itemsToSend = selectedParsedItems;
      try {
        const parsed = JSON.parse(selectedJsonText || '[]');
        if (Array.isArray(parsed)) itemsToSend = parsed;
      } catch {
        // keep previous parsed items
      }
      return api.post(`/lessons/${lesson.id}/items`, {
        items: itemsToSend,
        question_type: questionType,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      await queryClient.refetchQueries({ queryKey: ['lessons'] });
      handleClose();
    },
  });

  const toggleIndex = (idx) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedIndices(new Set(fetchedItems.map((_, i) => i)));
  const deselectAll = () => setSelectedIndices(new Set());

  const canPrepare = !!selectedQuestionSetId && !prepareMutation.isPending;
  const hasFetched = fetchedItems.length > 0;
  const selectedCount = selectedIndices.size;
  const canSubmit = selectedCount > 0 && !appendMutation.isPending && !jsonError;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              Add Lesson Items {lesson?.name ? `— ${lesson.name}` : ''}
            </h2>
            {lesson && (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                {lesson.book?.display_name || lesson.book?.name ? (
                  <span>
                    <span className="font-medium text-gray-500">Book:</span>{' '}
                    {lesson.book.display_name || lesson.book.name}
                  </span>
                ) : null}
                {lesson.chapter?.display_name || lesson.chapter?.name ? (
                  <span>
                    <span className="font-medium text-gray-500">Chapter:</span>{' '}
                    {lesson.chapter.display_name || lesson.chapter.name}
                  </span>
                ) : null}
                {lesson.common_parent_section_name && (
                  <span>
                    <span className="font-medium text-gray-500">Common Section:</span>{' '}
                    {lesson.common_parent_section_name}
                  </span>
                )}
                {lesson.parent_section_name && (
                  <span>
                    <span className="font-medium text-gray-500">Section:</span>{' '}
                    {lesson.parent_section_name}
                  </span>
                )}
                {lesson.question_range && (
                  <span>
                    <span className="font-medium text-gray-500">Range:</span>{' '}
                    {lesson.question_range}
                  </span>
                )}
                <span>
                  <span className="font-medium text-gray-500">Items:</span>{' '}
                  {lesson.lesson_items?.length ?? 0}
                </span>
              </div>
            )}
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extracted Questions <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedQuestionSetId}
                onChange={(e) => setSelectedQuestionSetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a question set</option>
                {sortedQuestionSets.map((qs) => (
                  <option key={qs.id} value={qs.id}>
                    {qs.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extracted Solutions</label>
              <select
                value={selectedSolutionSetId}
                onChange={(e) => setSelectedSolutionSetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">(Optional) Select a solution set</option>
                {sortedSolutionSets.map((ss) => (
                  <option key={ss.id} value={ss.id}>
                    {ss.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CHOICE_BASED">Choice Based</option>
                <option value="PROOF_BASED">Proof Based</option>
                <option value="MULTI_QUESTIONS">Multi Questions</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => prepareMutation.mutate()}
              disabled={!canPrepare}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {prepareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {hasFetched ? 'Re-fetch Items' : 'Fetch Items'}
            </button>
            {prepareMutation.isError && (
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{prepareMutation.error?.response?.data?.error || prepareMutation.error?.message || 'Failed to fetch items'}</span>
              </div>
            )}
          </div>

          {hasFetched && (
            <div className="border rounded-lg overflow-hidden">
              {/* Primary tabs */}
              <div className="flex items-center border-b bg-gray-50">
                <button
                  type="button"
                  onClick={() => setPrimaryTab('fetched')}
                  className={`px-4 py-2 text-sm font-medium border-r ${
                    primaryTab === 'fetched'
                      ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Fetched Items ({fetchedItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryTab('selected')}
                  className={`px-4 py-2 text-sm font-medium ${
                    primaryTab === 'selected'
                      ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Selected Items ({selectedCount})
                </button>

                {primaryTab === 'fetched' && (
                  <div className="ml-auto flex items-center gap-2 pr-3">
                    <span className="text-sm text-gray-600">
                      {fetchedItems.length} items ·{' '}
                      <span className="font-medium text-green-700">{selectedCount}</span> selected
                    </span>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {/* Fetched Items: preview only, with selection */}
              {primaryTab === 'fetched' && (
                <div className="max-h-[46vh] overflow-y-auto">
                  <ItemsPreview
                    items={fetchedItems}
                    selectable
                    selectedIndices={selectedIndices}
                    onToggle={toggleIndex}
                  />
                </div>
              )}

              {/* Selected Items: sub-tabs JSON Editor / Preview */}
              {primaryTab === 'selected' && (
                <div>
                  <div className="flex items-center border-b bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setSelectedSubTab('editor')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-r ${
                        selectedSubTab === 'editor'
                          ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      JSON Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSubTab('preview')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                        selectedSubTab === 'preview'
                          ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>

                  {selectedCount === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                      No items selected. Go to the <span className="font-medium">Fetched Items</span> tab and select some first.
                    </div>
                  ) : selectedSubTab === 'editor' ? (
                    <div>
                      <textarea
                        value={selectedJsonText}
                        onChange={(e) => {
                          setSelectedJsonText(e.target.value);
                          setJsonError(null);
                        }}
                        spellCheck={false}
                        className="w-full h-[46vh] p-3 font-mono text-xs border-0 focus:outline-none focus:ring-0 resize-none"
                      />
                      {jsonError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border-t border-red-200 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <span>Invalid JSON: {jsonError}</span>
                        </div>
                      )}
                    </div>
                  ) : jsonError ? (
                    <div className="p-6 text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <span>Cannot preview — fix the JSON in the editor tab first: {jsonError}</span>
                    </div>
                  ) : (
                    <div className="max-h-[46vh] overflow-y-auto">
                      <ItemsPreview items={selectedParsedItems} selectable={false} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {appendMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>
                {appendMutation.error?.response?.data?.error || appendMutation.error?.message || 'Failed to add items'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => appendMutation.mutate()}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {appendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Add {selectedCount > 0 ? `${selectedCount} ` : ''}Items
          </button>
        </div>
      </div>
    </div>
  );
}
