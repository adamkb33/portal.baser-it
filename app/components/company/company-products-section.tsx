import { Badge } from '@/components/ui/badge';
import { InfoCard } from '../cards/info-card';

interface Product {
  name: string;
  isActive: boolean;
}

interface ProductAccessSectionProps {
  products?: Product[];
}

export function ProductAccessSection({ products }: ProductAccessSectionProps) {
  // Default products if none provided
  const defaultProducts: Product[] = [{ name: 'BOOKING', isActive: true }];

  const displayProducts = products ?? defaultProducts;

  return (
    <InfoCard title="Produkttilgang" className="md:col-span-2">
      <div className="space-y-2">
        {displayProducts.map((product) => (
          <div key={product.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <span className="font-medium">{product.name}</span>
            <Badge
              variant={product.isActive ? 'default' : 'secondary'}
              className={product.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
            >
              {product.isActive ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>
        ))}
      </div>
    </InfoCard>
  );
}
