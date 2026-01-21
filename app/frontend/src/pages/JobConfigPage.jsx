import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Book, FileText, Save, CheckCircle, HelpCircle, FileQuestion } from 'lucide-react';

export default function JobConfigPage() {
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('question');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch books
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  // Fetch chapters for selected book
  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', selectedBookId],
    queryFn: () => api.get(`/chapters/book/${selectedBookId}`),
    enabled: !!selectedBookId,
  });

  // Fetch active job
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['activeJob'],
    queryFn: () => api.get('/jobs/active'),
  });

  // Set active job mutation
  const setActiveJobMutation = useMutation({
    mutationFn: (data) => api.post('/jobs/active', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeJob'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Initialize form with active job data
  useEffect(() => {
    if (activeJob?.data) {
      if (activeJob.data.active_book_id) {
        setSelectedBookId(activeJob.data.active_book_id);
      }
      if (activeJob.data.active_chapter_id) {
        setSelectedChapterId(activeJob.data.active_chapter_id);
      }
      if (activeJob.data.active_item_type) {
        setSelectedItemType(activeJob.data.active_item_type);
      }
    }
  }, [activeJob]);

  // Reset chapter when book changes
  useEffect(() => {
    if (selectedBookId && activeJob?.data?.active_book_id !== selectedBookId) {
      setSelectedChapterId('');
    }
  }, [selectedBookId, activeJob]);

  const handleSave = () => {
    if (selectedBookId && selectedChapterId) {
      setActiveJobMutation.mutate({
        book_id: selectedBookId,
        chapter_id: selectedChapterId,
        item_type: selectedItemType,
      });
    }
  };

  const isLoading = booksLoading || jobLoading;
  const canSave = selectedBookId && selectedChapterId && !setActiveJobMutation.isPending;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Job Configuration</h1>
        <p className="text-gray-500 mt-1">
          Configure the active book, chapter, and scan mode for scanning items
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Active Job */}
          {activeJob?.data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-700 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Current Active Job</span>
              </div>
              <p className="text-green-800">
                <span className="font-medium">Book:</span>{' '}
                {activeJob.data.active_book?.display_name || activeJob.data.active_book?.name || 'Not set'}
              </p>
              <p className="text-green-800">
                <span className="font-medium">Chapter:</span>{' '}
                {activeJob.data.active_chapter?.display_name || activeJob.data.active_chapter?.name || 'Not set'}
              </p>
              <p className="text-green-800">
                <span className="font-medium">Scan Mode:</span>{' '}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                  activeJob.data.active_item_type === 'question'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {activeJob.data.active_item_type === 'question' ? 'Questions' : 'Solutions'}
                </span>
              </p>
            </div>
          )}

          {/* Book Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Book className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Select Book</h2>
            </div>

            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a book --</option>
              {books?.data?.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.display_name || book.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Select Chapter</h2>
            </div>

            {!selectedBookId ? (
              <div className="text-gray-500 text-center py-4">
                Please select a book first
              </div>
            ) : chaptersLoading ? (
              <div className="text-gray-500 text-center py-4">
                Loading chapters...
              </div>
            ) : chapters?.data?.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No chapters found for this book
              </div>
            ) : (
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a chapter --</option>
                {chapters?.data?.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.chapter_number ? `Ch ${chapter.chapter_number}: ` : ''}
                    {chapter.display_name || chapter.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scan Mode Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileQuestion className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Scan Mode</h2>
            </div>

            <div className="flex gap-4">
              <label
                className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedItemType === 'question'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="question"
                  checked={selectedItemType === 'question'}
                  onChange={(e) => setSelectedItemType(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-medium">Questions</span>
                  <p className="text-sm text-gray-500 mt-1">Scan question papers</p>
                </div>
              </label>

              <label
                className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedItemType === 'solution'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="itemType"
                  value="solution"
                  checked={selectedItemType === 'solution'}
                  onChange={(e) => setSelectedItemType(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-medium">Solutions</span>
                  <p className="text-sm text-gray-500 mt-1">Scan solution pages</p>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                canSave
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {setActiveJobMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>

            {saveSuccess && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Configuration saved successfully!
              </span>
            )}

            {setActiveJobMutation.isError && (
              <span className="text-red-600">
                Error: {setActiveJobMutation.error.message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
