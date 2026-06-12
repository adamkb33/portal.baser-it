# Template Mirror — Junior Developer Runbook

> Step-by-step build instructions for the remaining work in
> `template-migration-plan.md`. Each section is self-contained: **what to build,
> which files to touch, the exact steps, and how to verify**. Phases 1–3 are already
> done. Work top-to-bottom.
>
> **Ground rules for every section**
> - Reuse components from `~/ui` (atoms/organisms/layout). Don't create parallel
>   components. Import like: `import { Button, Icon, Card, CardHead } from '~/ui';`
> - Icons: either `<Icon name="..." />` (from `~/ui`) or `getIcon(branch.iconName)`
>   from `~/lib/routing/route-icon-map`.
> - Use semantic token classes only (`bg-background`, `text-text-secondary`,
>   `bg-blue-50`, `bg-success-soft`, `border-border`, …). Never hard-code hex.
> - Product copy is **Norwegian**.
> - After each section: run `npm run typecheck`; after structural sections also run
>   `npm run build`. Both must be clean before you open a PR.
> - View shared atoms at the `/styleguide` route while you work.

---

## Progress at a glance

Legend: `[x]` done · `[~]` in progress · `[ ]` not started.

- [x] **Section 1 — Sidebar** (task #9)
- [x] **Section 2 — Shell grid** (task #10)
- [x] **Section 3 — Topbar** (task #11)
- [x] **Section 4 — Page template** (task #12)
- [x] **Section 5 — Auth split-screen** (Phase 5) — auth screens converted; manual flow QA remains
- [x] **Section 6 — Dashboard at /company** (Phase 6)
- [x] **Section 7 — Calendar month view** (Phase 7)
- [~] **Section 8 — Polish / QA** (Phase 8)

> Tick the per-step boxes inside each section as you go, then flip the line above.

---

## Section 1 — Finish the Sidebar (task #9)  ·  status: 🔄 in progress

**File:** `app/routes/_components/sidebar.tsx` (already partly rebuilt).
**Goal:** mirror the template `.d-sidebar` — PTL brand on top, the nav rendered as
**labeled groups** (decision: "promote sections to groups"), collapsible submenus,
and a **company-switcher** footer.

### 1a. Add the group-flatten adapter
The data we get (`branches`, type `RouteBranch[]`) is one deep tree. Top level is the
workspace (`company`, label "Mitt selskap"; sometimes also `system-admin`). We must
turn the workspace's **children** into template groups.

1. Define a section shape near the top of the file:
   ```ts
   type SidebarSectionModel = {
     id: string;
     label: string;          // group label shown as .nav-label
     overviewHref?: string;  // optional "Oversikt" link (the workspace's own page)
     items: RouteBranch[];   // nav-links / collapsible groups
   };
   ```
2. Write `buildSections(branches: RouteBranch[]): SidebarSectionModel[]`:
   - First run the existing `filterVisibleBranches` (drops `hidden`).
   - For each top-level workspace branch `B`:
     - Push a section `{ id: B.id, label: B.label, overviewHref: B.href, items: leafChildrenOf(B) }`
       where `leafChildrenOf(B)` = children **without** their own children.
     - For each child `C` of `B` that **has** children, push a section
       `{ id: C.id, label: C.label, items: C.children }`.
   - Return the flat list of sections **in tree order**.
3. Call it once with `React.useMemo` and map over the result.

> Result for our data: `MITT SELSKAP` (Oversikt + any direct leaves), then
> `ADMINISTRASJON`, `BOOKING`, `VARSLER`, … each as its own labeled group.

### 1b. Render each section
For each `SidebarSectionModel` render the existing `SidebarSection` look:
1. `.nav-label`: `<span className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-disabled">{label}</span>`
2. If `overviewHref` is set, render an "Oversikt" `SidebarLeaf` first (icon = the
   workspace icon).
3. For each `item` in `items`:
   - has visible children → `<SidebarGroup>` (collapsible — already built).
   - otherwise → `<SidebarLeaf>` (already built).

### 1c. Swap the brand to the real logo (decision 3)
1. Delete the drafted `SidebarBrand` "P" chip.
2. Replace with the real logo:
   ```tsx
   import PTLLogo from '~/components/logos/PTL.logo';
   // ...
   <Link to="/" className="flex items-center border-b border-border pb-5 pl-1">
     <PTLLogo size="md" />
   </Link>
   ```
   Use the light variant (omit `onDark`) — the sidebar is white.

### 1d. Make the workspace footer a company switcher (decision 6)
1. `SidebarFooter` already renders avatar + name/role. Wrap its inner row in a button
   that navigates to the company-context switcher:
   ```tsx
   import { useNavigate } from 'react-router';
   import { ROUTES_MAP } from '~/lib/routing/route-tree';
   // onClick={() => navigate(ROUTES_MAP['user.company-context'].href)}
   ```
2. Keep the `ChevronsUpDown` icon (switcher affordance). Add `aria-label="Bytt selskap"`.

### 1e. Wire props
The component signature is `Sidebar({ branches, workspace })`. `workspace` is filled
by Section 2 from `companyContext`. Until then it's optional and the footer simply
doesn't render.

### Verify
- `npm run typecheck`.
- Temporarily render `<Sidebar branches={...} workspace={{name:'Test AS', subtitle:'admin'}} />`
  on `/styleguide` (or just eyeball in the app once Section 2 is done): groups show
  labels; the active route's group is expanded + highlighted; brand + footer present.

### ☑ Checklist
- [x] Base structure built (`SidebarSection`, `SidebarLeaf`, `SidebarGroup`
      collapsible + `SidebarSubLink`, `SidebarFooter`); drilldown removed.
- [x] 1a — `buildSections()` group-flatten adapter (workspace children → labeled groups).
- [x] 1b — render each section (nav-label + Oversikt + leaves/groups) from the adapter.
- [x] 1c — swap drafted "P" chip for real `PTLLogo`.
- [x] 1d — workspace footer wired as company switcher → `user.company-context`.
- [x] 1e — `workspace` prop fed from `companyContext` (done in Section 2).
- [x] `npm run typecheck` clean.

### Done when
Sidebar shows labeled groups (not one tree), submenus collapse/expand, active trail
is highlighted with the inset bar, PTL logo on top, switcher footer on bottom.

---

## Section 2 — Shell grid in `root.layout.tsx` (task #10)  ·  status: ⬜ not started

**File:** `app/routes/root.layout.tsx` (non-embed branch only — **do not touch** the
`if (isEmbedRoute)` branch).
**Goal:** the template `.shell` = `[ full-height Sidebar | main(topbar + content + footer) ]`.

### Steps
1. Find the non-embed `return (...)`. Today it is header-on-top then a row of
   sidebar+content. We restructure to a 2-column grid.
2. Compute the workspace object for the footer:
   ```ts
   const workspace = companyContext ? { name: companyContext.name, subtitle: 'Selskap' } : null;
   ```
   (Use a real role field if one exists on `companyContext`; otherwise "Selskap".)
3. New structure (keep `SimpleShinyBackground` + `FlashMessageBanner`):
   ```tsx
   <div className="min-h-screen bg-surface text-text-primary">
     <FlashMessageBanner message={loaderData.flashMessage} />
     {hasSidebar ? (
       <div className="lg:grid lg:grid-cols-[var(--app-sidebar-width)_1fr] lg:min-h-screen">
         <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-border bg-background px-4 py-5 lg:block">
           <Sidebar branches={sidebarBranches} workspace={workspace} />
         </aside>
         <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={...} onNavigateWithinMenu={...} />
         <div className="flex min-h-screen min-w-0 flex-col">
           <header className="sticky top-0 z-10 flex h-[var(--app-header-height)] items-center border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
             <Navbar navRoutes={userNav} companyContext={companyContext} hasSidebar onOpenSidebar={() => setMobileMenuOpen(true)} />
           </header>
           <main className="flex-1 px-3 py-4 sm:px-4 lg:px-8 lg:py-8">
             <Outlet context={{ userNav, setUserNav, companyContext, setCompanyContext }} />
           </main>
           <footer className="border-t border-border bg-background"><Footer /></footer>
         </div>
       </div>
     ) : (
       <div className="flex min-h-screen flex-col">
         <header className="sticky top-0 z-10 flex h-[var(--app-header-height)] items-center border-b border-border bg-background px-4 lg:px-8">
           <Navbar navRoutes={userNav} companyContext={companyContext} hasSidebar={false} onOpenSidebar={() => setMobileMenuOpen(true)} />
         </header>
         <main className="flex-1 px-3 py-4 sm:px-4 lg:px-8 lg:py-8"><Outlet context={...} /></main>
         <footer className="border-t border-border bg-background"><Footer /></footer>
       </div>
     )}
   </div>
   ```
4. Keep the `SimpleShinyBackground` only if you still want it; on opaque white chrome
   it won't show — it's fine to drop the wrapper `absolute inset-0` layer for the
   non-embed path (cleaner, matches the flat template). Confirm with the team.
5. Leave all loader/auth logic above the `return` unchanged.

### Verify
- `npm run typecheck` **and** `npm run build`.
- Log in as a company user → sidebar on the left, topbar + content + footer on the
  right. Log out / public route → no sidebar, full-width content.
- Resize to mobile: sidebar hidden, hamburger opens the drawer; content readable.

### ☑ Checklist
- [x] `workspace` object computed from `companyContext`.
- [x] `hasSidebar` branch = `.shell` grid `[ Sidebar | main(topbar+content+footer) ]`.
- [x] no-sidebar branch = full-width `main(topbar+content+footer)`.
- [x] embed branch untouched; `FlashMessageBanner` + mobile drawer preserved.
- [x] content padding mirrors `.content` (32 desktop / 16 mobile).
- [x] `npm run typecheck` **and** `npm run build` clean.

### Done when
Every authenticated route renders inside the grid shell; public/embed unaffected;
build is green.

---

## Section 3 — Topbar: breadcrumbs + actions (task #11)  ·  status: ⬜ not started

**File:** `app/components/layout/navbar.tsx`.
**Goal:** template `.d-topbar` — breadcrumb trail left, actions right, **no search**,
logo only when there's no sidebar.

### 3a. Breadcrumb trail (left)
1. Create a tiny helper (new file `app/lib/routing/breadcrumbs.ts`) that, given the
   sidebar/nav branches and the current `pathname`, returns the ancestor chain:
   ```ts
   export type Crumb = { label: string; href: string };
   export function buildCrumbs(branches: RouteBranch[], pathname: string): Crumb[] { /* walk tree, collect nodes whose href is a prefix of pathname, deepest last */ }
   ```
   (Mirror the `findTrail` logic already in the old sidebar — copy/adapt it.)
2. In the navbar, render:
   ```tsx
   <nav className="flex min-w-0 items-center gap-1.5 text-sm text-text-secondary" aria-label="Brødsmuler">
     {crumbs.map((c, i) => (
       <span key={c.href} className="flex min-w-0 items-center gap-1.5">
         {i > 0 && <span className="text-text-disabled">/</span>}
         {i === crumbs.length - 1
           ? <span className="truncate font-semibold text-text-primary">{c.label}</span>
           : <Link to={c.href} className="truncate hover:text-text-primary">{c.label}</Link>}
       </span>
     ))}
   </nav>
   ```

### 3b. Conditional logo
1. The `<section>` containing `<PTLLogo />` should render **only when `!hasSidebar`**
   (when there's a sidebar, the brand lives there). Wrap it: `{!hasSidebar && (<section>…</section>)}`.
2. When there IS a sidebar, that left slot shows the breadcrumbs instead.

### 3c. Actions (right) — keep existing, drop search
1. Keep `NavbarNotificationBell`, the user/avatar `DropdownMenu`, and the "Bestill
   time" button (and their existing visibility conditions — decision: keep as-is).
2. Do **not** add any ⌘K / search button.
3. Make sure the right cluster uses `.topbar-actions` spacing: `flex items-center gap-2`.

### Verify
- `npm run typecheck`.
- Authenticated: breadcrumbs reflect the current route (e.g. `Mitt selskap › Booking
  › Timeplan`); no logo in topbar. Public: logo shows, no breadcrumbs.

### ☑ Checklist
- [x] `buildCrumbs()` helper (route-tree ancestor trail).
- [x] breadcrumbs rendered on the left.
- [x] logo wrapped to render only when `!hasSidebar`.
- [x] actions kept (notifications, user menu, "Bestill time") — **no ⌘K**.
- [x] `npm run typecheck` clean.

### Done when
Topbar matches the template altitude: crumbs left, actions right, no search, no
duplicate logo.

---

## Section 4 — Page layout template (task #12)  ·  status: ⬜ not started

**File:** new `app/ui/templates/page-template.tsx` (or extend the existing
`app/ui/organisms/page-header.tsx`). Export from `ui/templates/index.ts`.
**Goal:** a reusable content-column page header matching the template `.content`
altitude, so every page looks consistent.

### Steps
1. Build `PageTemplate`:
   ```tsx
   export interface PageTemplateProps {
     eyebrow?: React.ReactNode;   // small mono label / breadcrumb echo
     title: React.ReactNode;      // font-display heading
     description?: React.ReactNode;
     actions?: React.ReactNode;   // right-aligned buttons
     children: React.ReactNode;
   }
   ```
   Layout: a header row (`flex items-start justify-between gap-4`) with
   `Eyebrow` + `font-display text-2xl font-bold tracking-tight` title + optional
   description on the left, `actions` on the right; then `children` below with
   `mt-6` spacing.
2. Use existing `Eyebrow` from `~/ui`.
3. Apply it to **one** representative real page (e.g. a company sub-route) as the
   reference implementation. Do not refactor every page yet — that happens naturally
   as pages are touched.

### Verify
`npm run typecheck`; the chosen page shows the new header altitude inside the shell.

### ☑ Checklist
- [x] `PageTemplate` built (eyebrow / title / description / actions / children).
- [x] exported from `ui/templates/index.ts`.
- [x] applied to one representative real page.
- [x] `npm run typecheck` clean.

### Done when
`PageTemplate` exists, is exported, and one real page uses it.

---

## Section 5 — Auth split-screen (Phase 5)  ·  status: 🔄 in progress

**Files:** new `app/ui/templates/auth-page-template.tsx`,
new `app/routes/auth/_components/social-button-row.tsx`,
edit each page under `app/routes/auth/*`.
**Decisions:** ALL auth pages use the split; social row = Google now + placeholders.
Sign-up stays local-only until the generated sign-up API contract supports provider
payloads.

### 5a. Build the template
1. `AuthPageTemplate`:
   ```tsx
   export interface AuthPageTemplateProps {
     aside?: React.ReactNode;     // marketing/brand column (defaults to a brand block)
     topRight?: React.ReactNode;  // e.g. "New here? Create account"
     children: React.ReactNode;   // the card content
   }
   ```
   Layout: `grid lg:grid-cols-2 min-h-screen`. Left `<aside>` `hidden lg:flex`
   (brand + heading + short copy; mirror `.auth-aside`). Right `<main>` centers a
   card (`max-w-md`, `bg-background`, `rounded-[var(--radius-card)]`, `shadow-card`,
   `p-6/8`), with `topRight` above it and a legal line below (mirror `.auth-main`).
2. Default the aside to a brand block (`PTLLogo` + a one-line value prop). Utility
   steps (verify/collect) can pass a shorter contextual `aside`.

### 5b. SocialButtonRow
1. Wrap the existing Google button (`app/routes/auth/sign-in/_components/google-sign-in-button.tsx`
   or `_components/provider-buttons.tsx`).
2. Style each as `.social-btn`: `Button variant="outline" fullWidth` with the provider
   icon + label. Render only Google now; leave a comment for future providers.
3. Precede with an `.auth-divider`: a centered "eller fortsett med" line.

### 5c. Convert each page
For every `app/routes/auth/*` route component:
1. Keep the loader/action/zod schema **exactly** as-is.
2. Replace the page's presentational wrapper with `<AuthPageTemplate>`.
3. Build the form with `~/ui`: `Input` (use `startIcon` for email/lock icons),
   `FormField`/field-message, `Checkbox` ("Husk meg"), `Button` (submit, `fullWidth`).
4. Add `SocialButtonRow` where the route action supports provider payloads. Today
   that means sign-in only; sign-up's generated DTO is local-account only.
5. Keep all field `name`s identical so the action still receives the same form data.

### Verify
- `npm run typecheck`.
- Sign in with email/password → still works. Google button → still initiates OAuth.
- Validation errors + flash messages still render. Check every auth page renders.

### ☑ Checklist
- [x] `AuthPageTemplate` built (split; aside `hidden lg:flex`).
- [x] `SocialButtonRow` (Google now + placeholders for future providers).
- [x] sign-in converted as the reference page.
- [x] sign-up converted with unchanged local-account action/schema.
- [x] forgot-password converted with unchanged action/schema.
- [x] reset-password converted with unchanged loader/action/schema.
- [x] collect-email and collect-mobile converted with unchanged loader/action fields.
- [x] check-email converted with unchanged polling/resend behavior.
- [x] verify-email converted with unchanged loader/redirect behavior.
- [x] verify-mobile converted with unchanged verify/resend form behavior.
- [x] respond-invite converted with unchanged inviteToken/respondAction fields.
- [x] respond-user-invite converted with unchanged loader/action fields and error states.
- [x] every `routes/auth/*` screen converted — loaders/actions/zod **untouched**.
- [x] converted page field `name`s unchanged; copy Norwegian; `SocialButtonRow`
      only where the action supports provider payloads.
- [x] `npm run typecheck` clean for the converted auth screens.
- [ ] email sign-in + Google + validation + flash manually verified.

### Done when
All auth pages use the split layout, submit through the unchanged actions, Google
works, copy is Norwegian.

---

## Section 6 — Dashboard at `/company` (Phase 6)  ·  status: ✅ done

**File:** `app/routes/company/company.route.tsx` (loader already returns
`companySummary`). 
**Goal:** template dashboard structure with **real data only**.

### Steps
1. Keep the loader. In the component, read `companySummary` from `loaderData`.
2. **Hero:** `Eyebrow` (today's date, Norwegian) + `font-display` greeting. Per
   resolved default **E2**: greet by company name —
   `Velkommen tilbake, {companySummary.name}` (use a user first-name only if it's
   already on the auth payload). Optional action buttons on the right.
3. **KPI row:** a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5` of `KpiCard`s
   fed from `companySummary` fields that actually exist (e.g. counts). For each:
   `label`, `value`, `unit?`, `icon={<Icon name="appointments" />}`, `tone`,
   optional `trend`/`compare`. **Drop any KPI without real data.**
4. **Card grid:** `CardGrid` + `GridCol`. Add only widgets with real data:
   - recent appointments / list → a `Card` + `CardHead` wrapping the existing
     `components/table` or a simple list.
   - todo list → reuse `components/layout/to-do-list.tsx` if it has real data.
   - Skip weather/chat/region-charts unless data exists.
5. Remove `CompanyMetricCard` usage here in favour of `KpiCard`.

### Verify
`npm run typecheck`; `/company` shows hero + KPIs + cards with live data, no
placeholders, inside the shell.

### ☑ Checklist
- [x] API pass: confirm which `companySummary` fields exist.
- [x] hero (date eyebrow + greeting by company name + optional actions).
- [x] KPI row from real fields via `KpiCard`; empty ones dropped.
- [x] one real list/table card (recent contacts/invites from dashboard metrics).
- [x] `CompanyMetricCard` replaced by `KpiCard` here.
- [x] decorative widgets (region/radial charts, weather, chat) dropped.
- [x] `npm run typecheck` clean.

### Done when
`/company` is a real, data-backed dashboard mirroring the template's structure.

---

## Section 7 — Calendar month view (Phase 7)  ·  status: ✅ done

**File:** `app/components/calendar/CalendarView.tsx` (the scheduling month view —
**not** `ui/primitives/calendar.tsx`).
**Decision:** month grid + toolbar only. No week/day tabs, no rail.

### Steps
1. **Toolbar** (mirror `.cal-toolbar-left`): prev/next as `Button variant="ghost"
   size="icon"` with chevron icons; a `font-display` month-year title; a "I dag"
   (today) `Button variant="outline" size="sm"`.
2. **Weekday header** (`.cal-weekdays`): a 7-col grid of short day names, muted.
3. **Day cells** (`.cal-day`): keep the existing date math; restyle each cell —
   `.cal-day-num` top-aligned; **today** = a small primary chip
   (`bg-interactive text-text-inverse rounded-[6px] px-1.5`); out-of-month days
   `text-text-disabled`; events as chips (`bg-blue-50 text-interactive` or tone by
   event type), with a "+N mer" overflow when needed.
4. Do **not** change the event data flow or click handlers (creating
   unavailability, etc.) — visual only.
5. Keep the mobile-friendly behavior already in place (see `todo.md`).

### Verify
`npm run typecheck`; open the schedule/calendar route → month grid matches the
template look; creating an event/unavailability still works.

### ☑ Checklist
- [x] toolbar (prev/next/today + month-year title) via `Button` variants.
- [x] weekday header (`.cal-weekdays`).
- [x] day cells: today chip, out-of-month muted, event chips, "+N mer" overflow.
- [x] event data flow + click handlers untouched.
- [x] mobile behavior preserved.
- [x] `npm run typecheck` clean.

### Done when
The month view visually mirrors `calendar.html` and all existing interactions work.

---

## Section 8 — Polish, QA, cleanup (Phase 8)  ·  status: [~] in progress

- [x] **Mobile drawer parity:** make `app/routes/_components/mobile-sidebar/mobile-sidebar.tsx`
      render the same grouped look as `Sidebar` (or reuse `Sidebar` inside the drawer).
- [x] **Error pages (E4):** restyle `ErrorBoundary` in `root.layout.tsx` toward
      `404.html`/`500.html`.
- [ ] **Responsive pass:** check 375 / 768 / 1024+. Per **E1**: compact density on
      desktop, but on mobile (<`md`) bump primary buttons to `min-h-11` (44px) and
      give nav rows / inputs taller tap areas.
- [ ] **Tables (E5):** light `.table`/`.tag`-style skin on
      `components/table/servier-side-table` — keep existing sort/pagination logic.
- [x] **Cleanup dead files:** `app/components/layout/navbar copy.tsx`,
      `app/routes/_components/sidebar copy.tsx`, and `sidebar-nav-link.tsx` if unused.
- [ ] **Final checks:** `npm run typecheck`, `npm run test`, `npm run test:e2e`,
      `npm run build` — all green.
- [ ] **Styleguide diff:** compare `/styleguide` against `buttons.html`, `ui.html`,
      `forms.html`.

### Done when
All checks pass, no dead files, mobile parity, and the app reads as a faithful mirror
of the template across the four target areas (shell, auth, dashboard, calendar).

---

## Quick reference — where things live
- Atoms/organisms barrel: `~/ui` (`Button`, `Badge`, `Input`, `Icon`, `Card`,
  `CardHead`, `CardAction`, `Eyebrow`, `KpiCard`, `CardGrid`, `GridCol`).
- Icons by route: `getIcon(branch.iconName)` from `~/lib/routing/route-icon-map`.
- Route map / hrefs: `ROUTES_MAP` from `~/lib/routing/route-tree`.
- Tokens: `app/styles/tokens.css` (don't hard-code colors).
- Visual reference page: `/styleguide`.
- High-level plan + decisions + open questions: `template-migration-plan.md`.
