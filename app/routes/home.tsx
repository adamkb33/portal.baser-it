import { BackgroundBeams } from '~/components/backgrounds/background-beams';
import type { Route } from '../+types/root';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
}

export default function Home() {
  return (
    <>
      <div className="bg-white border">
        <BackgroundBeams />
      </div>
    </>
  );
}
