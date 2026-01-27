import { data } from 'react-router';
import type { Route } from './+types/auth.api-route';

export async function loader(_: Route.LoaderArgs) {
  return data({ error: 'Not implemented' }, { status: 404 });
}

export async function action(_: Route.ActionArgs) {
  return data({ error: 'Not implemented' }, { status: 404 });
}
