import { getAccountRequests } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApproveButton, DenyButton } from './request-buttons';

export default async function AccountRequestsPage() {
  const requests = await getAccountRequests();

  return (
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
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No pending requests.
                </TableCell>
              </TableRow>
            )}
            {requests.map(request => (
              <TableRow key={request.email}>
                <TableCell className="font-medium">{request.name}</TableCell>
                <TableCell>{request.email}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <ApproveButton request={request} />
                  <DenyButton email={request.email} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
