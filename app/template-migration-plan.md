# Template → React **Full Mirror** Plan ("Adminator 2026")

> **Goal.** Make the app **completely mirror** the static template in `/template` —
> its layout, sidebar (grouping, indentation, collapsible submenus), topbar, brand,
> buttons, icons, cards, auth pages, calendar, and dashboard — while reusing the
> app's existing design-system, routing, auth, and API. We mirror the template's
> **structure + visual language**; the **content** is always *this project's real
> routes and components* — never the demo pages (email/chat/maps/charts).
>
> **Method.** Tokens are the integration layer (re-point `@theme` once → everything
> re-skins), then mirror structure component-by-component, bottom-up.
>
> **Decisions (locked):** Inter / Inter Tight / JetBrains Mono · light mode only ·
> calendar mapped onto our in-house `Calendar` (no FullCalendar/Chart.js bundles) ·
> use only project-relevant pages.

---

## STATUS (live)

| Phase | Status |
|-------|--------|
| 0 — Capture + inventory | ✅ done (this doc is the artifact) |
| **1 — Tokens & fonts** | ✅ **DONE** |
| **2 — Atoms (button/badge/input/icon)** | ✅ **DONE** |
| **3 — Layout & cards** | ✅ **DONE** |
| **4 — FULL MIRROR: shell + sidebar + page layout** | ✅ **DONE** |
| 5 — Auth split-screen | ✅ DONE (code conversion; manual auth QA still open) |
| 6 — Dashboard widgets | ✅ DONE |
| 7 — Calendar mirror | ✅ DONE |
| 8 — Polish / QA | blocked on P4–P7 |

**Todos (tracked):** Phase 5 auth split-screen · Phase 6 dashboard widgets ·
Phase 8 polish/QA.

---

## A. Template asset reference (what each file is, and do we mirror it?)

All paths relative to `/template`. "Use?" = does it map to a real feature here.

| File | What it is | Key classes / hooks | Use? |
|------|-----------|---------------------|------|
| `style.css` (98 KB) | All tokens + component CSS. `:root[data-theme=light\|dark]`. | every `--var`, `.btn`, `.card`, `.kpi-*`, `.nav-*`, `.d-sidebar`, `.d-topbar`, `.cal-*`, `.auth-*` | ✅ source of truth for visuals |
| `2026.js` (30 KB) | Builds the shell (sidebar/topbar/footer) into `[data-shell-*]`, holds the **nav model** `n=[{label,items}]`, theme toggle (`dash26-theme`), nav collapse (`data-nav-toggle`), breadcrumbs (`body[data-crumbs]`), active item (`body[data-active]`). | `data-shell-sidebar/topbar/footer`, `data-nav-toggle`, `data-crumbs`, `data-active`, `data-palette-open` | ✅ structure reference only (we use React Router, not this JS) |
| `index.html` | Dashboard. hero + `kpi-grid` (4 KPI) + 12-col `grid`: site-visits (region bars + radials), monthly chart, todo list, sales table, weather, quick chat. | `.hero`, `.kpi-card`, `.grid`/`.col-*`, `.sv-region*`, `.sv-radial`, `.todo-*`, `.table`, `.wx-*`, `.chat-*` | ✅ Phase 6 (real-data widgets) |
| `signin.html` / `signup.html` | Split-screen auth: `.auth-aside` (brand + marketing + quote) ‖ `.auth-main` (`.auth-card` form + social-row + legal). | `.auth-shell`, `.auth-aside`, `.auth-card`, `.field`, `.input-icon`, `.check`, `.social-btn`, `.auth-divider` | ✅ Phase 5 |
| `calendar.html` | **Custom** calendar shell (NOT raw FullCalendar markup): toolbar + view tabs + month grid + right rail + quick-add FAB + agenda list. | `.cal-shell`, `.cal-toolbar`, `.cal-views`/`.cal-view-tab`, `.cal-month`, `.cal-weekdays`, `.cal-day`/`.cal-day-num`, `.cal-event`, `.cal-rail*`, `.cal-quickadd`, `.cal-list*` | ✅ Phase 7 (map onto in-house Calendar) |
| `buttons.html` | Button showcase — all variants/sizes/states. | `.btn--*`, `.btn-group` | ✅ Phase 2 (done) — diff target |
| `ui.html` | UI elements: badges, tags, pills, alerts, avatars, progress, tabs, tooltips. | `.tag`, `.badge`, `.pills`, `.kpi-pill`, `.todo-badge` | ✅ Phase 2/3 — diff target |
| `forms.html` | Form anatomy. | `.form-grid`, `.field`, `.field-label/.req`, `.field-help`, `.field-error`, `.input`, `.select`, `.textarea`, `.input-group`/`.addon`, `.input-icon`, `.check`, `.switch` | ✅ Phase 2/5 — field patterns |
| `basic-table.html` / `datatable.html` | Tables. | `.table`, `.tag` cells, sort sprites | ↺ map onto existing `components/table` (Phase 6/later) |
| `charts.html` | Chart.js demos | `[data-chart-key]` canvases | ⨯ skip lib; reproduce only the simple SVG/CSS charts we need |
| `email.html`,`compose.html`,`chat.html`,`google-maps.html`,`vector-maps.html`,`blank.html` | Demo pages | — | ⨯ not relevant to this project |
| `404.html` / `500.html` | Error pages | `.error-*` | ↺ optional: skin our `ErrorBoundary` in Phase 8 |
| `assets/`, `vendor-*.js` | logos, fonts (FontAwesome/Themify), FullCalendar + Chart.js bundles | — | ⨯ we use lucide + Inter via Google Fonts; do not bundle |

---

## B. Template → token map (implemented in Phase 1)

`:root[data-theme=light]` → our `@theme` aliases in `app/styles/tokens.css`:

| Template var | Value | Our token |
|---|---|---|
| `--bg-body` | `#f0f4f8` | `--color-surface` (page) |
| `--bg-card` / `--bg-sidebar` | `#ffffff` | `--color-background` (chrome + cards) |
| `--bg-hover` | `#f8fafc` | `--color-surface-variant-1` |
| `--bg-muted` | `#f1f5f9` | `--color-surface-variant-2` |
| `--t-base/-muted/-light` | `#1e293b`/`#64748b`/`#94a3b8` | `--color-text-primary/secondary/disabled` |
| `--border` / `--border-soft` | `#e4e8ef`/`#eef1f5` | `--color-border` |
| `--primary` / `--primary-dark` / `--primary-soft` | `#2563eb`/`#1d4ed8`/`#eff6ff` | `--color-interactive`+`--color-primary` / `…-hover` / `--color-blue-50` |
| `--success/warning/danger/info/purple` (+ `-soft`) | per template | `--color-{tone}` (+ `-soft`) |
| `--shadow-card` / `--shadow-lg` | 2-layer slate | `--shadow-card` (=md) / `--shadow-floating` |
| fonts | Inter / Inter Tight / JetBrains Mono | `--font-sans` / `--font-display` / `--font-mono` |
| radii | btn/input 8 · card 12–14 · pill 999 | `--radius-control/field` 8 · `--radius-card` 12 · `--radius-xl` 16 · `--radius-badge` full |

> The single biggest change was `--color-interactive` black→blue; `booking-tokens.css`
> derives from it and follows automatically.

---

## Phase 0 — Capture + inventory ✅ (this document)
- [x] Catalogued every template file (section A) and its relevance.
- [x] Extracted the nav model (`2026.js` `n=[…]`) and confirmed the app already
      carries `iconName` per route (`route-icon-map.ts`) → no separate nav model file.
- [x] Mapped template inline SVGs → lucide via `ui/atoms/icon-map.ts`.

## Phase 1 — Design tokens & fonts ✅ DONE
- [x] `tokens.css`: added blue scale, slate neutrals, `--color-page`, full status
      palette (`success/warning/danger/info/purple/pink/teal/orange` + `-soft`).
- [x] Repointed semantic aliases (background→white, surface→page, text/border→slate,
      interactive/primary→`#2563eb`).
- [x] Fonts → Inter/Inter Tight/JetBrains Mono (`tokens.css` + `root.tsx` link).
- [x] Radii + shadows matched to template; `app.css` body→`bg-surface`.
- [x] `npm run typecheck` green.

## Phase 2 — Atoms ✅ DONE  · diff target: `buttons.html`, `ui.html`, `forms.html`
- [x] `button.tsx` — variants mirror `.btn--*`: filled `primary/secondary/success/
      warning/danger/info`, `soft-*` (tinted), `outline-primary/success/danger`,
      `ghost`; sizes sm/md/lg/`icon`; `active` (`.is-active`).
- [x] `badge.tsx` — soft tones `muted/success/warning/danger/info/purple` + `solid`
      + `dot` (covers `.tag`, `.kpi-pill`, `.todo-badge`, `.badge`).
- [x] `input.tsx` — `forwardRef`, `startIcon` (`.input-icon`), `invalid`
      (`.is-invalid`), soft 3px focus ring.
- [x] `icon-map.ts` + `icon.tsx` — central lucide registry; `<Icon name>`.
- [x] `routes/styleguide.tsx` at `/styleguide` (no auth) — every variant + icon grid.
- [ ] **TODO (P2 follow-ups):** `.input-group`/`.addon`, `.switch`, `.select`,
      `.textarea` invalid state — mirror when first needed (forms/auth).

## Phase 3 — Layout & cards ✅ DONE  · ref: `index.html` `.card`/`.kpi-card`/`.grid`
- [x] `card.tsx` — white surfaces; `Eyebrow` (`.eyebrow`), `CardAction`
      (`.card-action`), `CardHead` (`.card-head`: eyebrow+heading+action+divider).
- [x] `card-grid.tsx` — `CardGrid` (12-col `.grid`) + `GridCol` (`span` 3/4/6/8/9/12).
- [x] `kpi-card.tsx` — `KpiCard` mirrors `.kpi-card` (tone icon chip `.kpi-icon`,
      `.kpi-pill` trend, 44px Inter-Tight `.kpi-value`+`<sup>`, dashed `.kpi-compare`,
      corner radial glow `.kpi-card:before`).
- [x] `/styleguide` extended with KPI + cards + grid.

---

## Phase 4 — FULL MIRROR: shell + sidebar + page layout ⭐ (current)

> Source of structure: `2026.js` shell builder + `style.css` (`.shell`, `.d-sidebar`,
> `.d-topbar`, `.main`, `.content`, `.nav-*`, `.brand`, `.sidebar-footer`,
> `.workspace`, `.crumbs`).

### Template shell skeleton (verbatim structure)
```
.shell  { display:grid; grid-template-columns:248px 1fr; min-height:100vh }   // →72px icon-rail @md → block @mobile
├── aside.d-sidebar  { bg:#fff; border-right; flex-col; gap:22; height:100vh; sticky top:0; overflow-y:auto; padding:22 16 18 }
│   ├── .brand            { border-bottom; padding:4 10 20 }   .brand-logo(32px primary, rounded8, white glyph) + .brand-text(.brand-name InterTight 15.5/700, .brand-tag mono 9.5)
│   ├── nav.nav-section   (× groups) { flex-col gap:2 }   .nav-label(mono 10px, uppercase, tracking .2em, t-light, pad 0 10 6)
│   │   ├── a.nav-link       leaf  { gap:12; radius8; pad 9 12; 13/500; icon 17 stroke1.75 }  hover=bg-hover/t-base  is-active=primary-soft + inset 3px primary bar + primary text
│   │   └── .nav-item-group  parent { a.nav-link[data-nav-toggle] icon+span+.chev }  + .nav-submenu
│   │       └── .nav-submenu { ml:20; pl:14; left hairline (::before); max-height 0→400 (.is-open); a: 12.5px, hover pl-shift, is-active primary-soft/600 }
│   └── .sidebar-footer  { border-top; margin-top:auto; pad-top:16 }   .workspace: .workspace-avatar(32px gradient primary→purple, initials) + .workspace-name/.workspace-role + chevron
└── .main  { flex-col; min-w-0 }
    ├── .d-topbar  { height:60; sticky top:0 z:10; flex justify-between; pad 0 32; border-bottom; bg overlay+blur }
    │     left  = .crumbs  (from body[data-crumbs] "Workspace | Dashboard"; last = .current bold)
    │     right = .topbar-actions { gap:6 }  → search cmd(.cmd ⌘K) · notifications(.icon-btn dropdown) · theme toggle · avatar
    ├── .content  { padding:32 32 24 } (→20 16 16 mobile)   ← routed page
    └── footer
```

### ⭐ Integration decisions (user, 2026-06-12)
1. **Grouping — promote sections to groups.** Our nav is one deep tree under the
   `company` ("Mitt selskap") branch (+ `system-admin` for admins). Mirror the
   template's *multi-group* sidebar by rendering the **second level** as the template
   `nav-section`s: each child of the workspace branch (Administrasjon, Booking,
   Timeplan, Varsler, …) becomes its own labeled `.nav-label` section; that section's
   children are the `nav-link` items; any item with its own children stays a
   collapsible `nav-item-group`. The workspace branch itself contributes an
   "Oversikt"/overview link at the top. `system-admin` becomes its own group(s) the
   same way. Net effect: a `MITT SELSKAP / ADMINISTRASJON / BOOKING / VARSLER`-style
   grouped sidebar instead of one big tree.
   → `Sidebar` needs a small "flatten one level into sections" adapter over
   `sidebarBranches` before rendering.
2. **No icon-rail.** Fixed full-width sidebar on desktop; mobile = drawer (existing
   `mobileMenuOpen`). Skip the template's 72px collapse entirely.
3. **Brand = real PTL logo.** Use `PTLLogo` (symbol + "Pitell" wordmark) in the
   sidebar `.brand` slot — *not* the drafted "P" chip. Light variant (sidebar is
   white). Re-evaluate the drafted `SidebarBrand`.
4. **Topbar follows the template layout exactly — minus search.** `.crumbs`
   (breadcrumb trail) on the left; `.topbar-actions` on the right in template order:
   notifications bell · user/avatar menu · "Bestill time". **No ⌘K / search command
   — dropped (not needed).** Logo lives in the sidebar, **not** the topbar (except
   when there is no sidebar — public/auth — where the topbar shows the logo).
5. **Breadcrumbs = route-tree labels (auto).** Build the `.crumbs` trail from the
   active route's ancestor `label`s (e.g. `Mitt selskap › Booking › Timeplan`). No
   per-page overrides for now → needs a `findTrail`-style helper over the route tree.
6. **Workspace footer = company switcher.** The sidebar `.workspace` block shows the
   current company name + role and, on click, opens a company-context switcher
   (routes to `ROUTES_MAP['user.company-context']`). Chevron = switcher affordance.
7. **Embed stays neutral.** `/embed` keeps its existing per-host embed theme tokens;
   the mirror applies to the **main app only**. (Embed branch in `root.layout.tsx`
   already isolated — leave it.)

### Mapping to THIS project (relevant routes only)
- Drive the tree from `userNav[RoutePlaceMent.SIDEBAR]` (already auth-filtered by
  `route-utils.createNavigationForTree`). Our tree is **4–5 levels deep**
  (`company → admin → employees → invite/edit …`), so mirror the template's **2
  visible levels** (section → item → one collapsible submenu); deeper levels are
  reached in-page. `hidden` branches (create/edit forms) are filtered out.
- **Section** = top-level branch with children (`nav-label` = `branch.label`, e.g.
  "Mitt selskap"). Top-level leaf → standalone `nav-link`.
- **Item** = section child. Child-with-children → collapsible `nav-item-group`; its
  children become indented submenu leaves; auto-open the group on the active trail.
- **Icons** = `branch.iconName` via `getIcon()`.
- **Brand** = "Pitell / PORTAL" chip (replaces template's Adminator brand).
- **Workspace footer** = `companyContext.name` + role/subtitle.
- **Topbar crumbs** = derive from the active route trail (our analog of
  `data-crumbs`); keep `CompanyHeader`, notifications, user menu, "Bestill time".

### Sub-tasks (tracked todos)
- [x] **#9 Sidebar mirror** — `routes/_components/sidebar.tsx` rebuilt: `SidebarSection`
      (`.nav-section`+`.nav-label`), `SidebarLeaf` (`.nav-link`), `SidebarGroup`
      (collapsible `.nav-item-group`+`.nav-submenu`, caret rotate, max-height,
      auto-open on trail), `SidebarSubLink`, `SidebarFooter` (`.workspace`). Drilldown
      removed. **Applied:** (a) added the *flatten-one-level* adapter so the
      workspace's children render as labeled groups (decision 1); (b) replaced the
      drafted `SidebarBrand` "P" chip with `PTLLogo` (decision 3); (c) kept full-width
      desktop sidebar, no icon-rail (decision 2); (d) wired `SidebarFooter`
      `.workspace` as a **company switcher** → `user.company-context` (decision 6).
      `workspace` is now fed from `companyContext` in the shell grid.
- [x] **#10 Shell grid** — `root.layout.tsx` non-embed branch → `.shell` grid
      `[Sidebar | main(Topbar+Content+Footer)]` when `hasSidebar`; full-width
      `main(...)` otherwise. Preserve embed branch, `FlashMessageBanner`, mobile
      drawer state. The non-embed background is now the template's flat surface
      rather than `SimpleShinyBackground`. Content padding mirrors `.content`
      (32 desktop / 16 mobile).
- [x] **#11 Topbar** — `components/layout/navbar.tsx` → `.d-topbar` altitude
      (decisions 4–5): **left** = `.crumbs` breadcrumb trail auto-built from the active
      route's ancestor labels (helper over the route tree); **right** =
      `.topbar-actions` in template order — `NavbarNotificationBell` · user/avatar menu
      · "Bestill time". **No search/⌘K.** `PTLLogo` only when there is no sidebar
      (public/auth).
- [x] **#12 Page layout** — `ui/templates/page-template.tsx` (or align existing
      `page-header.tsx`) to the template content altitude: page header = eyebrow/
      breadcrumb + `font-display` title + actions, then content. Apply to one real
      page (e.g. a company route) as the reference; dashboard widgets are Phase 6.
- [x] **Mobile drawer** — render the same `Sidebar` as a fixed `translateX` drawer
      (template `.d-sidebar` mobile rules) via the existing `mobileMenuOpen` state;
      may defer deep parity to Phase 8.

### Acceptance criteria
- Sidebar shows all permitted groups at once (no drilldown), with indented
  collapsible submenus and the active trail expanded + highlighted (inset bar).
- Brand sits at sidebar top; workspace block pinned to sidebar bottom.
- Topbar is breadcrumbs + actions; logo not duplicated.
- Every existing route renders inside the new shell; embed + mobile still work.
- `npm run typecheck` + `npm run build` green.

### Already shipped during P4 (kept)
Token fixes for the **undefined** `navbar-*`/`button-*`/`sidebar-accent` namespaces
(were silent no-ops); footer rewrite; shell bg flip (chrome white / content bluish).

---

## Phase 5 — Auth split-screen  · source: `signin.html`, `signup.html`

Template structure:
```
.auth-shell (grid 2-col; aside hidden on mobile)
├── aside.auth-aside   .auth-brand(logo+name) · .auth-aside-body(eyebrow+h1+p) · .auth-quote(testimonial+avatar) · .auth-aside-footer
└── main.auth-main
    .auth-main-top(back-link + switch-link "Create account/Sign in")
    .auth-card  h2 + .sub + form(.field × n, .input-icon, .check "keep me signed in", submit) + .auth-divider + .social-row(.social-btn × 3) 
    .auth-main-bottom(legal)
```

**Scope decisions:** *all* auth pages use the split-screen (decision A). Social row =
**Google now + styled placeholders** for future providers (decision B) — reuse
existing `provider-buttons.tsx` / `google-sign-in-button.tsx`. Sign-up remains
local-only until its generated API contract supports provider payloads.

- [x] `ui/templates/auth-page-template.tsx` — two-column split (`aside` + `children`
      slots); aside collapses below `lg`. Brand, marketing copy, optional quote as
      props. Used by **every** `routes/auth/*` page (sign-in/up, forgot/reset, verify
      email/mobile, collect email/mobile, respond-invite). For utility steps the aside
      can show brand + a short contextual line rather than a testimonial.
- [x] `SocialButtonRow` molecule (`.social-btn`) wrapping the existing Google
      provider button; leave room for future providers (BankID/Vipps) as placeholders.
- [~] Rebuild `routes/auth/*` **presentation** with the template + our Phase-2
      `Input startIcon`, `FormField`/`field-message`, `Checkbox`, `Button`. **Keep all
      loaders/actions/zod validation** — visual change only. Sign-in, sign-up,
      forgot-password, reset-password, collect-email, collect-mobile, check-email,
      verify-email, verify-mobile, respond-invite, and respond-user-invite are
      converted.
- [~] Localize copy (Norwegian: "Logg inn", "Opprett konto", "Husk meg").
- [ ] Acceptance: every auth page renders the split layout, submits through the
      existing action, Google sign-in + validation + flash messages intact.

## Phase 6 — Dashboard widgets  · source: `index.html`

**Target decision:** rebuild the existing **`/company`** route
(`routes/company/company.route.tsx`) as the dashboard — it already loads
`getCompanySummary`. Replace `CompanyMetricCard` usage with `KpiCard`. Mirror the
*structure* of each widget with **our real data**; skip Chart.js.

- [x] **Hero** (`.hero`): eyebrow date + `font-display` greeting + sub + actions
      (Export / primary action) — map to a real landing context.
- [x] **KPI row** (`.kpi-grid`, 4×): reuse `KpiCard` with real metrics
      (appointments, etc.). Retire `CompanyMetricCard` usages in favour of `KpiCard`.
- [x] **12-col grid** (`CardGrid`/`GridCol`):
  - region bars (`.sv-region-bar`) + radials (`.sv-radial`, SVG dash-offset) → pure
    SVG/CSS components, no lib.
  - monthly stats: render as a simple SVG/CSS bar/line *only if* we have the data;
    otherwise omit (relevant-only).
  - todo list (`.todo-*`) → reuse `components/layout/to-do-list.tsx` + `Badge` tones.
  - table card (`.table` + `.tag`) → reuse `components/table`.
  - drop weather/chat (not relevant).
- [x] Acceptance: a real dashboard route composed from `Card`/`KpiCard`/grid with no
      placeholder/demo data.

## Phase 7 — Calendar mirror  · source: `calendar.html` (custom `.cal-*`, NOT FullCalendar)

**Scope decision:** mirror **month grid + toolbar only** — no week/day view tabs, no
right-rail agenda. Target = `components/calendar/CalendarView.tsx` (the scheduling
month view), **not** `ui/primitives/calendar.tsx` (that's the date-picker primitive).

The template's calendar is a **custom layout**, not raw FullCalendar markup — good,
because we already have an in-house `Calendar`.
```
.cal-shell = .cal-main [ .cal-toolbar(.cal-toolbar-left: nav ‹ › + title + today · .cal-toolbar-right: .cal-views/.cal-view-tab) · .cal-month(.cal-weekdays + .cal-day grid; .cal-day-num, today=primary chip; .cal-event chips; .cal-more) ]
            + .cal-rail(.cal-rail-card: head + agenda .cal-list/.cal-list-item) + .cal-quickadd FAB
```
- [x] Re-skin `components/calendar/CalendarView.tsx` to the `.cal-*`
      language: toolbar (our `Button` variants for nav/today), weekday header,
      day cells (today chip, muted out-of-month), event chips, and overflow count.
- [x] Keep all booking/availability/unavailability wiring — presentation only.
- [x] Mobile: preserve the already-mobile-friendly behavior (see `todo.md`).
- [x] Acceptance: month view matches template visually; existing event interactions
      (create unavailability, etc.) unchanged.

## Phase 8 — Polish, QA, cleanup
- [x] Mobile sidebar drawer full parity with the new `Sidebar`.
- [x] Skin `ErrorBoundary` to `404.html`/`500.html` language (optional).
- [ ] `/styleguide` full visual diff vs `buttons.html`/`ui.html`/`forms.html`.
- [ ] Responsive pass 375 / 768 / 1024+ (honor `design-prompt.md` mobile-first rules).
- [ ] `npm run typecheck` + `test` + `test:e2e` smoke.
- [x] Remove dead files: `components/layout/navbar copy.tsx`,
      `routes/_components/sidebar copy.tsx`, and `SidebarNavLink` if unused.
- [x] Confirm `/template` is reference-only (never imported into the build).

---

## C. Component inventory (created / extended / planned)

**Done — extended:** `button.tsx`, `badge.tsx`, `input.tsx`, `card.tsx`, layout
primitives, `footer.tsx`, `navbar.tsx` (token cleanup), `root.layout.tsx` (bg).
**Done — new:** `icon.tsx`+`icon-map.ts`, `kpi-card.tsx`, `card-grid.tsx`,
rebuilt `sidebar.tsx`, `/styleguide`.
**Planned:** shell grid in `root.layout.tsx` (#10), topbar crumbs (#11),
`page-template.tsx` (#12), `auth-page-template.tsx` + `SocialButtonRow` (P5),
dashboard route + SVG mini-charts (P6), calendar re-skin (P7).

## E. Resolved defaults (best-judgment — user delegated, 2026-06-12)

These were open; resolved with sensible defaults. Revisit only if a phase proves them
wrong.

1. **Mobile density vs touch targets → mobile wins on mobile.** Keep the template's
   compact density on desktop (≥`md`), but on mobile (<`md`) ensure primary
   interactive controls meet **≥44px** (per `design-prompt.md`): buttons step up
   (e.g. `h-11`/`min-h-11` on mobile), sidebar/nav rows and form inputs get taller
   tap areas. Density is a desktop nicety; touch-safety is non-negotiable on mobile.
   *(apply in Phase 4 nav + Phase 8 sweep)*
2. **Hero greeting → greet by company name.** Use `companySummary.name`
   ("Velkommen tilbake, {company}") since it's always present. If a user first-name is
   trivially available from the auth payload, prefer that; otherwise company name.
   No extra fetch just for a greeting. *(Phase 6)*
3. **Dashboard widgets → data-driven, decorative ones dropped.** Build KPIs strictly
   from fields `companySummary` actually exposes; include **one** real list/table card
   (recent appointments or similar) only if an endpoint already exists; **drop** the
   region-bar / radial mini-charts and weather/chat (decorative, no data). Do a quick
   API pass at the start of Phase 6 to confirm available fields. *(Phase 6)*
4. **Error pages → light skin in Phase 8.** Restyle `ErrorBoundary` to the template
   `404.html`/`500.html` language (centered card, illustration optional). Low effort,
   good polish. *(Phase 8)*
5. **Tables → light skin, reuse logic.** Apply the template `.table` look (header
   weight, row rhythm, `.tag`-style status cells via `Badge`) to
   `components/table/servier-side-table` presentation only. **Keep** existing
   sorting/pagination logic; don't rebuild it. *(Phase 6/8)*
6. **Topbar action visibility → keep existing rules.** Preserve current conditionals
   ("Bestill time" only for non-logged-in company users; notifications only when
   permitted; user menu when available). *(Phase 4 / #11)*

## D. Conventions
- Mirror structure, not pixels-from-a-screenshot — drive everything from tokens.
- Replace inline SVGs with lucide via `Icon`/`getIcon`.
- Reuse `~/ui` atoms/organisms; add variants, never fork.
- Norwegian copy in product surfaces.
- `npm run typecheck` after every phase; `npm run build` after structural phases.
