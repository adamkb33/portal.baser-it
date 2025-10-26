import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin } from 'lucide-react';
import type { CompanySummaryDto } from '~/api/clients/types';

interface CompanyCardProps {
  company: CompanySummaryDto;
  onSubmit?: (values: { companyId: string }) => void;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { id, name, orgNumber, organizationType, postalAddress, businessAddress } = company;

  const formatAddress = (address?: typeof company.postalAddress) => {
    if (!address) return 'N/A';
    const parts = [...(address.addressLines || []), address.postalCode, address.city, address.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Card className="w-full min-w-md hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-[#702963]" />
          {name}
        </CardTitle>
        <CardDescription>
          Org. No: <span className="font-medium">{orgNumber}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground font-medium">Organization Type</p>
          <p>{organizationType?.description || 'Unknown'}</p>
        </div>

        {postalAddress && (
          <div className="flex gap-2 items-start">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground font-medium">Postal Address</p>
              <p>{formatAddress(postalAddress)}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  );
}
