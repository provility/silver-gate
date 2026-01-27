import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Book, ChevronRight, ChevronDown, FileText, Plus, X, Pencil, Trash2 } from 'lucide-react';

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [expandedBooks, setExpandedBooks] = useState({});
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, item: null });
  const [newBook, setNewBook] = useState({ name: '', display_name: '', description: '', ref_id: '' });
  const [newChapter, setNewChapter] = useState({ name: '', display_name: '', chapter_number: '', ref_id: '' });

  // Fetch books
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  // Fetch chapters for expanded books
  const { data: chaptersMap } = useQuery({
    queryKey: ['allChapters'],
    queryFn: () => api.get('/chapters'),
    select: (data) => {
      const map = {};
      data.data?.forEach((chapter) => {
        if (!map[chapter.book_id]) {
          map[chapter.book_id] = [];
        }
        map[chapter.book_id].push(chapter);
      });
      return map;
    },
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: (data) => api.post('/books', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setShowAddBookModal(false);
      setNewBook({ name: '', display_name: '', description: '', ref_id: '' });
    },
  });

  // Add chapter mutation
  const addChapterMutation = useMutation({
    mutationFn: (data) => api.post('/chapters', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      setShowAddChapterModal(null);
      setNewChapter({ name: '', display_name: '', chapter_number: '', ref_id: '' });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/books/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setEditingBook(null);
    },
  });

  // Update chapter mutation
  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/chapters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      setEditingChapter(null);
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      setDeleteConfirm({ type: null, item: null });
    },
  });

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: (id) => api.delete(`/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allChapters'] });
      setDeleteConfirm({ type: null, item: null });
    },
  });

  const toggleBook = (bookId) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const handleAddBook = () => {
    if (newBook.name.trim()) {
      addBookMutation.mutate({
        ...newBook,
        ref_id: newBook.ref_id.trim() || null,
      });
    }
  };

  const handleAddChapter = () => {
    if (newChapter.name.trim() && showAddChapterModal) {
      addChapterMutation.mutate({
        ...newChapter,
        book_id: showAddChapterModal,
        chapter_number: newChapter.chapter_number ? parseInt(newChapter.chapter_number, 10) : null,
        ref_id: newChapter.ref_id.trim() || null,
      });
    }
  };

  const handleUpdateBook = () => {
    if (editingBook && editingBook.name.trim()) {
      updateBookMutation.mutate({
        id: editingBook.id,
        data: {
          name: editingBook.name,
          display_name: editingBook.display_name,
          description: editingBook.description,
        },
      });
    }
  };

  const handleUpdateChapter = () => {
    if (editingChapter && editingChapter.name.trim()) {
      updateChapterMutation.mutate({
        id: editingChapter.id,
        data: {
          name: editingChapter.name,
          display_name: editingChapter.display_name,
          chapter_number: editingChapter.chapter_number ? parseInt(editingChapter.chapter_number, 10) : null,
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteConfirm.type === 'book') {
      deleteBookMutation.mutate(deleteConfirm.item.id);
    } else if (deleteConfirm.type === 'chapter') {
      deleteChapterMutation.mutate(deleteConfirm.item.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Books & Chapters</h1>
          <p className="text-gray-500 mt-1">Manage books and their chapters</p>
        </div>

        <button
          onClick={() => setShowAddBookModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Book
        </button>
      </div>

      {booksLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading...
        </div>
      ) : books?.data?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Book className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No books found</p>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Add your first book
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {books?.data?.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBook(book.id)}
              >
                <div className="flex items-center">
                  {expandedBooks[book.id] ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 mr-3" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 mr-3" />
                  )}
                  <Book className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {book.display_name || book.name}
                    </p>
                    {book.description && (
                      <p className="text-sm text-gray-500">{book.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {chaptersMap?.[book.id]?.length || 0} chapters
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBook({ ...book });
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit book"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ type: 'book', item: book });
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedBooks[book.id] && (
                <div className="border-t px-4 py-2">
                  {chaptersMap?.[book.id]?.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {chaptersMap[book.id].map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-green-600 mr-3" />
                            <span className="text-gray-700">
                              {chapter.chapter_number && (
                                <span className="text-gray-500 mr-2">
                                  Ch {chapter.chapter_number}:
                                </span>
                              )}
                              {chapter.display_name || chapter.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChapter({ ...chapter });
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit chapter"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ type: 'chapter', item: chapter });
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete chapter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-2">No chapters yet</p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddChapterModal(book.id);
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm py-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Chapter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Add Book</h2>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (ID)
                </label>
                <input
                  type="text"
                  value={newBook.name}
                  onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., math_grade10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newBook.display_name}
                  onChange={(e) => setNewBook({ ...newBook, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mathematics Grade 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ref ID (MongoDB)
                </label>
                <input
                  type="text"
                  value={newBook.ref_id}
                  onChange={(e) => setNewBook({ ...newBook, ref_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional - auto-generated if empty"
                  maxLength={24}
                />
                <p className="text-xs text-gray-500 mt-1">24-character hex string for MongoDB sync</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowAddBookModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBook}
                disabled={!newBook.name.trim() || addBookMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addBookMutation.isPending ? 'Adding...' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Add Chapter</h2>
              <button
                onClick={() => setShowAddChapterModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Number
                </label>
                <input
                  type="number"
                  value={newChapter.chapter_number}
                  onChange={(e) => setNewChapter({ ...newChapter, chapter_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (ID)
                </label>
                <input
                  type="text"
                  value={newChapter.name}
                  onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., algebra_basics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newChapter.display_name}
                  onChange={(e) => setNewChapter({ ...newChapter, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Algebra Basics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ref ID (MongoDB)
                </label>
                <input
                  type="text"
                  value={newChapter.ref_id}
                  onChange={(e) => setNewChapter({ ...newChapter, ref_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional - auto-generated if empty"
                  maxLength={24}
                />
                <p className="text-xs text-gray-500 mt-1">24-character hex string for MongoDB sync</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowAddChapterModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChapter}
                disabled={!newChapter.name.trim() || addChapterMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addChapterMutation.isPending ? 'Adding...' : 'Add Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Edit Book</h2>
              <button
                onClick={() => setEditingBook(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (ID)
                </label>
                <input
                  type="text"
                  value={editingBook.name}
                  onChange={(e) => setEditingBook({ ...editingBook, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., math_grade10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editingBook.display_name || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mathematics Grade 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingBook.description || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditingBook(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBook}
                disabled={!editingBook.name.trim() || updateBookMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateBookMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Edit Chapter</h2>
              <button
                onClick={() => setEditingChapter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Number
                </label>
                <input
                  type="number"
                  value={editingChapter.chapter_number || ''}
                  onChange={(e) => setEditingChapter({ ...editingChapter, chapter_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (ID)
                </label>
                <input
                  type="text"
                  value={editingChapter.name}
                  onChange={(e) => setEditingChapter({ ...editingChapter, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., algebra_basics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editingChapter.display_name || ''}
                  onChange={(e) => setEditingChapter({ ...editingChapter, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Algebra Basics"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setEditingChapter(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateChapter}
                disabled={!editingChapter.name.trim() || updateChapterMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateChapterMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Delete {deleteConfirm.type === 'book' ? 'Book' : 'Chapter'}
              </h2>
              <button
                onClick={() => setDeleteConfirm({ type: null, item: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-800">
                  {deleteConfirm.item?.display_name || deleteConfirm.item?.name}
                </span>
                ?
                {deleteConfirm.type === 'book' && (
                  <span className="block mt-2 text-red-600 text-sm">
                    This will also delete all chapters in this book.
                  </span>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setDeleteConfirm({ type: null, item: null })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBookMutation.isPending || deleteChapterMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteBookMutation.isPending || deleteChapterMutation.isPending
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
