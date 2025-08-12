import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, UserPlus, Mail } from 'lucide-react';
import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !(await isAdmin(session.user.email))) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40 p-4">
        <nav className="flex flex-col gap-2">
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h3 className="mt-4 px-4 text-xs font-semibold uppercase text-muted-foreground">
            Admin Menu
          </h3>
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/admin/requests">
              <Mail className="mr-2 h-4 w-4" />
              Account Requests
            </Link>
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
