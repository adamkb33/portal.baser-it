import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from '~/ui';
import { VerificationCodeInput } from '~/ui';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = process.cwd();

function readSessionRoute(relativePath: string) {
  return readFileSync(join(currentDir, relativePath), 'utf8');
}

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), 'utf8');
}

describe('booking pending submission UI', () => {
  it('shared Button disables native submit controls when loading is true', () => {
    const markup = renderToStaticMarkup(
      React.createElement(Button, { type: 'submit', loading: true }, 'Submit booking'),
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('Submit booking');
  });

  it('verification code input disables its hidden input and visual boxes', () => {
    const markup = renderToStaticMarkup(
      React.createElement(VerificationCodeInput, {
        name: 'code',
        value: '123456',
        onChange: () => undefined,
        disabled: true,
      }),
    );

    expect(markup).toContain('name="code"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('cursor-not-allowed');
  });

  it('bottom action bar blocks links and buttons while disabled or loading', () => {
    const source = readWorkspaceFile('app/routes/booking/public/_components/bottom-nav/booking-bottom-action-bar.tsx');

    expect(source).toContain('loading={action.loading}');
    expect(source).toContain('disabled={action.disabled}');
    expect(source).toContain('if (action.disabled || action.loading)');
    expect(source).toContain('event.preventDefault()');
    expect(source).toContain(
      "(action.disabled || action.loading) && 'pointer-events-none cursor-not-allowed opacity-50'",
    );
  });

  it('disables contact landing submissions while React Router navigation is submitting', () => {
    const source = readSessionRoute('contact/booking.public.appointment.session.contact.route.tsx');
    const continueCardSource = readSessionRoute('contact/_components/continue-card.tsx');

    expect(source).toContain('useNavigation');
    expect(source).toContain("routeNavigation.state === 'submitting'");
    expect(source).toContain('loading={submittingIntent === ACTION_INTENT.CONTINUE_WITH_AUTHENTICATED_USER}');
    expect(source).toContain('disabled={isSubmitting}');
    expect(source).toContain('ProviderButtons disabled={isSubmitting}');
    expect(source).toContain('isSubmitting={submittingIntent === ACTION_INTENT.CONTINUE_WITH_SESSION_USER}');
    expect(source).toContain('disabled={isSubmitting}');
    expect(continueCardSource).toContain('disabled={isSubmitting}');
    expect(continueCardSource).toContain('aria-busy={isSubmitting}');
    expect(continueCardSource).toContain("isSubmitting ? 'Fortsetter...' : cta");
  });

  it('provider auth cannot submit while the provider button group is disabled', () => {
    const providerButtonsSource = readWorkspaceFile('app/routes/auth/_components/provider-buttons.tsx');
    const contactSource = readSessionRoute('contact/booking.public.appointment.session.contact.route.tsx');
    const signInSource = readSessionRoute(
      'contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx',
    );

    expect(providerButtonsSource).toContain('if (disabled) return;');
    expect(providerButtonsSource).toContain('disabled={disabled}');
    expect(contactSource).toContain('ProviderButtons disabled={isSubmitting}');
    expect(signInSource).toContain('ProviderButtons showDivider={!isGoogleProvider} disabled={isSubmitting}');
  });

  it('shows loading-disabled submit buttons across contact substeps', () => {
    const signInSource = readSessionRoute(
      'contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx',
    );
    const signUpSource = readSessionRoute(
      'contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx',
    );
    const collectMobileSource = readSessionRoute(
      'contact/collect-mobile/booking.public.appointment.session.contact.collect-mobile.route.tsx',
    );
    const collectEmailSource = readSessionRoute(
      'contact/collect-email/booking.public.appointment.session.contact.collect-email.route.tsx',
    );
    const submitContactFormSource = readSessionRoute('contact/_forms/submit-contact.form.tsx');
    const clearSessionSource = readSessionRoute('contact/_components/clear-session-action.tsx');

    expect(signInSource).toContain('ProviderButtons showDivider={!isGoogleProvider} disabled={isSubmitting}');
    expect(signInSource).toContain('loading={isSubmitting}');
    expect(signUpSource).toContain('loading={isSubmitting}');
    expect(signUpSource).toContain("isSubmitting ? 'Oppretter konto...' : 'Opprett konto'");
    expect(collectMobileSource).toContain('loading={isSubmitting}');
    expect(collectMobileSource).toContain("isSubmitting ? 'Lagrer...' : 'Fortsett'");
    expect(collectEmailSource).toContain('loading={isSubmitting}');
    expect(collectEmailSource).toContain("isSubmitting ? 'Lagrer...' : 'Lagre og fortsett'");
    expect(submitContactFormSource).toContain('disabled={isSubmitting || inputOptions.disabled}');
    expect(submitContactFormSource).toContain('loading={isSubmitting}');
    expect(clearSessionSource).toContain("const isSubmitting = fetcher.state !== 'idle'");
    expect(clearSessionSource).toContain('disabled={isSubmitting}');
    expect(clearSessionSource).toContain('loading={isSubmitting}');
  });

  it('disables fetcher-based verification submissions while requests are pending', () => {
    const verifyMobileSource = readSessionRoute(
      'contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx',
    );
    const verifyEmailSource = readSessionRoute(
      'contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx',
    );

    expect(verifyMobileSource).toContain("const isVerifyingCode = fetcher.state !== 'idle'");
    expect(verifyMobileSource).toContain('disabled={isVerifyingCode}');
    expect(verifyMobileSource).toContain('loading={isVerifyingCode}');
    expect(verifyMobileSource).toContain("isVerifyingCode ? 'Bekrefter...' : 'Bekreft kode'");
    expect(verifyMobileSource).toContain("const isSendingCode = resendFetcher.state !== 'idle'");
    expect(verifyMobileSource).toContain('loading={isSendingCode}');
    expect(verifyMobileSource).toContain('aria-busy={isSendingCode}');
    expect(verifyMobileSource).toContain('disabled={!verificationSessionToken || isSendingCode}');
    expect(verifyEmailSource).toContain("loading={resendFetcher.state !== 'idle'}");
    expect(verifyEmailSource).toContain('disabled={!email}');
  });

  it('disables later booking step navigation while route submissions are pending', () => {
    const employeeSource = readSessionRoute('employee/booking.public.appointment.session.employee.route.tsx');
    const selectServicesSource = readSessionRoute(
      'select-services/booking.public.appointment.session.select-services.route.tsx',
    );
    const selectTimeSource = readSessionRoute('select-time/booking.public.appointment.session.select-time.route.tsx');
    const overviewSource = readSessionRoute('overview/booking.public.appointment.session.overview.route.tsx');

    expect(employeeSource).toContain('loading={isSubmittingProfile}');
    expect(employeeSource).toContain('disabled={isSubmitting}');
    expect(employeeSource).toContain('disabled: !selectedProfileId || isSubmitting');
    expect(selectServicesSource).toContain('loading: isSubmitting');
    expect(selectServicesSource).toContain('disabled: !hasSelections || isSubmitting');
    expect(selectServicesSource).toContain('disabled: isSubmitting');
    expect(selectTimeSource).toContain('loading: isSubmitting');
    expect(selectTimeSource).toContain('disabled: !displayTime || isSubmitting');
    expect(selectTimeSource).toContain('disabled: isSubmitting');
    expect(overviewSource).toContain('loading: isSubmitting');
    expect(overviewSource).toContain('disabled: isSubmitting');
  });

  it('guards useSubmit-based time selection against rapid double submit', () => {
    const selectTimeSource = readSessionRoute('select-time/booking.public.appointment.session.select-time.route.tsx');

    expect(selectTimeSource).toContain('const submitInFlightRef = useRef(false)');
    expect(selectTimeSource).toContain('if (isSubmitting || submitInFlightRef.current)');
    expect(selectTimeSource).toContain('submitInFlightRef.current = true');
    expect(selectTimeSource).toContain("if (navigation.state === 'idle')");
  });
});
