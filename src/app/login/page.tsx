import Link from 'next/link';
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Home, AlertTriangle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="outline" size="icon">
          <Home className="h-5 w-5" />
          <span className="sr-only">Home</span>
        </Button>
      </Link>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Wrench className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your username or email to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {searchParams.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>
                  {searchParams.error.replace(/\+/g, ' ')}
                </AlertDescription>
              </Alert>
            )}
            <form action={login} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your_username or user@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-4 text-sm">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold underline">
                Register here
              </Link>
            </p>
             <div className="border-t pt-4 w-full text-center">
                 <Button variant="link" asChild>
                    <Link href="/admin/login">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Login
                    </Link>
                </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
