import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Book, Settings, ScanLine, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['activeJob'],
    queryFn: () => api.get('/jobs/active'),
  });

  const { data: scannedItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['scannedItems'],
    queryFn: () => api.get('/scanned-items'),
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books'),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Silver Gate</p>
      </div>

      {/* Active Job Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Active Job</h2>
          <Link
            to="/job-config"
            className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
          >
            Configure <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {jobLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : activeJob?.data ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center text-blue-600 mb-2">
                <Book className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Active Book</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {activeJob.data.active_book?.display_name || activeJob.data.active_book?.name || 'Not set'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center text-green-600 mb-2">
                <Settings className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Active Chapter</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {activeJob.data.active_chapter?.display_name || activeJob.data.active_chapter?.name || 'Not set'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active job configured</p>
            <Link
              to="/job-config"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Configure a job
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Book className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Books</p>
              <p className="text-2xl font-bold text-gray-800">
                {booksLoading ? '...' : books?.data?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ScanLine className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Scanned Items</p>
              <p className="text-2xl font-bold text-gray-800">
                {itemsLoading ? '...' : scannedItems?.data?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Job Status</p>
              <p className="text-2xl font-bold text-gray-800">
                {jobLoading ? '...' : activeJob?.data ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scanned Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Scanned Items</h2>
            <Link
              to="/scanned-items"
              className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {itemsLoading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : scannedItems?.data?.length > 0 ? (
          <div className="divide-y">
            {scannedItems.data.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.item_data?.substring(0, 50)}
                      {item.item_data?.length > 50 ? '...' : ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.book?.display_name} - {item.chapter?.display_name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : item.status === 'failed'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <ScanLine className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No scanned items yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
