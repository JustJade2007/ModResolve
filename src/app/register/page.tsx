'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestAccount } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        'Request Account'
      )}
    </Button>
  );
}

const initialState = { message: null, error: null };

export default function RegisterPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction] = useActionState(requestAccount, initialState);

  useEffect(() => {
    if (state.message) {
      setSubmitted(true);
    }
    if (state.error) {
      toast({
        title: 'Error',
        description: state.error,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Request Submitted!</CardTitle>
            <CardDescription>
              Your account request has been sent to the administrator for
              approval. You will be notified by email if your request is
              approved.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

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
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Fill out the form below to request an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="JohnDoe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <SubmitButton />
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold underline">
                Login here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
