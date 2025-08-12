import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { ModResolvePage } from '@/components/mod-resolve-page';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogIn, UserPlus } from 'lucide-react';

function LoggedOutView() {
  return (
    <Card className="mt-8 max-w-lg text-center">
      <CardHeader>
        <CardTitle className="text-3xl">Welcome to ModResolve</CardTitle>
        <CardDescription>
          Your AI-powered assistant for solving Minecraft mod issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          To analyze your error logs or get help with Minecraft issues, please
          log in or request an account.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button asChild>
          <Link href="/login">
            <LogIn className="mr-2" /> Login
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/register">
            <UserPlus className="mr-2" /> Request Access
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={session?.user ?? null} />
      <main className="flex flex-1 flex-col items-center p-4 md:p-6">
        {session ? <ModResolvePage /> : <LoggedOutView />}
      </main>
    </div>
  );
}
