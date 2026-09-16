import React from 'react'
import { redirect } from 'next/navigation'

import { getAppSession } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAppSession()

  if (!session.isLoggedIn) {
    redirect('/api/auth/logout')
  }

  return (
    <AppShell username={session.username}>
      {children}
    </AppShell>
  )
}
