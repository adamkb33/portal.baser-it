import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { NavLink, Link } from "react-router";
import { createNavigationSections } from "@/lib/navigation";

export function Navbar() {
  const navigation = createNavigationSections();
  const middleLinks = navigation.navbar.middle;

  return (
    <nav className="flex items-center justify-between w-full">
      <Link to="/" className="text-xl font-semibold">
        Logo
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {middleLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              `text-sm transition-colors ${
                isActive ? "text-primary font-medium" : "hover:text-primary"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:block">
        <Button size="sm">Get Started</Button>
      </div>

      <MobileMenu />
    </nav>
  );
}
