import * as React from "react";
import { Link, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";

import type { Route } from "./+types/auth.accept-invite";

import { AcceptInviteForm } from "@/components/forms/accept-invite-form";
import {
  acceptInviteSchema,
  type AcceptInviteInput,
} from "@/features/auth/schemas/accept-invite";
import {
  AcceptInviteRequestError,
  InvalidInviteTokenError,
  acceptInvite,
} from "@/features/auth/api/accept-invite.server";
import { persistAuthTokens } from "@/features/auth/token/token-storage";
import { type AuthTokens } from "@/features/auth/token/types";

interface LoaderData {
  inviteToken: string;
}

interface ActionData {
  fieldErrors?: Partial<Record<keyof AcceptInviteInput, string>>;
  formError?: string;
  values?: Pick<AcceptInviteInput, "givenName" | "familyName">;
  inviteInvalid?: boolean;
  success?: boolean;
  tokens?: AuthTokens;
  redirectTo?: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get("token");

  if (!inviteToken) {
    return redirect("/");
  }

  return jsonResponse<LoaderData>({ inviteToken }, { status: 200 });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const inviteToken = formData.get("token");

  if (typeof inviteToken !== "string" || !inviteToken) {
    return jsonResponse<ActionData>(
      { formError: "This invite link is missing or invalid." },
      { status: 400 },
    );
  }

  const submission = {
    givenName: formData.get("givenName"),
    familyName: formData.get("familyName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = acceptInviteSchema.safeParse({
    givenName:
      typeof submission.givenName === "string" ? submission.givenName : "",
    familyName:
      typeof submission.familyName === "string" ? submission.familyName : "",
    password:
      typeof submission.password === "string" ? submission.password : "",
    confirmPassword:
      typeof submission.confirmPassword === "string"
        ? submission.confirmPassword
        : "",
  });

  if (!parsed.success) {
    return jsonResponse<ActionData>(
      {
        fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
        values: {
          givenName:
            typeof submission.givenName === "string" ? submission.givenName : "",
          familyName:
            typeof submission.familyName === "string"
              ? submission.familyName
              : "",
        },
      },
      { status: 400 },
    );
  }

  try {
    const tokens = await acceptInvite(inviteToken, parsed.data);
    return jsonResponse<ActionData>(
      {
        success: true,
        tokens,
        redirectTo: "/",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof InvalidInviteTokenError) {
      return jsonResponse<ActionData>(
        {
          formError: error.message,
          inviteInvalid: true,
          values: {
            givenName: parsed.data.givenName,
            familyName: parsed.data.familyName,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof AcceptInviteRequestError) {
      return jsonResponse<ActionData>(
        {
          formError: error.message,
          values: {
            givenName: parsed.data.givenName,
            familyName: parsed.data.familyName,
          },
        },
        { status: 500 },
      );
    }

    throw error;
  }
}

export default function AcceptInviteRoute() {
  const { inviteToken } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const actionData = fetcher.data;
  const inviteInvalid = Boolean(actionData?.inviteInvalid);
  const navigate = useNavigate();

  const handleSubmit = React.useCallback(
    (values: AcceptInviteInput) => {
      const payload = new FormData();
      payload.set("token", inviteToken);
      payload.set("givenName", values.givenName);
      payload.set("familyName", values.familyName);
      payload.set("password", values.password);
      payload.set("confirmPassword", values.confirmPassword);

      fetcher.submit(payload, {
        method: "post",
        action: "/auth/accept-invite",
      });
    },
    [fetcher, inviteToken],
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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Complete your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Set up your profile and password to activate your access.
        </p>
      </header>

      {inviteInvalid ? (
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Invite expired</h2>
          <p className="text-sm text-muted-foreground">
            {actionData?.formError ??
              "This invitation link is no longer valid. Please request a new invite from your administrator."}
          </p>
        </div>
      ) : (
        <AcceptInviteForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          serverError={actionData?.formError}
          fieldErrors={actionData?.fieldErrors}
          initialValues={actionData?.values}
        />
      )}

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
): Partial<Record<keyof AcceptInviteInput, string>> {
  const result: Partial<Record<keyof AcceptInviteInput, string>> = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    result[key as keyof AcceptInviteInput] = messages[0];
  }

  return result;
}

function jsonResponse<T>(data: T, init: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
