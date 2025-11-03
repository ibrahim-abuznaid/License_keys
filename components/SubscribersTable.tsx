'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

interface Subscriber {
  email: string;
  totalKeys: number;
  trialKeys: number;
  developmentKeys: number;
  productionKeys: number;
  activeKeys: number;
  latestCreatedAt: string;
  hasActiveTrial: boolean;
  fullName?: string;
  companyName?: string;
  status: 'trial' | 'customer' | 'inactive';
}

export default function SubscribersTable() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'trial' | 'customer' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);

  const fetchSubscribers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      if (appliedSearch) {
        params.set('search', appliedSearch);
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/subscribers?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setSubscribers(result.data || []);
        if (result.meta) {
          setTotalPages(result.meta.totalPages ?? 1);
          setTotalSubscribers(result.meta.total ?? (result.data?.length ?? 0));
          if (
            typeof result.meta.page === 'number' &&
            result.meta.page >= 1 &&
            result.meta.page !== currentPage
          ) {
            setCurrentPage(result.meta.page);
          }
        } else {
          setTotalPages(1);
          setTotalSubscribers(result.data?.length ?? 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter, currentPage]);

  useEffect(() => {
    setLoading(true);
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed === appliedSearch && currentPage === 1) return;
    setCurrentPage(1);
    setAppliedSearch(trimmed);
  };

  const handleStatusChange = (value: 'all' | 'trial' | 'customer' | 'inactive') => {
    if (value === statusFilter && currentPage === 1) return;
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const handleClear = () => {
    if (!search && !appliedSearch) return;
    setSearch('');
    if (appliedSearch) {
      setCurrentPage(1);
      setAppliedSearch('');
    }
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchSubscribers();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const firstItemIndex =
    totalSubscribers === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItemIndex =
    totalSubscribers === 0 ? 0 : firstItemIndex + subscribers.length - 1;

  if (loading && subscribers.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Subscribers</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, domain, or key..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
            {(search || appliedSearch) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-600">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as 'all' | 'trial' | 'customer' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Any</option>
              <option value="trial">In Trial</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Keys
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Keys
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trial
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Development
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Production
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Latest Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No subscribers found. Generate your first key above.
                </td>
              </tr>
            ) : (
              subscribers.map((subscriber) => (
                <tr 
                  key={subscriber.email} 
                  onClick={() => router.push(`/users/${encodeURIComponent(subscriber.email)}`)}
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {subscriber.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                          {subscriber.email}
                        </div>
                        {(subscriber.fullName || subscriber.companyName) && (
                          <div className="text-xs text-gray-500">
                            {subscriber.fullName && subscriber.companyName 
                              ? `${subscriber.fullName} • ${subscriber.companyName}`
                              : subscriber.fullName || subscriber.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <span className="font-semibold">{subscriber.totalKeys}</span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {subscriber.activeKeys} Active
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {subscriber.trialKeys > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {subscriber.trialKeys}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {subscriber.developmentKeys > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {subscriber.developmentKeys}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {subscriber.productionKeys > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {subscriber.productionKeys}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {formatDate(subscriber.latestCreatedAt)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {subscriber.status === 'trial' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        In Trial
                      </span>
                    ) : subscriber.status === 'customer' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Customer
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {totalSubscribers > 0 && (
        <div className="mt-4 flex flex-col gap-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div>
            Showing {firstItemIndex}-{lastItemIndex} of {totalSubscribers} subscriber
            {totalSubscribers !== 1 ? 's' : ''}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          pageNumber === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



