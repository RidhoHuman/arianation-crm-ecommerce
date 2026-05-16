'use client';

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';

export default function DesignRequestsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchDesigns = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(status && { status })
      });

      const response = await fetch(`http://localhost:3001/api/admin/design-requests?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch design requests');

      const data = await response.json();
      setDesigns(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns(1);
  }, [status]);

  const handleStatusChange = async (designId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/design-requests/${designId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchDesigns(page);
      setShowDetail(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'designTitle', label: 'Title' },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded ${
          status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
          status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
          status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
          status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          status === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-800' :
          status === 'REJECTED' ? 'bg-red-100 text-red-800' :
          status === 'IN_PRODUCTION' ? 'bg-purple-100 text-purple-800' :
          'bg-indigo-100 text-indigo-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString('id-ID') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Design Requests</h1>
        <p className="text-gray-600 mt-1">Manage custom design requests</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="IN_PRODUCTION">IN_PRODUCTION</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={designs}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchDesigns}
        actions={[
          {
            label: 'View',
            color: '#3b82f6',
            onClick: async (row) => {
              const res = await fetch(`http://localhost:3001/api/admin/design-requests/${row.id}`, {
                credentials: 'include',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
              });
              const data = await res.json();
              setSelectedDesign(data.data);
              setShowDetail(true);
            }
          }
        ]}
      />

      {/* Detail Modal */}
      {showDetail && selectedDesign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Design Request Details</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-semibold">{selectedDesign.designTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold">{selectedDesign.quantity}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold">{selectedDesign.status}</p>
                </div>
              </div>

              {/* Design File */}
              {selectedDesign.designFileUrl && (
                <div>
                  <p className="font-semibold mb-2">Design File</p>
                  <a
                    href={selectedDesign.designFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    View Design File
                  </a>
                </div>
              )}

              {/* Feedback */}
              {selectedDesign.feedback && selectedDesign.feedback.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Feedback</p>
                  <div className="bg-gray-50 rounded p-3 space-y-2 max-h-32 overflow-y-auto">
                    {selectedDesign.feedback.map((fb, i) => (
                      <div key={i} className="text-sm border-l-4 border-blue-400 pl-2">
                        <p className="font-semibold text-xs text-gray-600">{fb.feedbackType}</p>
                        <p>{fb.feedbackText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <p className="font-semibold mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED', 'IN_PRODUCTION', 'COMPLETED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedDesign.id, s)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition ${
                        selectedDesign.status === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
