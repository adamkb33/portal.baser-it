export const OVERVIEW_RETURN_VALUE = 'overview';

export function shouldReturnToOverview(value: FormDataEntryValue | string | null | undefined): boolean {
  return value === OVERVIEW_RETURN_VALUE;
}

export function withOverviewReturnTo(href: string): string {
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}returnTo=${OVERVIEW_RETURN_VALUE}`;
}
