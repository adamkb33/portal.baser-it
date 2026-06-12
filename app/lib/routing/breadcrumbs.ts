import type { RouteBranch } from './route-types';

export type Crumb = {
  label: string;
  href: string;
};

export function buildCrumbs(branches: RouteBranch[], pathname: string): Crumb[] {
  const trail = findTrail(branches, pathname);

  return trail.map((branch) => ({
    label: branch.label ?? branch.id,
    href: branch.href,
  }));
}

function findTrail(branches: RouteBranch[], pathname: string, currentTrail: RouteBranch[] = []): RouteBranch[] {
  let bestTrail: RouteBranch[] = [];

  for (const branch of branches) {
    const nextTrail = [...currentTrail, branch];
    const branchMatches = matchesBranchPath(pathname, branch.href) || isWithinBranchSubtree(pathname, branch.href);

    if (branchMatches && nextTrail.length > bestTrail.length) {
      bestTrail = nextTrail;
    }

    if (branch.children?.length) {
      const childTrail = findTrail(branch.children, pathname, nextTrail);
      if (childTrail.length > bestTrail.length) {
        bestTrail = childTrail;
      }
    }
  }

  return bestTrail;
}

function matchesBranchPath(pathname: string, href: string): boolean {
  const pathnameParts = splitPathSegments(pathname);
  const hrefParts = splitPathSegments(href);

  if (pathnameParts.length !== hrefParts.length) {
    return false;
  }

  return hrefParts.every((part, index) => part.startsWith(':') || part === pathnameParts[index]);
}

function isWithinBranchSubtree(pathname: string, href: string): boolean {
  const basePath = normalizeBranchBasePath(href);
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function normalizeBranchBasePath(href: string): string {
  const parts = splitPathSegments(href).filter((part) => !part.startsWith(':'));
  return parts.length === 0 ? '/' : `/${parts.join('/')}`;
}

function splitPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
