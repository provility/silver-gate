import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';

export default function CreateLessonModal({ isOpen, onClose, bookId, chapterId, bookName, chapterName }) {
  const queryClient = useQueryClient();

  const [lessonName, setLessonName] = useState('');
  const [questionType, setQuestionType] = useState('OTHER');
  const [parentSectionName, setParentSectionName] = useState('');
  const [commonParentSectionName, setCommonParentSectionName] = useState('');
  const [itemsPerLesson, setItemsPerLesson] = useState('');

  const resetForm = () => {
    setLessonName('');
    setQuestionType('OTHER');
    setParentSectionName('');
    setCommonParentSectionName('');
    setItemsPerLesson('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const createLessonMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: lessonName.trim(),
        question_type: questionType,
        parent_section_name: parentSectionName.trim() || null,
        common_parent_section_name: commonParentSectionName.trim() || null,
        lesson_item_count: itemsPerLesson ? parseInt(itemsPerLesson, 10) : null,
        book_id: bookId || null,
        chapter_id: chapterId || null,
      };
      return api.post('/lessons/empty', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      await queryClient.refetchQueries({ queryKey: ['lessons'] });
      handleClose();
    },
  });

  const canCreate = lessonName.trim().length > 0 && !createLessonMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canCreate) createLessonMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Create Lesson</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
            <div className="flex-1">
              <span className="font-medium text-gray-600">Book:</span>{' '}
              <span className="text-gray-900">{bookName || '—'}</span>
            </div>
            <div className="flex-1">
              <span className="font-medium text-gray-600">Chapter:</span>{' '}
              <span className="text-gray-900">{chapterName || '—'}</span>
            </div>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CHOICE_BASED">Choice Based</option>
                <option value="PROOF_BASED">Proof Based</option>
                <option value="MULTI_QUESTIONS">Multi Questions</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items per Lesson
              </label>
              <input
                type="number"
                min="1"
                value={itemsPerLesson}
                onChange={(e) => setItemsPerLesson(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {createLessonMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {createLessonMutation.error?.response?.data?.message ||
                  createLessonMutation.error?.message ||
                  'Failed to create lesson'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {createLessonMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Create Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
