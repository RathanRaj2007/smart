'use client'

import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

export const ScoreChart = ({ labels, data: chartData }: { labels?: string[], data?: number[] }) => {
  const chartRef = useRef<ChartJS<'line'>>(null)

  const data = {
    labels: labels && labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Avg Candidate Score',
        data: chartData && chartData.length > 0 ? chartData : [72, 75, 78, 85, 82, 88, 89],
        borderColor: '#6366f1', // var(--color-indigo)
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4', // var(--color-cyan)
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 22, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context: { parsed: { y: number | null } }) {
            return `Score: ${context.parsed.y ?? 0}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'var(--color-text-muted)',
          stepSize: 20
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--color-text-muted)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}
