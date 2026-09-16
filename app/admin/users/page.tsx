'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/Icon'

interface UserItem {
  id: number
  username: string
  role: string
  createdAt: string
  _count: {
    sessions: number
    documents: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role !== 'ALL') params.set('role', role)
      params.set('page', page.toString())
      params.set('limit', '15')

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotalPages(data.totalPages || 1)
        setTotalUsers(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }, [search, role, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value)
    setPage(1)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage platform accounts, role authorization, and user details.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '8px' }}>
            Total Users: <strong>{totalUsers}</strong>
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        padding: '1rem',
        borderRadius: '12px'
      }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search username..."
            value={search}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: '8px',
              border: '1px solid var(--color-card-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>
            <Icon name="search" size={18} />
          </div>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            value={role}
            onChange={handleRoleChange}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-card-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="INTERVIEWER">INTERVIEWER</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-card-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>ID</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Username</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Role</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Sessions</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Documents</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No users found matching criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>#{user.id}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)'
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: user.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                      color: user.role === 'ADMIN' ? '#ef4444' : '#6366f1',
                      border: user.role === 'ADMIN' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user._count.sessions}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user._count.documents}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--color-card-border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-card-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: page <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-card-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: page >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
