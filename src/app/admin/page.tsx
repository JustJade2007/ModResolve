'use client';

import { useEffect, useState, useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createUser,
  approveRequest,
  denyRequest,
  deleteUser,
} from '@/lib/actions';
import type { AccountRequest, User, ActionFormState } from '@/lib/actions';
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
import { Loader2, UserPlus, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


function SubmitButton({
  text,
  pendingText,
  Icon,
}: {
  text: string;
  pendingText: string;
  Icon: React.ElementType;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        <>
          <Icon className="mr-2 h-4 w-4" />
          {text}
        </>
      )}
    </Button>
  );
}

function ActionButton({ 
    children, 
    variant, 
    size = 'sm'
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
}) {
    const { pending } = useFormStatus();
    return (
        <Button variant={variant} size={size} type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        </Button>
    )
}

const initialFormState: ActionFormState = { message: null, error: null };

export default function AdminPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, startDataLoadingTransition] = useTransition();

  const [createState, createFormAction, isCreatePending] = useActionState(createUser, initialFormState);

  const [approveState, approveAction] = useActionState(approveRequest, initialFormState);
  const [denyState, denyAction] = useActionState(denyRequest, initialFormState);
  const [deleteState, deleteAction] = useActionState(deleteUser, initialFormState);
  
  async function fetchAllData() {
    startDataLoadingTransition(async () => {
        try {
        const res = await fetch('/api/admin-data');
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({error: 'An unknown error occurred.'}));
            throw new Error(errorData.error || 'Failed to fetch admin data');
        }
        const { requests, users } = await res.json();
        setRequests(requests);
        setUsers(users);
        } catch (error) {
        const description = error instanceof Error ? error.message : 'Could not load admin data.';
        toast({
            title: 'Error',
            description,
            variant: 'destructive',
        });
        }
    });
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const states = [createState, approveState, denyState, deleteState];
    states.forEach(state => {
      if (state.message) {
        toast({ title: 'Success', description: state.message });
        fetchAllData(); // Refresh data on success
      }
      if (state.error) {
        toast({ title: 'Error', description: state.error, variant: 'destructive' });
      }
    });
  }, [createState, approveState, denyState, deleteState, toast]);


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Requests</CardTitle>
            <CardDescription>
              Review and approve or deny new user account requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No pending requests.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map(request => (
                    <TableRow key={request.email}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <form action={approveAction}>
                                <input type="hidden" name="email" value={request.email}/>
                                <ActionButton variant="default">
                                    <Check className="mr-2 h-4 w-4"/> Approve
                                </ActionButton>
                            </form>
                            <form action={denyAction}>
                                <input type="hidden" name="email" value={request.email}/>
                                <ActionButton variant="destructive">
                                    <X className="mr-2 h-4 w-4" /> Deny
                                </ActionButton>
                            </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Existing Users</CardTitle>
            <CardDescription>
              View and manage all registered users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isDataLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                       <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : users.map(user => (
                  <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account for {user.email}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <form action={deleteAction}>
                                 <input type="hidden" name="email" value={user.email}/>
                                 <AlertDialogAction asChild>
                                    <ActionButton variant="destructive">Continue</ActionButton>
                                 </AlertDialogAction>
                               </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create a New User</CardTitle>
            <CardDescription>
              Manually create a user account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createFormAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={isCreatePending}
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
                   disabled={isCreatePending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                   disabled={isCreatePending}
                />
              </div>
              <SubmitButton
                text="Create User"
                pendingText="Creating..."
                Icon={UserPlus}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
