'use client'

import React from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface RadarChartProps {
  dataPoints: number[]
}

export const RadarChart = ({ dataPoints }: RadarChartProps) => {
  const data = {
    labels: ['Programming', 'OOP Design', 'DBMS', 'OS/Networking', 'Aptitude', 'Communication'],
    datasets: [
      {
        label: 'Candidate Score',
        data: dataPoints,
        backgroundColor: 'rgba(6, 182, 212, 0.2)', // var(--color-cyan) with opacity
        borderColor: '#06b6d4',
        pointBackgroundColor: '#6366f1', // var(--color-indigo)
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1',
        borderWidth: 2,
      },
      {
        label: 'Role Baseline',
        data: [70, 75, 70, 65, 80, 85],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderDash: [5, 5],
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'var(--color-text-secondary)',
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 22, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        pointLabels: {
          color: 'var(--color-text-secondary)',
          font: {
            size: 10
          }
        },
        ticks: {
          display: false,
          min: 0,
          max: 100,
          stepSize: 20
        }
      }
    }
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Radar data={data} options={options} />
    </div>
  )
}
