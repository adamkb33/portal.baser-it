import { Menu } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createNavigationSections } from "@/lib/navigation";

export function MobileMenu() {
  const navigation = createNavigationSections();
  const middleLinks = navigation.navbar.middle;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 p-0">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Jump to a section. Tapping a link will close the menu.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="grid flex-1 auto-rows-min gap-2 px-6">
          {middleLinks.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                to={link.href}
                className="text-lg py-2 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </div>

        <div className="p-6">
          <SheetFooter className="w-full">
            <Button className="w-full">Get Started</Button>
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
