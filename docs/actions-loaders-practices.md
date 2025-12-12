# Actions & Loaders Best Practices

## File Structure Pattern (From /auth routes)

**Separate action from route component:**

```
app/routes/auth/sign-in/
├── _features/auth.sign-in.action.ts  # Action logic
├── _schemas/sign-in.form.schema.ts   # Validation
└── auth.sign-in.route.tsx            # Route component
```

## Type-Safe Actions

```typescript
// _features/auth.sign-in.action.ts
import type { ActionFunctionArgs } from 'react-router';
import { baseApi } from '~/lib/utils';

export async function AuthSignInAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  try {
    const response = await baseApi().AuthControllerService.signIn({
      requestBody: { email, password },
    });

    // Backend throws on error - response is always success
    const tokens = toAuthTokens(response.data);
    const cookieHeaders = await createAuthCookies(tokens);
    return redirect('/', { headers: cookieHeaders });
  } catch (error: any) {
    return data(
      {
        error: error.body?.message || 'Noe gikk galt',
        values: { email },
      },
      { status: 400 },
    );
  }
}
```

## Loaders

### Basic Loader

```typescript
import { data } from 'react-router';
import type { Route } from './+types/home';

export async function loader({ request }: Route.LoaderArgs) {
  // API call

  return data({ projects });
}
```

### With URL Params

```typescript
import type { Route } from './+types/project';

export async function loader({ params }: Route.LoaderArgs) {
  const project = await db.projects.findById(params.projectId);

  if (!project) {
    throw new Response('Not Found', { status: 404 });
  }

  return data({ project });
}
```

### With Search Params

```typescript
import type { Route } from './+types/search';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  const results = query ? await db.search(query) : [];

  return data({ results, query });
}
```

### Root Loader Pattern

```typescript
export async function rootLoader({ request }: LoaderFunctionArgs) {
  const accessToken = await accessTokenCookie.parse(request.headers.get('Cookie'));
  const refreshToken = await refreshTokenCookie.parse(request.headers.get('Cookie'));

  if (!refreshToken) return defaultResponse();
  if (!accessToken || isTokenExpired(accessToken)) {
    return refreshAndBuildResponse(request, refreshToken);
  }

  return data(await buildResponseData(request, accessToken));
}
```

### With Conditional Redirect

```typescript
import type { Route } from './+types/dashboard';

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);

  if (!user) {
    throw redirect('/login');
  }

  if (!user.hasCompletedProfile) {
    throw redirect('/profile/complete');
  }

  return data({ user });
}
```

### Error Handling Pattern

```typescript
import type { Route } from './+types/items';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const items = await fetchData();
    return data({ items });
  } catch (err) {
    console.error('[loader] Failed:', err);

    // Return empty state instead of throwing
    return data({ items: [] });
  }
}
```

### With Status Codes

```typescript
import type { Route } from './+types/item';

export async function loader({ params }: Route.LoaderArgs) {
  const item = await db.find(params.id);

  if (!item) {
    return data({ error: 'Not found' }, { status: 404 });
  }

  return data({ item }, { status: 200 });
}
```

---

## Actions

### Basic Action

```typescript
import { data, redirect } from 'react-router';
import type { Route } from './+types/create-project';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = String(formData.get('title'));

  try {
    const project = await db.projects.create({ title });
    return redirect(`/projects/${project.id}`);
  } catch (err) {
    return data({ error: 'Failed to create project' }, { status: 400 });
  }
}
```

### Form Schemas

```typescript
// _schemas/sign-in.form.schema.ts
export const signInFormSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

// In action
const email = String(formData.get('email'));
const password = String(formData.get('password'));
```

### Cookie Management

```typescript
// _features/auth.cookies.server.ts
export const accessTokenCookie = createCookie('access_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});

// Set multiple cookies
const accessCookie = await accessTokenCookie.serialize(token, {
  expires: new Date(expiresAt * 1000),
});

return redirect('/', {
  headers: [
    ['Set-Cookie', accessCookie],
    ['Set-Cookie', refreshCookie],
  ],
});
```

### Error Handling

```typescript
export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = await api.call();
    return redirect('/success');
  } catch (error: any) {
    return data({ error: error.body?.message }, { status: 400 });
  }
}
```

### Return Data vs Redirect

```typescript
// Return data - stay on same page
export async function action({ request }: Route.ActionArgs) {
  await updateSettings(formData);
  return data({ success: true }); // Page revalidates, stays here
}

// Redirect - navigate away
export async function action({ request }: Route.ActionArgs) {
  const project = await createProject(formData);
  return redirect(`/projects/${project.id}`); // Navigate to new page
}
```

---

## Using in Components

### With Route Types

```typescript
import type { Route } from './+types/home';

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  // loaderData and actionData are automatically typed
  return (
    <div>
      {actionData?.error && <p>{actionData.error}</p>}
      {loaderData.projects.map(p => <div key={p.id}>{p.title}</div>)}
    </div>
  );
}
```

### Accessing in Child Components

```typescript
import { useLoaderData, useActionData } from 'react-router';
import type { loader, action } from './route';

function ChildComponent() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return <div>{/* ... */}</div>;
}
```

---

## Common Patterns

### Token Expiry Check

```typescript
const isTokenExpired = (token: string): boolean => {
  try {
    const jwt = parseJwt(token);
    if (!jwt.exp) return true;

    const expiresAt = jwt.exp * 1000;
    const bufferMs = 5 * 60 * 1000; // 5 min buffer
    return expiresAt <= Date.now() + bufferMs;
  } catch {
    return true;
  }
};
```

### Refresh Token Pattern

```typescript
import type { Route } from './+types/root';

export async function loader({ request }: Route.LoaderArgs) {
  const accessToken = await getAccessToken(request);
  const refreshToken = await getRefreshToken(request);

  if (!refreshToken) {
    return clearAuthAndRedirect();
  }

  if (!accessToken || isTokenExpired(accessToken)) {
    return refreshAndContinue(request, refreshToken);
  }

  return data({ user: await getUser(accessToken) });
}
```

### Clear Cookies

```typescript
async function clearAuthCookies(): Promise<Headers> {
  const accessCookie = await accessTokenCookie.serialize('', {
    expires: new Date(0),
  });
  const refreshCookie = await refreshTokenCookie.serialize('', {
    expires: new Date(0),
  });

  const headers = new Headers();
  headers.append('Set-Cookie', accessCookie);
  headers.append('Set-Cookie', refreshCookie);

  return headers;
}
```

### Conditional Navigation in Loader

```typescript
import type { Route } from './+types/dashboard';

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const url = new URL(request.url);

  if (!user.company && user.role === 'COMPANY_USER') {
    // Allow access to company selection page
    if (url.pathname === '/select-company') {
      return data({ user, companies: await getCompanies() });
    }

    // Redirect to company selection
    throw redirect('/select-company');
  }

  return data({ user });
}
```

---

## Key Patterns

1. **Separate actions** - `_features/` folder
2. **Preserve form state** - `{ error, values }` on error
3. **Secure cookies** - `httpOnly: true, sameSite: 'lax'`
4. **Backend throws errors** - Just catch and show `error.body.message`
5. **Status 400** - For validation/business logic errors
6. **Multiple cookies** - Use headers array
7. **Token expiry buffer** - 5min before actual expiry

---

## Quick Reference

```typescript
// _features/auth.sign-in.action.ts
export async function AuthSignInAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  try {
    const response = await baseApi().AuthControllerService.signIn({
      requestBody: { email, password }
    });

    const tokens = toAuthTokens(response.data);
    const cookieHeaders = await createAuthCookies(tokens);
    return redirect('/', { headers: cookieHeaders });
  } catch (error: any) {
    return data({ error: error.body?.message, values: { email } }, { status: 400 });
  }
}

// auth.sign-in.route.tsx
export default function AuthSignIn({ actionData }: Route.ComponentProps) {
  const isSubmitting = useNavigation().state === 'submitting';

  return (
    <Form method="post">
      {actionData?.error && <div role="alert">{actionData.error}</div>}
      <Input name="email" defaultValue={actionData?.values?.email} disabled={isSubmitting} />
      <Button disabled={isSubmitting}>{isSubmitting ? 'Logger inn…' : 'Logg inn'}</Button>
    </Form>
  );
}
```

# React Router v7 Action Error Handling Best Practices

## Key Principles

1. **Return errors for expected failures** (validation, business logic) - Status 400
2. **Throw errors for unexpected failures** (network, system errors) - Triggers ErrorBoundary
3. **Type your error responses** - Define what your action can return
4. **Use consistent error structures** - Makes handling easier

---

## Pattern 1: Multiple Error States

```typescript
import { data } from 'react-router';
import type { Route } from './+types/route';

// Define possible action responses
type ActionData =
  | { success: true; userId: string }
  | { success: false; error: string; tokenInvalid?: boolean; errors?: Record<string, string> };

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();

  try {
    const response = await api.resetPassword({
      token: String(formData.get('token')),
      password: String(formData.get('password')),
    });

    if (!response.success) {
      // Check for specific error types
      if (response.error?.code === 'TOKEN_EXPIRED') {
        return data(
          {
            success: false,
            error: 'Token has expired',
            tokenInvalid: true
          },
          { status: 400 }
        );
      }

      return data(
        {
          success: false,
          error: response.error?.message || 'Unknown error'
        },
        { status: 400 }
      );
    }

    return { success: true, userId: response.data.id };

  } catch (error: any) {
    // Unexpected errors - these will be rare
    console.error('[action] Unexpected error:', error);
    throw error; // Triggers ErrorBoundary
  }
}

// Component
export default function Component({ actionData }: Route.ComponentProps) {
  if (actionData?.tokenInvalid) {
    return <div>Token is invalid. Request a new one.</div>;
  }

  if (actionData?.error) {
    return <div>Error: {actionData.error}</div>;
  }

  return <div>Form here</div>;
}
```

---

## Pattern 2: Discriminated Unions

```typescript
type ActionData =
  | { type: 'success'; data: User }
  | { type: 'validation-error'; errors: Record<string, string> }
  | { type: 'auth-error'; message: string }
  | { type: 'token-expired'; message: string };

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();

  // Validation
  const errors = validateForm(formData);
  if (errors) {
    return data(
      { type: 'validation-error', errors },
      { status: 400 }
    );
  }

  try {
    const response = await api.call(formData);

    if (response.error?.code === 'TOKEN_EXPIRED') {
      return data(
        { type: 'token-expired', message: 'Your session has expired' },
        { status: 401 }
      );
    }

    if (!response.success) {
      return data(
        { type: 'auth-error', message: 'Authentication failed' },
        { status: 403 }
      );
    }

    return { type: 'success', data: response.data };

  } catch (error) {
    throw error; // Unexpected - triggers ErrorBoundary
  }
}

// Component with type narrowing
export default function Component({ actionData }: Route.ComponentProps) {
  if (!actionData) return <Form />;

  switch (actionData.type) {
    case 'validation-error':
      return <Form errors={actionData.errors} />;

    case 'token-expired':
      return (
        <div>
          <p>{actionData.message}</p>
          <Link to="/request-new-token">Get new token</Link>
        </div>
      );

    case 'auth-error':
      return <div>{actionData.message}</div>;

    case 'success':
      return <div>Welcome {actionData.data.name}!</div>;
  }
}
```

---

## Pattern 3: Error Codes with API Responses

```typescript
import type { ApiError } from '~/api/types';

type ActionData = {
  success?: boolean;
  error?: string;
  errorCode?: string;
  errors?: Record<string, string>;
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    const response = await authApi.resetPassword({
      token: String(formData.get('token')),
      password: String(formData.get('password')),
    });

    if (!response.success) {
      return data(
        {
          success: false,
          error: response.error?.message || 'Failed to reset password',
          errorCode: response.error?.code, // e.g., 'TOKEN_EXPIRED', 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    return redirect('/login');

  } catch (error: any) {
    // API client errors (network, 500s, etc)
    if (error as ApiError) {
      return data(
        {
          success: false,
          error: error.body?.message || 'An error occurred',
          errorCode: error.body?.code,
        },
        { status: 400 }
      );
    }

    // Truly unexpected errors
    throw error;
  }
}

// Component
export default function Component({ actionData }: Route.ComponentProps) {
  if (!actionData) return <FormContent />;

  // Handle specific error codes
  if (actionData.errorCode === 'TOKEN_EXPIRED' || actionData.errorCode === 'INVALID_TOKEN') {
    return (
      <div>
        <h2>Link Expired</h2>
        <p>{actionData.error}</p>
        <Link to="/forgot-password">Request new reset link</Link>
      </div>
    );
  }

  if (actionData.error) {
    return (
      <div>
        <p className="error">{actionData.error}</p>
        <FormContent />
      </div>
    );
  }

  return <FormContent />;
}
```

---

## Pattern 4: HTTP Status Code Approach

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    const response = await api.resetPassword(formData);

    if (!response.success) {
      const status = response.statusCode || 400;

      return data(
        {
          error: response.error?.message,
          details: response.error?.details
        },
        { status }
      );
    }

    return redirect('/success');

  } catch (error) {
    throw error;
  }
}

// Component - check status in actionData
export default function Component({ actionData }: Route.ComponentProps) {
  // Note: actionData doesn't expose status directly
  // So use error codes or specific properties instead
  return <div>{/* ... */}</div>;
}
```

---

## Best Practices Summary

## Key Takeaways

1. **Type your action returns** - Define all possible response shapes
2. **Status 400 for expected errors** - Prevents page revalidation
3. **Throw for unexpected errors** - Let ErrorBoundary handle system failures
4. **Be specific with error states** - Use flags like `tokenInvalid`, `validationError`, etc.
5. **Check API error codes** - Don't rely on just error messages
6. **Return consistent structures** - Makes component logic simpler
7. **Document your error types** - Future you will thank you
