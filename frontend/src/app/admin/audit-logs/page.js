'use client';

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [action, setAction] = useState('');

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        ...(action && { action })
      });

      const response = await fetch(`http://localhost:3001/api/admin/audit-logs?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action]);

  const columns = [
    { key: 'action', label: 'Action' },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'userAgent', label: 'User Agent', render: (v) => v?.substring(0, 40) + '...' || '-' },
    { key: 'createdAt', label: 'Timestamp', render: (v) => new Date(v).toLocaleString('id-ID') },
  ];

  const actionTypes = [
    'PRODUCT_CREATED',
    'PRODUCT_UPDATED',
    'PRODUCT_DELETED',
    'ORDER_STATUS_UPDATED_TO_CONFIRMED',
    'ORDER_CANCELLED',
    'DESIGN_REQUEST_STATUS_UPDATED_TO_IN_PRODUCTION',
    'PAYMENT_VERIFIED',
    'REFUND_PROCESSED',
    'USER_ROLE_CHANGED_TO_ADMIN',
    'USER_STATUS_CHANGED_TO_ACTIVE'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track all admin operations</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Filter by action..."
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={() => setAction('')}
          className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
        >
          Clear
        </button>
      </div>

      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        {actionTypes.slice(0, 5).map((type) => (
          <button
            key={type}
            onClick={() => setAction(type)}
            className={`px-3 py-1 text-xs rounded font-semibold transition ${
              action === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchLogs}
      />
    </div>
  );
}
