import { Link as RouterLink } from 'react-router';
import { Text } from '~/ui';

export function Navbar() {
  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <RouterLink to="/ui" className="flex items-center gap-2">
          <Text as="span" variant="heading-sm" className="font-semibold">
            UI Design System
          </Text>
        </RouterLink>
        <div className="flex items-center gap-6">
          <RouterLink
            to="/"
            className="text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            Back to App
          </RouterLink>
        </div>
      </div>
    </nav>
  );
}
