# React Router v7 Loader & Action Best Practices

## Using Route Types

```typescript
import type { Route } from './+types/my-route';

// Use generated types from Route namespace
export async function loader({ request }: Route.LoaderArgs) {
  // ...
}

export async function action({ request }: Route.ActionArgs) {
  // ...
}

export default function Component({ loaderData, actionData }: Route.ComponentProps) {
  // loaderData and actionData are automatically typed
}
```

## Loaders

### Basic Loader

```typescript
import { data } from 'react-router';
import type { Route } from './+types/home';

export async function loader({ request }: Route.LoaderArgs) {
  const projects = await db.projects.getAll();

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

### With Headers (Cookies, Auth)

```typescript
import type { Route } from './+types/auth';

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const token = await tokenCookie.parse(cookieHeader);

  if (!token) {
    return data({ user: null });
  }

  const user = await verifyToken(token);
  return data({ user });
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

### With Validation Errors

```typescript
import type { Route } from './+types/signup';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const errors: Record<string, string> = {};

  if (!email.includes('@')) {
    errors.email = 'Invalid email';
  }

  if (password.length < 8) {
    errors.password = 'Password too short';
  }

  if (Object.keys(errors).length > 0) {
    return data(
      {
        errors,
        values: { email },
      },
      { status: 400 },
    );
  }

  await createUser({ email, password });
  return redirect('/dashboard');
}
```

### With Headers (Set Cookies)

```typescript
import type { Route } from './+types/login';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const { token, user } = await login(formData);

  const cookie = await authCookie.serialize(token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return redirect('/dashboard', {
    headers: {
      'Set-Cookie': cookie,
    },
  });
}
```

### Multiple Cookies

```typescript
import type { Route } from './+types/auth';

export async function action({ request }: Route.ActionArgs) {
  const { accessToken, refreshToken } = await authenticate();

  const accessCookie = await accessTokenCookie.serialize(accessToken);
  const refreshCookie = await refreshTokenCookie.serialize(refreshToken);

  return redirect('/', {
    headers: [
      ['Set-Cookie', accessCookie],
      ['Set-Cookie', refreshCookie],
    ],
  });
}
```

### Error Handling Pattern

```typescript
import type { Route } from './+types/update';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    await db.update(params.id, formData);
    return data({ success: true });
  } catch (err) {
    console.error('[action] Update failed:', err);

    return data({ error: 'Failed to update' }, { status: 400 });
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

## Key Rules

1. **Use Route types** - Import from `'./+types/route-name'`
2. **Always use `data()` helper** - Explicit and consistent
3. **Status 400 for validation errors** - Prevents revalidation
4. **Throw redirect in loaders** - Use `throw redirect()`
5. **Return redirect in actions** - Use `return redirect()`
6. **Use Route.ComponentProps** - Automatic type inference for loaderData/actionData
7. **Error handling** - Try/catch in loaders/actions, return safe defaults
8. **Headers for cookies** - Use `headers` option in redirect/data
9. **FormData keys as strings** - Always cast: `String(formData.get('key'))`
10. **Check token expiry with buffer** - 5 min buffer before actual expiry

---

## Quick Reference

```typescript
// Import Route types
import type { Route } from './+types/my-route';
import { data, redirect } from 'react-router';

// Loader
export async function loader({ request, params }: Route.LoaderArgs) {
  const items = await db.getAll();
  return data({ items });
}

// Action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Validate
  const errors = validate(formData);
  if (errors) {
    return data({ errors }, { status: 400 });
  }

  // Process
  await db.create(formData);
  return redirect('/success');
}

// Component
export default function Component({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div>
      {actionData?.errors && <ErrorDisplay errors={actionData.errors} />}
      {loaderData.items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
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

### ✅ DO

```typescript
// 1. Type your action return
type ActionData = {
  error?: string;
  tokenInvalid?: boolean;
  errors?: Record<string, string>;
};

export async function action(): Promise<ActionData | Response> {
  // ...
}

// 2. Return data with status 400 for expected errors
return data({ error: 'Invalid token', tokenInvalid: true }, { status: 400 });

// 3. Throw unexpected errors
try {
  // ...
} catch (error) {
  console.error('[action] Unexpected:', error);
  throw error; // ErrorBoundary handles it
}

// 4. Use discriminated unions for complex states
type ActionData = { type: 'success'; data: T } | { type: 'error'; message: string; code: string };

// 5. Check for specific API error codes
if (response.error?.code === 'TOKEN_EXPIRED') {
  return data({ tokenInvalid: true }, { status: 400 });
}
```

### ❌ DON'T

```typescript
// 1. Don't throw expected errors
if (tokenExpired) {
  throw new Error('Token expired'); // ❌ Use return instead
}

// 2. Don't return errors without status
return { error: 'Failed' }; // ❌ Missing status code

// 3. Don't mix return patterns
return { error: 'A' };
return { success: false, message: 'B' }; // ❌ Inconsistent

// 4. Don't check properties that don't exist
if (actionData?.tokenInvalid) {
  /* ... */
}
// But action only returns { error: string } ❌

// 5. Don't use generic error messages
return { error: 'An error occurred' }; // ❌ Not helpful
```

---

## Your Specific Case: Reset Password

```typescript
import { data, redirect } from 'react-router';
import type { Route } from './+types/_index';

type ActionData = {
  error?: string;
  tokenInvalid?: boolean;
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    const response = await AuthControllerService.resetPassword({
      requestBody: {
        resetPasswordToken: String(formData.get('resetPasswordToken')),
        password: String(formData.get('password')),
        password2: String(formData.get('confirmPassword')),
      },
    });

    if (!response.success || !response.data) {
      // Check if it's a token error
      const errorMessage = response.error?.message || 'Failed to reset password';
      const isTokenError =
        errorMessage.includes('token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid');

      return data(
        {
          error: errorMessage,
          tokenInvalid: isTokenError,
        },
        { status: 400 }
      );
    }

    const tokens = toAuthTokens(response.data);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirect('/', {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });

  } catch (error: any) {
    // API client errors
    if (error.body?.message) {
      const errorMessage = error.body.message;
      const isTokenError =
        errorMessage.includes('token') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid');

      return data(
        {
          error: errorMessage,
          tokenInvalid: isTokenError,
        },
        { status: 400 }
      );
    }

    // Truly unexpected errors
    console.error('[reset-password] Unexpected error:', error);
    throw error;
  }
}

export default function Component({ loaderData, actionData }: Route.ComponentProps) {
  if (actionData?.tokenInvalid) {
    return (
      <div>
        <h2>Invalid or Expired Link</h2>
        <p>{actionData.error}</p>
        <Link to="/forgot-password">Request new link</Link>
      </div>
    );
  }

  if (actionData?.error) {
    return (
      <div>
        <p className="error">{actionData.error}</p>
        <ResetPasswordForm />
      </div>
    );
  }

  return <ResetPasswordForm />;
}
```

---

## Key Takeaways

1. **Type your action returns** - Define all possible response shapes
2. **Status 400 for expected errors** - Prevents page revalidation
3. **Throw for unexpected errors** - Let ErrorBoundary handle system failures
4. **Be specific with error states** - Use flags like `tokenInvalid`, `validationError`, etc.
5. **Check API error codes** - Don't rely on just error messages
6. **Return consistent structures** - Makes component logic simpler
7. **Document your error types** - Future you will thank you
