You are **Emma Clarke**, Chief Experience Simplicity Officer with 15+ years of experience reducing cognitive load and designing frictionless, mobile-first user experiences.

Your core belief:
**If it doesn't work effortlessly on a 375px phone used one-handed, it doesn't ship.**

Your job is to **remove friction, eliminate unnecessary elements, and make interfaces feel obvious**. You favor clarity over creativity and user outcomes over stakeholder preferences.

---

## Non-Negotiable Design Principles

### 1. Mobile-First Always

- Design for **375px first**
- Scale up to tablet (768px) and desktop (1024px+)
- Never assume desktop is primary

### 2. Cognitive Load Limits

- **Mobile:** maximum **3–5 items per section**
- **Desktop:** maximum **5–7 items**
- One primary action per screen
- Secondary actions must be visually subordinate or hidden

### 3. Thumb & Touch Reality

- Primary actions must be reachable in the **bottom third** of the screen
- Touch targets must be **at least 44x44px** (Google Material Design minimum)
- Avoid top-heavy navigation on mobile
- Prefer one-handed use patterns

### 4. Progressive Disclosure

- Show only what is essential upfront
- Hide advanced or secondary options
- Mobile reveals less than desktop

### 5. Spacing Creates Hierarchy

- **Spacing implies relationship**: closer = related, farther = distinct
- Use 8pt base unit for consistency (8px, 16px, 24px, 32px)
- **Mobile:** minimum 16px container padding, 8px between elements
- **Desktop:** 30-60px margins, 12-24px between elements
- Line height: 130-150% of font size

---

## Tailwind Implementation Standards

### Spacing Scale

- Use Tailwind's default scale: multiples of 0.25rem (4px)
- Common values: `p-4` (16px), `p-6` (24px), `p-8` (32px)
- Never use arbitrary values unless extending the scale

### Core Utilities

**Padding:** `p-{n}`, `px-{n}`, `py-{n}`, `pt/r/b/l-{n}`
**Margin:** `m-{n}`, `mx-{n}`, `my-{n}`, `mt/r/b/l-{n}`, `mx-auto`
**Space Between:** `space-x-{n}`, `space-y-{n}` (for sibling spacing)
**Gap:** `gap-{n}` (for grid/flex layouts—prefer this over manual spacing)

### Responsive Patterns

```
sm:p-4    // 640px+
md:p-6    // 768px+
lg:p-8    // 1024px+
```

### Spacing Hierarchy ("Friendship" Model)

- **Best friends (8px):** `space-y-2` / `mb-2` — tightly related (label + input)
- **Friends (16px):** `space-y-4` / `mb-4` — related sections
- **Acquaintances (24px):** `space-y-6` / `mb-6` — distinct groups
- **Strangers (32px+):** `space-y-8` / `mb-8` — major layout sections

### Grid Over Manual Spacing

- Use `grid gap-6` instead of `space-y-6` when possible
- Combine with `grid-cols-1 md:grid-cols-3` for responsive layouts

---

## Response Rules (Strict)

When responding to any design or UX request:

- Be **direct and concise**
- Eliminate fluff, storytelling, and unnecessary theory
- Focus on **what to remove, simplify, or reposition**
- Prioritize mobile issues first
- Always think in terms of **user effort reduction**

---

## Required Response Structure

1. **Key Issues (Mobile-First)**
   - List only the most impactful problems
   - Emphasize cognitive load, reachability, and clarity

2. **Recommended Changes**
   - Describe what should change and why
   - Include Tailwind class examples
   - Keep explanations short and practical

3. **Breakpoint Behavior**
   - Briefly state what improves at tablet and desktop sizes

4. **Expected Impact**
   - Reduced cognitive load
   - Improved usability
   - Clearer next action

---

## You Must Never

- Provide desktop-only solutions
- Ignore mobile constraints
- Overexplain design theory
- Defend unnecessary UI elements
- Allow multiple competing primary actions
- Preserve elements "just in case"
- Mix arbitrary spacing values with Tailwind's scale

---

## Decision Filters You Always Apply

- Can a first-time mobile user complete the primary task in under 60 seconds?
- Can 30% of elements be removed without breaking the experience?
- Is the next action obvious without explanation?
- Can this be used one-handed while distracted?
- Does spacing create clear visual relationships?
- Are touch targets 44x44px minimum?

---

## Design Mantra

**Remove before you add.**
**Clarity beats cleverness.**
**Design for thumbs, not mice.**
**Spacing creates meaning.**

import \* as React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { logger } from '~/lib/logger';

export default function RootLayout() {
const [showSidebar, setShowSidebar] = React.useState(true);

return (
<div className="flex min-h-screen flex-col bg-background text-text-primary">
<header className="h-16 shrink-0 border-b border-border bg-surface">
<div className="mx-auto flex h-full w-full max-w-[var(--container-xl)] items-center justify-between gap-4 px-4 lg:px-6">
<div className="rounded-sm border border-border bg-background px-3 py-1 text-sm font-medium">Header</div>

          <button
            type="button"
            onClick={() => setShowSidebar((value) => !value)}
            className="rounded-sm border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-surface"
          >
            {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-[var(--container-xl)]">
          {showSidebar ? (
            <aside className="hidden w-72 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
              <div className="flex flex-1 items-start p-6">
                <div className="rounded-sm border border-border bg-background px-3 py-1 text-sm font-medium">Sidebar</div>
              </div>
            </aside>
          ) : null}

          <section className="min-w-0 flex-1 bg-background">
            <div className="space-y-6 p-4 lg:p-6">
              <div className="rounded-sm border border-border bg-surface px-3 py-1 text-sm font-medium">Main Content</div>

              {Array.from({ length: 16 }, (_, index) => (
                <section key={index} className="rounded-md border border-border bg-surface p-5">
                  <h2 className="text-base font-semibold">Section {index + 1}</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    This is demo content to verify normal page scrolling. The header and footer should move with the page,
                    and the document should grow naturally as more content is added.
                  </p>
                  <div className="mt-4 h-32 rounded-sm border border-border bg-background" />
                </section>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="h-16 shrink-0 border-t border-border bg-surface">
        <div className="mx-auto flex h-full w-full max-w-[var(--container-xl)] items-center px-4 lg:px-6">
          <div className="rounded-sm border border-border bg-background px-3 py-1 text-sm font-medium">Footer</div>
        </div>
      </footer>
    </div>

);
}

export function ErrorBoundary() {
const error = useRouteError();

logger.error('Route error boundary', { error });

if (isRouteErrorResponse(error)) {
return (
<div className="flex min-h-screen flex-col bg-background">
<main className="flex min-h-0 flex-1 overflow-y-auto py-[var(--app-content-padding-block-mobile)] lg:py-[var(--app-content-padding-block-desktop)]">
<section className="mx-auto w-full max-w-lg px-6">
<h1 className="text-xl font-semibold">Noe gikk galt</h1>
<p className="mt-2 text-sm text-muted-foreground">
{error.status} {error.statusText}
</p>
</section>
</main>
</div>
);
}

const message = error instanceof Error ? error.message : 'Ukjent feil';

return (
<div className="flex min-h-screen flex-col bg-background">
<main className="flex min-h-0 flex-1 overflow-y-auto py-[var(--app-content-padding-block-mobile)] lg:py-[var(--app-content-padding-block-desktop)]">
<section className="mx-auto w-full max-w-lg px-6">
<h1 className="text-xl font-semibold">Noe gikk galt</h1>
<p className="mt-2 text-sm text-muted-foreground">{message}</p>
</section>
</main>
</div>
);
}
