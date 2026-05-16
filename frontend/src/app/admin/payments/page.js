'use client';

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('');

  const fetchPayments = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(status && { status })
      });

      const response = await fetch(`http://localhost:3001/api/admin/payments?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payments');

      const data = await response.json();
      setPayments(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [status]);

  const handleVerify = async (paymentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/payments/${paymentId}/verify`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to verify payment');
      fetchPayments(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefund = async (paymentId) => {
    if (!confirm('Process refund?')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ reason: 'Refund processed by admin' })
      });

      if (!response.ok) throw new Error('Failed to process refund');
      fetchPayments(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'amount', label: 'Amount', render: (v) => formatCurrency(v) },
    { key: 'method', label: 'Method' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded ${
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString('id-ID') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage payment verification</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">PENDING</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="FAILED">FAILED</option>
      </select>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchPayments}
        actions={[
          {
            label: 'Verify',
            color: '#10b981',
            onClick: (row) => handleVerify(row.id)
          },
          {
            label: 'Refund',
            color: '#ef4444',
            onClick: (row) => handleRefund(row.id)
          }
        ]}
      />
    </div>
  );
}
