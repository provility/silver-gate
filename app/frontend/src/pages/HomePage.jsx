import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Settings,
  Book,
  FileText,
  ScanLine,
  Plus,
  Trash2,
  X,
  CheckSquare,
  FileQuestion,
  Filter,
  HelpCircle,
  CheckCircle,
  Save,
  Pencil,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('job');

  const tabs = [
    { id: 'job', label: 'Active Job', icon: Settings },
    { id: 'books', label: 'Books', icon: Book },
    { id: 'chapters', label: 'Chapters', icon: FileText },
    { id: 'scanned', label: 'Scanned Items', icon: ScanLine },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 mr-2 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'job' && <ActiveJobTab />}
      {activeTab === 'books' && <BooksTab />}
      {activeTab === 'chapters' && <ChaptersTab />}
      {activeTab === 'scanned' && <ScannedItemsTab />}
    </div>
  );
}

// ============ ACTIVE JOB TAB ============
function ActiveJobTab() {
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('question');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  const { data: chapters } = useQuery({
    queryKey: ['chapters', selectedBookId],
    queryFn: () => api.get(`/chapters/book/${selectedBookId}`),
    enabled: !!selectedBookId,
  });

  const { data: activeJob, isLoading } = useQuery({
    queryKey: ['activeJob'],
    queryFn: () => api.get('/jobs/active'),
  });

  const setActiveJobMutation = useMutation({
    mutationFn: (data) => api.post('/jobs/active', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeJob'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  useEffect(() => {
    if (activeJob?.data) {
      if (activeJob.data.active_book_id) setSelectedBookId(activeJob.data.active_book_id);
      if (activeJob.data.active_chapter_id) setSelectedChapterId(activeJob.data.active_chapter_id);
      if (activeJob.data.active_item_type) setSelectedItemType(activeJob.data.active_item_type);
    }
  }, [activeJob]);

  const handleSave = () => {
    if (selectedBookId && selectedChapterId) {
      setActiveJobMutation.mutate({
        book_id: selectedBookId,
        chapter_id: selectedChapterId,
        item_type: selectedItemType,
      });
    }
  };

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Active Job Configuration</h2>
        <p className="text-gray-500 text-sm mt-1">Set the book, chapter, and scan mode for incoming items</p>
      </div>

      {activeJob?.data?.active_book_id && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center text-green-700 mb-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Current Active Job</span>
          </div>
          <p className="text-green-800 text-sm">
            <span className="font-medium">Book:</span> {activeJob.data.active_book?.display_name || 'N/A'} |{' '}
            <span className="font-medium">Chapter:</span> {activeJob.data.active_chapter?.display_name || 'N/A'} |{' '}
            <span className="font-medium">Mode:</span> {activeJob.data.active_item_type || 'question'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Book</label>
          <select
            value={selectedBookId}
            onChange={(e) => { setSelectedBookId(e.target.value); setSelectedChapterId(''); }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select book...</option>
            {books?.data?.map((book) => (
              <option key={book.id} value={book.id}>{book.display_name || book.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            disabled={!selectedBookId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select chapter...</option>
            {chapters?.data?.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.chapter_number ? `Ch ${ch.chapter_number}: ` : ''}{ch.display_name || ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scan Mode</label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${
            selectedItemType === 'question' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <input type="radio" value="question" checked={selectedItemType === 'question'}
              onChange={(e) => setSelectedItemType(e.target.value)} className="sr-only" />
            <HelpCircle className="w-5 h-5 mr-2" />
            <span>Questions</span>
          </label>
          <label className={`flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer ${
            selectedItemType === 'solution' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
          }`}>
            <input type="radio" value="solution" checked={selectedItemType === 'solution'}
              onChange={(e) => setSelectedItemType(e.target.value)} className="sr-only" />
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Solutions</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!selectedBookId || !selectedChapterId || setActiveJobMutation.isPending}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5 mr-2" />
          {setActiveJobMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
        {saveSuccess && <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Saved!</span>}
      </div>
    </div>
  );
}

// ============ BOOKS TAB ============
function BooksTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({ name: '', display_name: '', description: '' });

  const { data: books, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/books', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/books/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  const openCreate = () => { setEditingBook(null); setFormData({ name: '', display_name: '', description: '' }); setShowModal(true); };
  const openEdit = (book) => { setEditingBook(book); setFormData({ name: book.name, display_name: book.display_name || '', description: book.description || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingBook(null); setFormData({ name: '', display_name: '', description: '' }); };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Books</h2>
          <p className="text-gray-500 text-sm">Manage your book collection</p>
        </div>
        <button onClick={openCreate} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" /> Add Book
        </button>
      </div>

      {books?.data?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Book className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No books found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {books?.data?.map((book) => (
            <div key={book.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">{book.display_name || book.name}</p>
                {book.description && <p className="text-sm text-gray-500">{book.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(book)} className="p-2 text-gray-400 hover:text-blue-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(book.id)} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingBook ? 'Edit Book' : 'Add Book'} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (ID)</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., math_grade10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input type="text" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Mathematics Grade 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" rows={2} placeholder="Optional description" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={handleSubmit} disabled={!formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {editingBook ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ CHAPTERS TAB ============
function ChaptersTab() {
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({ name: '', display_name: '', chapter_number: '' });

  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  const { data: chapters, isLoading } = useQuery({
    queryKey: ['chapters', selectedBookId],
    queryFn: () => api.get(`/chapters/book/${selectedBookId}`),
    enabled: !!selectedBookId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/chapters', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chapters'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/chapters/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['chapters'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/chapters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chapters'] }),
  });

  const openCreate = () => { setEditingChapter(null); setFormData({ name: '', display_name: '', chapter_number: '' }); setShowModal(true); };
  const openEdit = (ch) => { setEditingChapter(ch); setFormData({ name: ch.name, display_name: ch.display_name || '', chapter_number: ch.chapter_number || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingChapter(null); };

  const handleSubmit = () => {
    if (!formData.name.trim() || !selectedBookId) return;
    const payload = {
      ...formData,
      book_id: selectedBookId,
      chapter_number: formData.chapter_number ? parseInt(formData.chapter_number, 10) : null,
    };
    if (editingChapter) {
      updateMutation.mutate({ id: editingChapter.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Chapters</h2>
          <p className="text-gray-500 text-sm">Manage chapters within books</p>
        </div>
        <button onClick={openCreate} disabled={!selectedBookId}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-5 h-5 mr-2" /> Add Chapter
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Book</label>
        <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg">
          <option value="">-- Select a book --</option>
          {books?.data?.map((book) => (
            <option key={book.id} value={book.id}>{book.display_name || book.name}</option>
          ))}
        </select>
      </div>

      {!selectedBookId ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Select a book to view chapters
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : chapters?.data?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No chapters found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {chapters?.data?.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">
                  {ch.chapter_number && <span className="text-gray-500 mr-2">Ch {ch.chapter_number}:</span>}
                  {ch.display_name || ch.name}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(ch)} className="p-2 text-gray-400 hover:text-blue-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(ch.id)} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingChapter ? 'Edit Chapter' : 'Add Chapter'} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Number</label>
              <input type="number" value={formData.chapter_number} onChange={(e) => setFormData({ ...formData, chapter_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (ID)</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., algebra_basics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input type="text" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Algebra Basics" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={handleSubmit} disabled={!formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {editingChapter ? 'Save Changes' : 'Add Chapter'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ SCANNED ITEMS TAB ============
function ScannedItemsTab() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState('');
  const [newScanType, setNewScanType] = useState('pdf');
  const [itemTypeFilter, setItemTypeFilter] = useState('question');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionCounter, setSelectionCounter] = useState(0);

  const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => api.get('/books') });
  const { data: chapters } = useQuery({
    queryKey: ['chapters', selectedBookId],
    queryFn: () => api.get(`/chapters/book/${selectedBookId}`),
    enabled: !!selectedBookId,
  });
  const { data: activeJob } = useQuery({ queryKey: ['activeJob'], queryFn: () => api.get('/jobs/active') });

  const { data: scannedItems, isLoading } = useQuery({
    queryKey: ['scannedItems', selectedBookId, selectedChapterId, itemTypeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBookId) params.append('bookId', selectedBookId);
      if (selectedChapterId) params.append('chapterId', selectedChapterId);
      params.append('itemType', itemTypeFilter);
      return api.get(`/scanned-items?${params.toString()}`);
    },
  });

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/scanned-items', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scannedItems'] }); setShowAddModal(false); setNewItemData(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/scanned-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scannedItems'] }),
  });

  const extractMutation = useMutation({
    mutationFn: (data) => api.post('/question-sets/extract', data),
    onSuccess: () => { clearSelections(); queryClient.invalidateQueries({ queryKey: ['questionSets'] }); },
  });

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) return prev.filter((item) => item.id !== itemId);
      const newOrder = selectionCounter + 1;
      setSelectionCounter(newOrder);
      return [...prev, { id: itemId, order: newOrder }];
    });
  };

  const clearSelections = () => { setSelectedItems([]); setSelectionCounter(0); };
  const getSelectionOrder = (itemId) => selectedItems.find((item) => item.id === itemId)?.order || null;
  const getOrderedIds = () => [...selectedItems].sort((a, b) => a.order - b.order).map((i) => i.id);
  const canSelect = (item) => item.latex_conversion_status === 'completed' && item.latex_doc;
  const hasActiveJob = activeJob?.data?.active_book_id && activeJob?.data?.active_chapter_id;

  const sortedItems = scannedItems?.data ? [...scannedItems.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Scanned Items</h2>
          <p className="text-gray-500 text-sm">View and manage scanned papers</p>
        </div>
        <button onClick={() => setShowAddModal(true)} disabled={!hasActiveJob}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-5 h-5 mr-2" /> Add Item
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setItemTypeFilter('question'); clearSelections(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${itemTypeFilter === 'question' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          Questions
        </button>
        <button onClick={() => { setItemTypeFilter('solution'); clearSelections(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${itemTypeFilter === 'solution' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          Solutions
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Book</label>
            <select value={selectedBookId} onChange={(e) => { setSelectedBookId(e.target.value); setSelectedChapterId(''); clearSelections(); }}
              className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">All Books</option>
              {books?.data?.map((b) => <option key={b.id} value={b.id}>{b.display_name || b.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Chapter</label>
            <select value={selectedChapterId} onChange={(e) => { setSelectedChapterId(e.target.value); clearSelections(); }}
              disabled={!selectedBookId} className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100">
              <option value="">All Chapters</option>
              {chapters?.data?.map((c) => <option key={c.id} value={c.id}>{c.chapter_number ? `Ch ${c.chapter_number}: ` : ''}{c.display_name || c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-blue-800 text-sm">{selectedItems.length} item(s) selected</span>
          <div className="flex gap-2">
            <button onClick={clearSelections} className="text-sm text-gray-600">Clear</button>
            <button onClick={() => extractMutation.mutate({ item_ids: getOrderedIds(), name: `Extraction ${new Date().toLocaleString()}` })}
              disabled={extractMutation.isPending} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">
              {extractMutation.isPending ? 'Extracting...' : 'Extract Questions'}
            </button>
          </div>
        </div>
      )}

      {!hasActiveJob && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-800 text-sm">
          No active job configured. Set one in the Active Job tab to add items.
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : sortedItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ScanLine className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No scanned items found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Sel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book/Chapter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedItems.map((item) => {
                const isSelected = !!selectedItems.find((s) => s.id === item.id);
                const order = getSelectionOrder(item.id);
                const selectable = canSelect(item);
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <input type="checkbox" checked={isSelected} onChange={() => handleItemSelect(item.id)}
                          disabled={!selectable} className="w-4 h-4 rounded disabled:opacity-50" />
                        {order && <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">{order}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{item.item_data}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{item.book?.display_name || item.book?.name}</p>
                      <p className="text-xs text-gray-500">{item.chapter?.display_name || item.chapter?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.latex_conversion_status === 'completed' ? 'bg-green-100 text-green-600' :
                        item.latex_conversion_status === 'failed' ? 'bg-red-100 text-red-600' :
                        item.latex_conversion_status === 'processing' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>{item.latex_conversion_status || 'pending'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <Modal title="Add Scanned Item" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Data</label>
              <textarea value={newItemData} onChange={(e) => setNewItemData(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="PDF URL or content..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
              <select value={newScanType} onChange={(e) => setNewScanType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg">
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="url">URL</option>
              </select>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p><span className="font-medium">Book:</span> {activeJob?.data?.active_book?.display_name || 'N/A'}</p>
              <p><span className="font-medium">Chapter:</span> {activeJob?.data?.active_chapter?.display_name || 'N/A'}</p>
              <p><span className="font-medium">Type:</span> {activeJob?.data?.active_item_type || 'question'}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={() => addMutation.mutate({ item_data: newItemData, scan_type: newScanType })}
              disabled={!newItemData.trim() || addMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {addMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ MODAL COMPONENT ============
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
