'use client';

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [role, setRole] = useState('');

  const fetchUsers = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(role && { role })
      });

      const response = await fetch(`http://localhost:3001/api/admin/users?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.data);
      setPagination(data.pagination);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [role]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');
      fetchUsers(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchUsers(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'isActive', label: 'Status', render: (v) => v ? '✅ Active' : '❌ Inactive' },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString('id-ID') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage team members and customers</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Roles</option>
        <option value="CUSTOMER">CUSTOMER</option>
        <option value="DESIGN_STAFF">DESIGN_STAFF</option>
        <option value="ADMIN">ADMIN</option>
        <option value="OWNER">OWNER</option>
      </select>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchUsers}
        actions={[
          {
            label: 'Toggle Status',
            color: '#f59e0b',
            onClick: (row) => handleStatusToggle(row.id, row.isActive)
          },
          {
            label: 'Make Admin',
            color: '#3b82f6',
            onClick: (row) => handleRoleChange(row.id, 'ADMIN')
          }
        ]}
      />
    </div>
  );
}
