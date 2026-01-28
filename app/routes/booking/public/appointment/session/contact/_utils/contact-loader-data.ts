import { useMatches } from 'react-router';
import type { ContactLoaderData } from './contact-types';

export function useContactLoaderData(): ContactLoaderData | undefined {
  const matches = useMatches();
  const contactMatch = matches.find(
    (match) => match.handle && typeof match.handle === 'object' && 'contactFlow' in match.handle,
  );
  return contactMatch?.data as ContactLoaderData | undefined;
}
