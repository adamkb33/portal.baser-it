import { Outlet, useOutletContext } from 'react-router';
import type { RootOutletContext } from '../../root.layout';
import { EMBED_THEME_TOKENS } from '~/lib/embed-shell';

export default function BookingPublicLayout() {
  const context = useOutletContext<RootOutletContext | undefined>();
  const style =
    context?.embedMode && context.isEmbeddedRequest ? EMBED_THEME_TOKENS[context.embedTheme] : undefined;

  return (
    <div style={style} className="min-h-full">
      <Outlet />
    </div>
  );
}
