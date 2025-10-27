import { redirect, type LoaderFunctionArgs } from 'react-router';
import { createIdentityClient } from '~/api/clients/identity';
import { ENV } from '~/api/config/env';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { getUserSession } from '~/lib/auth.utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const { companyId, user, accesstoken } = await getUserSession(request);
  if (!user || !companyId) {
    return redirect('/');
  }
  const identityClient = createIdentityClient({ baseUrl: ENV.IDENTITY_BASE_URL, token: accesstoken });
  const response = await identityClient.AdminCompanyControllerService.AdminCompanyControllerService.getCompanyUsers({
    companyId,
  });

  console.log(response);
}

export default function EmployeesOverview() {
  return (
    <div>
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Navn</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Roller</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Adam Baser</TableCell>
            <TableCell>adamkbaser@gmail.com</TableCell>
            <TableCell>Admin, ansatt</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
