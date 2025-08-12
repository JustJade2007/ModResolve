'use client';

import { useFormStatus } from 'react-dom';
import { approveRequest, denyRequest } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import type { AccountRequest } from '@/lib/actions';

function ActionButton({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

export function ApproveButton({ request }: { request: AccountRequest }) {
  return (
    <form action={() => approveRequest(request)}>
      <ActionButton size="sm">
        <Check className="mr-2 h-4 w-4" />
        Approve
      </ActionButton>
    </form>
  );
}

export function DenyButton({ email }: { email: string }) {
  return (
    <form action={() => denyRequest(email)}>
      <ActionButton variant="destructive" size="sm">
        <X className="mr-2 h-4 w-4" />
        Deny
      </ActionButton>
    </form>
  );
}
