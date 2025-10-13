import * as React from "react";
import { useFetcher, Link, useNavigate } from "react-router";

import type { Route } from "../+types/auth/sign-in";

import { SignInForm } from "@/components/forms/sign-in-form";
import {
  type SignInInput,
  signInSchema,
} from "@/features/auth/schemas/sign-in";
import {
  InvalidCredentialsError,
  SignInRequestError,
  signIn,
} from "@/features/auth/api/sign-in.server";
import { persistAuthTokens } from "@/features/auth/token/token-storage";
import { type AuthTokens } from "@/features/auth/token/types";

interface ActionData {
  fieldErrors?: Partial<Record<keyof SignInInput, string>>;
  formError?: string;
  values?: Partial<Pick<SignInInput, "email">>;
  success?: boolean;
  tokens?: AuthTokens;
  redirectTo?: string;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse({
    email: typeof submission.email === "string" ? submission.email : "",
    password:
      typeof submission.password === "string" ? submission.password : "",
  });

  if (!parsed.success) {
    return jsonResponse(
      {
        fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
        values: {
          email: typeof submission.email === "string" ? submission.email : "",
        },
      },
      { status: 400 },
    );
  }

  try {
    const tokens = await signIn(parsed.data);
    return jsonResponse(
      {
        success: true,
        tokens,
        redirectTo: "/",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return jsonResponse(
        {
          formError: error.message,
          values: { email: parsed.data.email },
        },
        { status: 400 },
      );
    }

    if (error instanceof SignInRequestError) {
      return jsonResponse(
        {
          formError: error.message,
          values: { email: parsed.data.email },
        },
        { status: 500 },
      );
    }

    throw error;
  }
}

export default function AuthSignIn() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const actionData = fetcher.data;
  const navigate = useNavigate();

  const handleSubmit = React.useCallback(
    (values: SignInInput) => {
      const payload = new FormData();
      payload.set("email", values.email);
      payload.set("password", values.password);

      fetcher.submit(payload, {
        method: "post",
        action: "/sign-in",
      });
    },
    [fetcher],
  );

  React.useEffect(() => {
    if (fetcher.state !== "idle") {
      return;
    }

    if (!actionData?.success || !actionData.tokens) {
      return;
    }

    persistAuthTokens(actionData.tokens);
    navigate(actionData.redirectTo ?? "/", { replace: true });
  }, [actionData, fetcher.state, navigate]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>
        <p className="text-muted-foreground text-sm">
          Access your account using your company credentials.
        </p>
      </header>

      <SignInForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        serverError={actionData?.formError}
        fieldErrors={actionData?.fieldErrors}
        initialValues={actionData?.values}
      />

      <p className="text-center text-sm text-muted-foreground">
        Forgot your password? Contact your administrator.
      </p>

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}

function flattenFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Partial<Record<keyof SignInInput, string>> {
  const result: Partial<Record<keyof SignInInput, string>> = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    result[key as keyof SignInInput] = messages[0];
  }

  return result;
}

function jsonResponse(data: ActionData, init: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
