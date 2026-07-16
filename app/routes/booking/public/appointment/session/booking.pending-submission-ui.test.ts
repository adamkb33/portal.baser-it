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

    expect(source).toContain('useNavigation');
    expect(source).toContain("navigation.state === 'submitting'");
    expect(source).toContain('loading={isSubmitting}');
    expect(source).toContain('disabled={isSubmitting}');
    expect(source).toContain("isSubmitting ? 'Sender SMS...' : 'Fortsett'");
    expect(source).not.toContain('ProviderButtons');
  });

  it('obsolete booking auth subroutes redirect back to the contact resolver', () => {
    const signInSource = readSessionRoute(
      'contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx',
    );
    const signUpSource = readSessionRoute(
      'contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx',
    );
    const verifyEmailSource = readSessionRoute(
      'contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx',
    );

    expect(signInSource).toContain('return redirect(getBookingRouteMap().contact)');
    expect(signUpSource).toContain('return redirect(getBookingRouteMap().contact)');
    expect(verifyEmailSource).toContain('return redirect(getBookingRouteMap().contact)');
  });

  it('keeps removed collect routes as contact redirects', () => {
    const collectMobileSource = readSessionRoute(
      'contact/collect-mobile/booking.public.appointment.session.contact.collect-mobile.route.tsx',
    );
    const collectEmailSource = readSessionRoute(
      'contact/collect-email/booking.public.appointment.session.contact.collect-email.route.tsx',
    );
    const submitContactFormSource = readSessionRoute('contact/_forms/submit-contact.form.tsx');

    expect(collectMobileSource).toContain('return redirect(getBookingRouteMap().contact)');
    expect(collectEmailSource).toContain('return redirect(getBookingRouteMap().contact)');
    expect(submitContactFormSource).toContain('disabled={isSubmitting || inputOptions.disabled}');
    expect(submitContactFormSource).toContain('loading={isSubmitting}');
  });

  it('disables SMS verification submissions while requests are pending', () => {
    const verifyMobileSource = readSessionRoute(
      'contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx',
    );

    expect(verifyMobileSource).toContain("const isSubmitting = navigation.state === 'submitting'");
    expect(verifyMobileSource).toContain("const isSendingCode = isSubmitting && submittingIntent === 'resend'");
    expect(verifyMobileSource).toContain('disabled={code.length !== CODE_LENGTH || isSubmitting}');
    expect(verifyMobileSource).toContain('loading={isVerifyingCode}');
    expect(verifyMobileSource).toContain("isVerifyingCode ? 'Bekrefter...' : 'Bekreft kode'");
    expect(verifyMobileSource).toContain('loading={isSendingCode}');
    expect(verifyMobileSource).toContain('disabled={isSubmitting}');
  });

  it('disables later booking step navigation while route submissions are pending', () => {
    const employeeSource = readSessionRoute('employee/booking.public.appointment.session.employee.route.tsx');
    const profileCardSource = readSessionRoute('employee/_components/profile-card.tsx');
    const selectServicesSource = readSessionRoute(
      'select-services/booking.public.appointment.session.select-services.route.tsx',
    );
    const selectTimeSource = readSessionRoute('select-time/booking.public.appointment.session.select-time.route.tsx');
    const bookingLinkSource = readWorkspaceFile('app/routes/booking/public/_components/booking-link.tsx');
    const bookingActionStylesSource = readWorkspaceFile(
      'app/routes/booking/public/_components/booking-action-styles.ts',
    );
    const overviewSource = readSessionRoute('overview/booking.public.appointment.session.overview.route.tsx');

    expect(profileCardSource).toContain('loading={isSubmittingProfile}');
    expect(profileCardSource).toContain('disabled={isSubmitting}');
    expect(employeeSource).toContain(
      '<BookingLink to={routes.selectServices} variant="primary" disabled={isSubmitting}>',
    );
    expect(employeeSource).toContain('<BookingActionButton type="button" variant="primary" disabled>');
    expect(selectServicesSource).toContain('loading={isSubmitting}');
    expect(selectServicesSource).toContain('disabled={!hasSelections || isSubmitting}');
    expect(selectServicesSource).toContain(
      '<BookingLink to={routes.employee} variant="secondary" disabled={isSubmitting}>',
    );
    expect(selectTimeSource).toContain('disabled={isSubmitting}');
    expect(selectTimeSource).toContain(
      '<BookingLink to={routes.contact} variant="primary" disabled={isSubmitting} reloadDocument>',
    );
    expect(bookingLinkSource).toContain('aria-disabled={disabled}');
    expect(bookingLinkSource).toContain("disabled && 'pointer-events-none cursor-not-allowed opacity-50'");
    expect(bookingActionStylesSource).toContain('export const bookingActionBaseClass');
    expect(overviewSource).toContain('loading={isSubmitting}');
    expect(overviewSource).toContain('disabled={isSubmitting}');
  });

  it('saves time selection through one visible route-owned form and continues with a link', () => {
    const selectTimeSource = readSessionRoute('select-time/booking.public.appointment.session.select-time.route.tsx');
    const timeSlotButtonSource = readSessionRoute('select-time/_components/time-slot-button.tsx');
    const quickBookButtonSource = readSessionRoute('select-time/_components/quick-book-button.tsx');

    expect(selectTimeSource).toContain('<startTimeFetcher.Form method="post" preventScrollReset>');
    expect(selectTimeSource).toContain(
      "const pendingStartTime = startTimeFetcher.formData?.get('startTime') as string | null",
    );
    expect(selectTimeSource).toContain('const displayTime = pendingStartTime || selectedStartTime || null');
    expect(timeSlotButtonSource).toContain('name="startTime"');
    expect(timeSlotButtonSource).toContain('value={time}');
    expect(timeSlotButtonSource).toContain('type="submit"');
    expect(quickBookButtonSource).toContain('name="startTime"');
    expect(quickBookButtonSource).toContain('value={slot.time}');
    expect(selectTimeSource).toContain('return redirect(routes.selectTime)');
    expect(selectTimeSource).toContain('to={routes.contact}');
    expect(selectTimeSource).not.toContain('loaderData.navigation');
    expect(selectTimeSource).not.toContain("const intent = formData.get('intent') as string | null");
    expect(selectTimeSource).not.toContain("if (intent === 'continue')");
    expect(selectTimeSource).not.toContain('return redirect(routes.contact)');
    expect(selectTimeSource).not.toContain("const continueFormId = 'booking-select-time-continue-form'");
    expect(selectTimeSource).not.toContain('form: continueFormId');
    expect(selectTimeSource).not.toContain("buttonType: 'submit'");
    expect(selectTimeSource).not.toContain('BookingBottomActionBar');
    expect(selectTimeSource).not.toContain('useSubmit');
    expect(selectTimeSource).not.toContain('submitInFlightRef');
    expect(selectTimeSource).not.toContain('submitFormId');
  });

  it('uses backend session selectedStartTime as the selected time state', () => {
    const selectTimeSource = readSessionRoute('select-time/booking.public.appointment.session.select-time.route.tsx');

    expect(selectTimeSource).toContain("const selectedStartTime = session.selectedStartTime ?? ''");
    expect(selectTimeSource).toContain(
      "const pendingStartTime = startTimeFetcher.formData?.get('startTime') as string | null",
    );
    expect(selectTimeSource).toContain('const displayTime = pendingStartTime || selectedStartTime || null');
    expect(selectTimeSource).not.toContain('setSelectedTime');
    expect(selectTimeSource).not.toContain('const [selectedTime');
    expect(selectTimeSource).not.toContain('normalizeToOsloIso');
    expect(selectTimeSource).not.toContain('action: loaderData.navigation.contact');
  });
});
