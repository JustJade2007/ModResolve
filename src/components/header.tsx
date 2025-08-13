import Link from 'next/link';
import {
  Github,
  LogIn,
  LogOut,
  Wrench,
  UserPlus,
  Shield,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type User, logout, isAdmin, getSession } from '@/lib/auth';
import { ThemeToggle } from './theme-toggle';

export default async function Header() {
  const session = await getSession();
  const user = session?.user ?? null;
  const userIsAdmin = user ? await isAdmin(user.email) : false;

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Wrench className="h-6 w-6 text-primary" />
        <span className="text-lg">ModResolve</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <a
            href="https://github.com/JustJade2007/MCAIBugFixSite/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            Feedback
          </a>
        </Button>
        {user ? (
          <>
            {userIsAdmin && (
              <>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    App
                  </Link>
                </Button>
              </>
            )}
            <form action={logout}>
              <Button variant="ghost" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </Link>
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
