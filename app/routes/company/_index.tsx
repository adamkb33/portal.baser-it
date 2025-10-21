import { useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';

export default function Company() {
  const context = useOutletContext<RootOutletContext>();

  console.log(context);

  return <div>{JSON.stringify(context, null, 2)}</div>;
}
