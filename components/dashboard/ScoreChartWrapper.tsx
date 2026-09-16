'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import ScoreChart with SSR disabled
const ScoreChart = dynamic(() => import('@/components/ScoreChart').then(mod => mod.ScoreChart), { ssr: false })

export const ScoreChartWrapper = () => {
  return <ScoreChart />
}
