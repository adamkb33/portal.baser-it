import { Text } from '~/ui';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-xl mx-auto px-6 md:px-8 py-8">
        <div className="flex items-center justify-between">
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Design System v1.0 — Zero-variance atomic design system
          </Text>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            © 2026 Portal Pitell
          </Text>
        </div>
      </div>
    </footer>
  );
}
