import { Outlet } from 'react-router';
import type { Route } from './+types/ui.layout';

export async function loader({}: Route.LoaderArgs) {
  return {};
}

export default function UILayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
