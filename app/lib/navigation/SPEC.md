## Navigation Configuration Spec

- **Single source**: `app/lib/navigation/routes.ts` exports `ROUTES_SHAPE` (typed `RoutesShape`) and the derived tree via `buildRoutes`.
- **RoutesShape node fields**:
  - `label` – required display label.
- `access` – required descriptor typed `RouteAccess`:
  ```ts
  export type RouteAccess =
    | { audience: 'public' }
    | { audience: 'auth' }
    | { audience: 'role'; companyRoles: CompanyRole[] };
  ```
  - `{ audience: 'public' }`
  - `{ audience: 'auth' }`
  - `{ audience: 'role'; companyRoles: CompanyRole[] }` (any non-empty subset of company roles, e.g. `[CompanyRole.ADMIN]`)
  - `nav` – either `null` (no navigation entry) or `{ placement: NavPlacement; order?: number; icon?: React.ComponentType }`.
  - `children` – optional record of nested routes; every child repeats its own `access`/`nav`.
- **Placements**:
  - `NAV_PLACEMENT` is the runtime enum.
  - `NavPlacement` is the type alias `type NavPlacement = (typeof NAV_PLACEMENT)[keyof typeof NAV_PLACEMENT];`
  - Allowed values: `navbar_start`, `navbar_middle`, `navbar_end`, `account`, `sidebar`. No multi-placement support.
- **Access rules**:
  - Role checks rely exclusively on generated `CompanyRole` constants; every protected node specifies `companyRoles: CompanyRole[]`.
  - Child nodes do not inherit parent access automatically; each must declare its own requirement explicitly.
- **Navigation build**:
  - `createNavigationModel` consumes the route tree and `snapshotAuth(payload)` result.
  - Items without `nav` are ignored; items with `nav` and satisfied `access` become `NavItem`s grouped by `placement`.
  - Parent-child relationships are inferred from dot-notated ids (`parent.child`); children attach under matching parents before placement grouping.
  - Ordering uses `nav.order` (default 100) then label alpha.
- **Runtime usage**:
  - `collectRouteTuples` traverses the same tree for Remix route registration.
  - `getNavigation` wraps `createNavigationModel`, taking the compiled routes and optional auth payload.
