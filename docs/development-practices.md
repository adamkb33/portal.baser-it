# Development Practices & Conventions

## Code Style & Formatting

### TypeScript Standards

- **Strict mode enabled** - All TypeScript strict checks are enforced
- **Explicit return types** for public functions and API boundaries
- **Interface over type** for object definitions when possible
- **Consistent naming conventions**:
  - `PascalCase` for components, types, interfaces
  - `camelCase` for variables, functions, properties
  - `SCREAMING_SNAKE_CASE` for constants

### File Naming Conventions

**Routes follow dot notation pattern:**
- **Route files**: `[category].[feature].route.tsx` (e.g., `auth.sign-in.route.tsx`)
- **Layout files**: `[category].[feature].layout.tsx` (e.g., `auth.sign-in.layout.tsx`)
- **Feature modules**: Group in `_features/`, `_schemas/`, `_forms/`, `_utils/` folders
- **Components**: `PascalCase.tsx` or `kebab-case.tsx` for UI components
- **Types**: `*.types.ts` or embedded in relevant files

### Import Organization

```typescript
// 1. External libraries
import { data, redirect, type LoaderFunctionArgs } from 'react-router';
import { useState, useEffect } from 'react';

// 2. Internal API types (generated)
import type { ScheduleDto } from 'tmp/openapi/gen/booking';

// 3. Internal utilities and features
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';

// 4. Relative imports last
import { formatTime } from './date-utils';
```

## Component Architecture

### Component Structure

```typescript
// Type definitions first
export type ComponentNameProps = {
  // props definition
};

export type ComponentNameLoaderData = {
  // loader data type
};

// Async functions (loaders/actions) before component
export async function loader({ request }: LoaderFunctionArgs) {
  // loader implementation
}

export async function action({ request }: ActionFunctionArgs) {
  // action implementation
}

// Main component export
export default function ComponentName() {
  // component implementation
}
```

### React Router Patterns

- **Type-safe route handlers** - Use generated `+types` imports for actions/loaders
- **Feature-based organization** - Group related functionality in `_features/` folders
- **Schema-first validation** - Define Zod schemas in `_schemas/` for all forms
- **Server-only utilities** - Use `.server.ts` suffix for server-side modules
- **Progressive enhancement** - Forms work without JavaScript enabled

### Form Handling

```typescript
// Server action pattern - simple FormData extraction
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));

  // Return error state with form values preserved
  return data({
    error: 'Validation failed',
    values: { email }
  }, { status: 400 });
}

// Client component - preserve state on error
export default function MyRoute({ actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <Input
        name="email"
        defaultValue={actionData?.values?.email}
        disabled={isSubmitting}
      />
    </Form>
  );
}
```

## API Integration

### Generated API Clients

- **Use generated clients** from OpenAPI specifications
- **Consistent error handling** with `ApiClientError` type
- **Server-side API calls** in loaders and actions only

```typescript
try {
  const response =
    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionOverview(
      { sessionId },
    );

  return data({ sessionOverview: response.data });
} catch (error: any) {
  console.error(JSON.stringify(error, null, 2));
  if (error as ApiClientError) {
    return { error: error.body.message };
  }
  throw error;
}
```

### Error Handling

- **Structured error logging** with `JSON.stringify(error, null, 2)`
- **User-friendly error messages** in Norwegian
- **Graceful fallbacks** and redirects on errors
- **Type-safe error boundaries**

## State Management

### React Router State

- **URL state** for shareable/bookmarkable state
- **Search params** for filter and selection state
- **Form state** managed by React Hook Form
- **Server state** via loaders and actions

### Local State Patterns

```typescript
// Simple state
const [selectedDate, setSelectedDate] = useState<string | null>(null);

// State synchronization with URL
const [searchParams, setSearchParams] = useSearchParams();
useEffect(() => {
  if (condition) {
    setSearchParams({ param: value }, { replace: true });
  }
}, [dependencies]);
```

## Routing Architecture

### Custom Route System

- **Declarative route tree** in `lib/route-tree.ts`
- **Access control** built into route definitions
- **Automatic route generation** via `routes-builder.ts`
- **Type-safe navigation** with `ROUTES_MAP`

### Route Organization

**Centralized route definitions in `lib/route-tree.ts`:**
```typescript
{
  id: 'auth.sign-in',
  href: 'sign-in',
  label: 'Logg inn',
  category: BrachCategory.AUTH,
  accessType: Access.NOT_AUTHENTICATED,
  placement: RoutePlaceMent.NAVIGATION
}
```

**Feature-based folder structure:**
```
app/routes/auth/sign-in/
├── _features/auth.sign-in.action.ts
├── _schemas/sign-in.form.schema.ts
├── _forms/sign-in.form.tsx
├── auth.sign-in.layout.tsx
└── auth.sign-in.route.tsx
```

### Navigation Patterns

- **Programmatic navigation** with `redirect()` in loaders/actions
- **Form-based navigation** with React Router `<Form>`
- **Link-based navigation** for simple transitions

## Internationalization

### Norwegian Localization

- **Norwegian text** as default throughout the application
- **Custom date/time formatting** for Norwegian conventions
- **Consistent terminology** across features

```typescript
const DAYS_NO = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const MONTHS_NO = ['januar', 'februar', 'mars' /* ... */];
```

## Styling Conventions

### TailwindCSS Usage

- **Utility-first approach** with semantic grouping
- **Consistent spacing scale** using Tailwind defaults
- **Responsive design patterns**:
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
  ```

### Component Styling

- **Border-based design system** with consistent border usage
- **Semantic color tokens**: `text-foreground`, `bg-background`, `border-border`
- **Typography scale**: `text-xs`, `text-sm`, `text-base`
- **Spacing consistency**: `space-y-3`, `space-y-5`, `gap-2`, `gap-3`

## Testing Practices

### Testing Strategy

- **Vitest** for unit testing
- **Type checking** as first line of defense
- **Integration testing** via React Router patterns
- **API mocking** for external service dependencies

### Test Organization

```bash
npm run test        # Run unit tests
npm run typecheck   # Type checking
npm run build       # Production build verification
```

## Development Workflow

### Local Development

```bash
npm run dev         # Start development server (kills port 5173 first)
npm run typecheck   # Verify types
npm run gen:api     # Regenerate API clients
```

### Code Generation

- **OpenAPI client generation** via `scripts/openapi/generate.ts`
- **Route type generation** via React Router
- **Automated type safety** from backend API specs

### Environment Management

- **Environment variables** via `.env` file
- **Type-safe environment** access patterns
- **Development vs production** configuration

## Security Practices

### Authentication & Authorization

- **JWT token management** with secure cookie handling
- **Role-based access control** (ADMIN, EMPLOYEE)
- **Route-level protection** via access control system
- **Session validation** in loaders

### Data Validation

- **Runtime validation** with Zod schemas
- **API response validation**
- **Form input sanitization**
- **Type safety** throughout the application

## Performance Considerations

### SSR Optimization

- **Server-side rendering** enabled by default
- **Progressive enhancement** patterns
- **Minimal hydration** footprint

### Code Splitting

- **Route-based code splitting** via React Router
- **Dynamic imports** for heavy features
- **Optimized bundle sizes**

### Caching Strategy

- **HTTP caching** for API responses
- **Static asset optimization**
- **Service worker** considerations for production
