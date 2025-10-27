import { Menu } from 'lucide-react';
import { Link } from 'react-router';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { Button } from '~/components/ui/button';
import type { RouteBranch } from '~/lib/route-tree';

interface MobileMenuProps {
  title?: string;
  items: RouteBranch[];
}

export function MobileMenu({ title = 'Navigation', items }: MobileMenuProps) {
  if (!items.length) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 p-0">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Jump to a section. Tapping a link will close the menu.</SheetDescription>
          </SheetHeader>
        </div>

        <div className="grid flex-1 auto-rows-min gap-2 px-6">
          {items.map((link) => (
            <SheetClose asChild key={link.id}>
              <Link to={link.href} className="text-lg py-2 hover:text-primary transition-colors">
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
