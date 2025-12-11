# React Router v7 Form Reference

## Basic Usage

```typescript
import { Form } from "react-router";

<Form method="post">
  <input type="text" name="title" />
  <button type="submit">Submit</button>
</Form>
```

**Key behaviors:**

- Submits via fetch (no page reload)
- Adds browser history entry
- Auto-revalidates loaders after success
- Progressive enhancement (works without JS)

---

## Props

```typescript
<Form
  method="post"              // get | post | put | patch | delete
  action="/route"            // defaults to current route
  encType="..."             // form encoding type
  replace={false}            // replace history instead of push
  reloadDocument={false}     // force full page reload
/>
```

**Method:**

- `get` → calls loader
- `post/put/patch/delete` → calls action

**Action examples:**

```typescript
<Form method="post">                    // current route
<Form method="post" action="/projects"> // specific route
<Form method="post" action="..">        // parent route
<Form method="post" action="?index">    // index route
```

**EncType:**

```typescript
// Default
encType = 'application/x-www-form-urlencoded';

// File uploads
encType = 'multipart/form-data';

// JSON
encType = 'application/json';
```

---

## Actions

### Basic Action

```typescript
import type { Route } from './+types/route';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = String(formData.get('title'));

  await db.projects.create({ title });
  return redirect('/projects');
}
```

### With Validation

```typescript
import { data, redirect } from 'react-router';
import type { Route } from './+types/route';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));

  const errors: Record<string, string> = {};

  if (!email.includes('@')) {
    errors.email = 'Invalid email';
  }

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 }); // 400 prevents revalidation
  }

  await createUser({ email });
  return redirect('/success');
}
```

### Multiple Actions on Same Route

```typescript
// Method 1: HTTP methods
export async function action({ request }: Route.ActionArgs) {
  switch (request.method) {
    case 'DELETE':
      await db.delete(id);
      return { deleted: true };
    case 'PATCH':
      await db.update(id);
      return { updated: true };
  }
}

// Method 2: Hidden intent field
<Form method="post">
  <input type="hidden" name="intent" value="delete" />
  <button type="submit">Delete</button>
</Form>

const intent = formData.get('intent');
if (intent === 'delete') { /* ... */ }
```

---

## Accessing Action Data

```typescript
import type { Route } from './+types/route';

export default function MyRoute({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <Form method="post">
        <input name="email" />
        {actionData?.errors?.email && (
          <span className="error">{actionData.errors.email}</span>
        )}
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
```

---

## Pending States

```typescript
import { Form, useNavigation } from 'react-router';
import type { Route } from './+types/route';

export default function MyRoute({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="title" disabled={isSubmitting} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </Form>
  );
}
```

**States:**

- `"idle"` - Nothing happening
- `"submitting"` - Form submitting (action running)
- `"loading"` - Loaders revalidating after action

**Optimistic UI:**

```typescript
const navigation = useNavigation();
const optimisticValue = navigation.formData?.get('title') || currentValue;
```

---

## Common Patterns

### Create

```typescript
import type { Route } from './+types/new-project';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const project = await db.projects.create({
    title: String(formData.get('title')),
  });
  return redirect(`/projects/${project.id}`);
}

export default function NewProject() {
  return (
    <Form method="post">
      <input type="text" name="title" required />
      <button type="submit">Create</button>
    </Form>
  );
}
```

### Update

```typescript
import type { Route } from './+types/edit-project';

export async function loader({ params }: Route.LoaderArgs) {
  return db.projects.findById(params.projectId);
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  await db.projects.update(params.projectId, {
    title: String(formData.get('title')),
  });
  return redirect(`/projects/${params.projectId}`);
}

export default function EditProject({ loaderData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <input name="title" defaultValue={loaderData.title} />
      <button type="submit">Update</button>
    </Form>
  );
}
```

### Delete

```typescript
<Form
  method="delete"
  onSubmit={(e) => {
    if (!confirm('Are you sure?')) e.preventDefault();
  }}
>
  <input type="hidden" name="id" value={project.id} />
  <button type="submit">Delete</button>
</Form>

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await db.projects.delete(formData.get('id'));
  return redirect('/projects');
}
```

### Search (GET)

```typescript
<Form method="get">
  <input type="search" name="q" />
  <button type="submit">Search</button>
</Form>

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const results = query ? await db.search(query) : [];
  return { results, query };
}
```

### File Upload

```typescript
<Form method="post" encType="multipart/form-data">
  <input type="file" name="avatar" accept="image/*" />
  <button type="submit">Upload</button>
</Form>

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get('avatar') as File;

  if (file?.size > 0) {
    const buffer = await file.arrayBuffer();
    const url = await uploadToStorage(buffer, file.name);
    return { avatarUrl: url };
  }

  return data({ error: 'No file' }, { status: 400 });
}
```

---

## Form vs Fetcher

**Use `<Form>` when:**

- Creating/deleting records
- User navigates to new page
- Want browser back button to work

**Use `<fetcher.Form>` when:**

- In-place updates without navigation
- Multiple forms on same page
- Toggling favorites/likes

---

## Common Gotchas

**1. FormData values are strings**

```typescript
// ❌ Bad
const age = formData.get('age'); // string "25"
if (age > 18) {
} // string comparison

// ✅ Good
const age = Number(formData.get('age'));
if (age > 18) {
} // numeric comparison
```

**2. Multiple values with same name**

```typescript
<input type="checkbox" name="tags" value="react" />
<input type="checkbox" name="tags" value="typescript" />

// Get all values
const tags = formData.getAll("tags"); // ["react", "typescript"]
```

**3. File validation**

```typescript
const file = formData.get('avatar') as File;
if (file.size === 0) {
  // No file selected
}
```

---

## Quick Reference

```typescript
import type { Route } from './+types/route';
import { Form, useNavigation } from 'react-router';

// Basic form
<Form method="post" action="/route">
  <input name="field" />
  <button type="submit">Submit</button>
</Form>

// Action with validation
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

// Display errors
export default function Component({ actionData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <input name="email" />
      {actionData?.errors?.email && <span>{actionData.errors.email}</span>}
      <button type="submit">Submit</button>
    </Form>
  );
}

// Pending state
const navigation = useNavigation();
const isSubmitting = navigation.state === 'submitting';
```
