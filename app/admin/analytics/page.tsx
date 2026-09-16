'use client'

import React, { useState, useEffect } from 'react'
import Icon from '@/components/Icon'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsData {
  metrics: {
    totalInterviews: number
    completedInterviews: number
    activeInterviews: number
    totalCandidates: number
    totalInterviewers: number
    completionRate: number
  }
  scores: {
    averageScore: number | null
    highestScore: number | null
    lowestScore: number | null
    scoredInterviewsCount: number
  }
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>
  typeBreakdown: Array<{ type: string; count: number; percentage: number }>
  difficultyBreakdown: Array<{ difficulty: string; count: number; percentage: number }>
  activityTrend: Array<{ date: string; count: number; completedCount: number }>
  interviewerPerformance: Array<{
    id: number
    username: string
    totalInterviews: number
    completedInterviews: number
    averageScore: number | null
  }>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setError(`Failed to fetch analytics (HTTP ${res.status})`)
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('An error occurred while loading analytics data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 0' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-text-primary)' }}>
          Analytics Dashboard
        </h1>
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading real-time analytics data...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 0' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--color-text-primary)' }}>
          Analytics Dashboard
        </h1>
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '2rem', color: '#ef4444', textAlign: 'center' }}>
          {error || 'Unable to display analytics'}
          <div style={{ marginTop: '1rem' }}>
            <button onClick={fetchAnalytics} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { metrics, scores, statusBreakdown, difficultyBreakdown, activityTrend, interviewerPerformance } = data

  // Chart 1: 30-Day Activity Trend Data
  const activityChartData = {
    labels: activityTrend.map((item) => item.date.slice(5)), // MM-DD
    datasets: [
      {
        label: 'Total Sessions',
        data: activityTrend.map((item) => item.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Completed Sessions',
        data: activityTrend.map((item) => item.completedCount),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const activityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: 'var(--color-text-secondary)', font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 22, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)', maxTicksLimit: 10 },
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--color-text-muted)', precision: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  }

  // Chart 2: Status Breakdown Data
  const statusColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const statusChartData = {
    labels: statusBreakdown.map((item) => item.status.toUpperCase()),
    datasets: [
      {
        data: statusBreakdown.map((item) => item.count),
        backgroundColor: statusColors.slice(0, statusBreakdown.length),
        borderWidth: 1,
        borderColor: 'var(--color-card-bg)',
      },
    ],
  }

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'var(--color-text-secondary)', font: { size: 12 } },
      },
    },
  }

  // Chart 3: Difficulty Distribution Data
  const difficultyChartData = {
    labels: difficultyBreakdown.map((item) => item.difficulty.toUpperCase()),
    datasets: [
      {
        label: 'Sessions',
        data: difficultyBreakdown.map((item) => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 6,
      },
    ],
  }

  const difficultyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--color-text-muted)', precision: 0 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text-primary)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time metric aggregations and interview performance statistics.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: '1px solid var(--color-card-border)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Icon name="refresh" size={18} />
          Refresh Data
        </button>
      </div>

      {/* Top Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Interviews</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{metrics.totalInterviews}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Across all interviewers</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Completed Interviews</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{metrics.completedInterviews}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Completion Rate: <strong>{metrics.completionRate}%</strong>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>In-Progress Sessions</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>{metrics.activeInterviews}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Currently active</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Candidates</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6' }}>{metrics.totalCandidates}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Registered candidate profiles</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total Interviewers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{metrics.totalInterviewers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Active interviewer accounts</div>
        </div>
      </div>

      {/* Score Analytics Card */}
      <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Candidate Score Analytics
        </h3>
        {scores.scoredInterviewsCount === 0 || scores.averageScore === null ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
            No evaluation data available yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Average Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1', marginTop: '0.25rem' }}>
                {Math.round(scores.averageScore * 10)}%
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Highest Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
                {scores.highestScore !== null ? Math.round(scores.highestScore * 10) : 0}%
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Lowest Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>
                {scores.lowestScore !== null ? Math.round(scores.lowestScore * 10) : 0}%
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Scored Interviews</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                {scores.scoredInterviewsCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* 30-Day Activity Trend */}
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>30-Day Interview Activity Trend</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <Line data={activityChartData} options={activityChartOptions} />
          </div>
        </div>

        {/* Status Breakdown */}
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Status Distribution</h3>
          {statusBreakdown.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No status records available
            </div>
          ) : (
            <div style={{ height: '260px', width: '100%' }}>
              <Doughnut data={statusChartData} options={statusChartOptions} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Difficulty Distribution */}
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Difficulty Distribution</h3>
          {difficultyBreakdown.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No difficulty records available
            </div>
          ) : (
            <div style={{ height: '240px', width: '100%' }}>
              <Bar data={difficultyChartData} options={difficultyChartOptions} />
            </div>
          )}
        </div>

        {/* Interviewer Performance */}
        <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Interviewer Activity & Performance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Interviewer</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total Sessions</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Completed</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {interviewerPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No interviewer data found.
                    </td>
                  </tr>
                ) : (
                  interviewerPerformance.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {user.username}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                        {user.totalInterviews}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 500 }}>
                        {user.completedInterviews}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {user.averageScore !== null ? (
                          <span style={{ fontWeight: 600, color: '#6366f1' }}>
                            {Math.round(user.averageScore * 10)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
