import { redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session.isLoggedIn || session.role !== 'ADMIN') {
    redirect('/api/auth/logout');
  }
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
