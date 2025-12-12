# Route Organization Best Practices

## File Structure Pattern

All routes follow this consistent pattern:

```
app/routes/[category]/[feature]/
├── _features/           # Server-side logic
│   ├── *.action.ts     # Form submission handlers
│   ├── *.loader.ts     # Data loading logic
│   └── *.server.ts     # Server-only utilities
├── _forms/              # Form components
│   └── *.form.tsx      # Reusable form components
├── _schemas/            # Validation schemas
│   └── *.schema.ts     # Zod validation schemas
├── _utils/              # Route-specific utilities
│   └── *.utils.ts      # Helper functions
├── _types/              # Type definitions
│   └── *.types.ts      # TypeScript interfaces
├── [category].[feature].layout.tsx  # Layout component
└── [category].[feature].route.tsx   # Route component
```

## File Naming Convention

- **Route files**: `[category].[feature].route.tsx`
- **Layout files**: `[category].[feature].layout.tsx`
- **Action files**: `[category].[feature].action.ts`
- **Loader files**: `[category].[feature].loader.ts`
- **Schema files**: `[feature].schema.ts`
- **Form files**: `[feature].form.tsx`

## Route Implementation

### 1. Route Component Pattern

```typescript
// auth.sign-in.route.tsx
import type { Route } from './+types/auth.sign-in.route';

export async function action({ request }: Route.ActionArgs) {
  // Server-side form handling
}

export default function AuthSignIn({ actionData }: Route.ComponentProps) {
  // Component logic
}
```

### 2. Schema-First Validation

```typescript
// _schemas/sign-in.form.schema.ts
import { z } from 'zod';

export const signInFormSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export type SignInFormSchema = z.infer<typeof signInFormSchema>;
```

### 3. Feature-Based Organization

Group related functionality in `_features/`:

```typescript
// _features/auth.cookies.server.ts
export const accessTokenCookie = createCookie('access_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
});
```

### 4. Error Handling Pattern

```typescript
try {
  const response = await api.call();
  return redirect('/success');
} catch (error) {
  return data({
    error: 'User-friendly message',
    values: formValues // Preserve form state
  }, { status: 400 });
}
```

## Route Categories

- **`/auth`** - Authentication flows
- **`/user`** - User management
- **`/company`** - Company administration
- **`/booking`** - Booking system

## Layout Hierarchy

Routes inherit layouts from parent directories:

```
app/routes/
├── auth/
│   ├── auth.layout.tsx          # Base auth layout
│   └── sign-in/
│       ├── auth.sign-in.layout.tsx  # Specific layout
│       └── auth.sign-in.route.tsx   # Route component
```

## Form Patterns

### Progressive Enhancement

```typescript
// Always use React Router Form component
<Form method="post" className="space-y-6">
  <Input name="email" defaultValue={actionData?.values?.email} />
  <Button disabled={isSubmitting}>
    {isSubmitting ? 'Submitting…' : 'Submit'}
  </Button>
</Form>
```

### State Preservation

Always return form values on error:

```typescript
return data({
  error: 'Validation failed',
  values: { email } // Preserve user input
}, { status: 400 });
```

## Server-Side Utilities

### Cookie Management

```typescript
// _features/auth.cookies.server.ts
const accessCookie = await accessTokenCookie.serialize(token, {
  expires: new Date(expiresAt * 1000)
});
```

### API Integration

```typescript
// Use generated API clients
const response = await baseApi().AuthControllerService.signIn({
  requestBody: { email, password }
});
```

## Type Safety

- Use generated `+types` for route types
- Export typed schemas from `_schemas/`
- Leverage TypeScript path mapping (`@/`, `~/`)