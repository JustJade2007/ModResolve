
'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { adminLogin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Home, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging In...
        </>
      ) : (
        'Log In as Admin'
      )}
    </Button>
  );
}

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

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
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Use your administrator credentials to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>
                  {error.replace(/\+/g, ' ')}
                </AlertDescription>
              </Alert>
            )}
            <form action={adminLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Admin Username or Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="admin or admin@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
