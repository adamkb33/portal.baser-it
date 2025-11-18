import { useEffect, useRef, useState } from 'react';
import { useFetcher, useLoaderData, useNavigation, useSearchParams } from 'react-router';
import type { ScheduleDto } from 'tmp/openapi/gen/booking';
import { ContactPicker } from '~/components/pickers/contact-picker';
import { ServicePicker } from '~/components/pickers/service-picker';
import { DatePicker } from '~/components/pickers/date-picker';
import { TimeSlotPicker } from '~/components/pickers/time-slot-picker';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import {
  companyUserGetAppointmentState,
  type BookingAppointmentsLoaderData,
} from '~/features/booking/company-user-appointment-state';
import {
  COMPANY_USER_CREATE_APPOINTMENT_INTENT,
  companyUserCreateAppointment,
  parseSearchParams,
  validateAppointmentParams,
} from '~/features/booking/company-user-create-appointment';

export type BookingAppointmentsActionData = {
  schedule?: ScheduleDto;
  error?: string;
};

export const loader = companyUserGetAppointmentState;
export const action = companyUserCreateAppointment;

// Component
export default function BookingAppointmentsCreate() {
  const { companyContacts, companyGroupedServices, dailySchedules } = useLoaderData<BookingAppointmentsLoaderData>();

  const [searchParams, setSearchParams] = useSearchParams();
  const scheduleFetcher = useFetcher<BookingAppointmentsActionData>();
  const navigation = useNavigation();

  // Parse URL params as single source of truth
  const { contactId, serviceIds, date, startTime } = parseSearchParams(searchParams);

  // Initial step used only to set default open accordion item.
  const initialStep = !contactId ? 'step-1' : serviceIds.length === 0 ? 'step-2' : !date ? 'step-3' : 'step-4';

  // Controlled accordion + refs for smooth scroll
  const [activeStep, setActiveStep] = useState<string>(initialStep);
  const [pendingScrollStep, setPendingScrollStep] = useState<string | null>(initialStep);

  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const step4Ref = useRef<HTMLDivElement | null>(null);

  // Track previous values to detect actual changes (for auto-advance)
  const prevContactId = useRef(contactId);
  const prevServiceIdsLength = useRef(serviceIds.length);
  const prevDate = useRef(date);

  const scrollToElement = (el: HTMLDivElement | null) => {
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToStepRef = (step: string) => {
    if (step === 'step-1') scrollToElement(step1Ref.current);
    if (step === 'step-2') scrollToElement(step2Ref.current);
    if (step === 'step-3') scrollToElement(step3Ref.current);
    if (step === 'step-4') scrollToElement(step4Ref.current);
  };

  const handleAccordionChange = (value: string | undefined) => {
    if (!value) return;
    setActiveStep(value);
    setPendingScrollStep(value);
  };

  // Auto-advance to next step ONLY when data actually changes
  useEffect(() => {
    // Detect if contact was just selected
    if (contactId && contactId !== prevContactId.current) {
      prevContactId.current = contactId;
      setActiveStep('step-2');
      setPendingScrollStep('step-2');
      return;
    }

    // Detect if services were just selected
    if (serviceIds.length > 0 && serviceIds.length !== prevServiceIdsLength.current && contactId) {
      prevServiceIdsLength.current = serviceIds.length;
      setActiveStep('step-3');
      setPendingScrollStep('step-3');
      return;
    }

    // Detect if date was just selected
    if (date && date !== prevDate.current && contactId && serviceIds.length > 0) {
      prevDate.current = date;
      setActiveStep('step-4');
      setPendingScrollStep('step-4');
      return;
    }

    // Update refs for next comparison
    prevContactId.current = contactId;
    prevServiceIdsLength.current = serviceIds.length;
    prevDate.current = date;
  }, [contactId, serviceIds.length, date]);

  // Perform the scroll *after* the DOM has been updated so refs are set
  useEffect(() => {
    if (!pendingScrollStep) return;

    const stepExists =
      pendingScrollStep === 'step-1' ||
      (pendingScrollStep === 'step-2' && !!contactId) ||
      (pendingScrollStep === 'step-3' && !!contactId && serviceIds.length > 0) ||
      (pendingScrollStep === 'step-4' && !!contactId && serviceIds.length > 0 && !!date);

    if (!stepExists) return;

    // Add a small delay to let the accordion animation complete
    const timeoutId = setTimeout(() => {
      scrollToStepRef(pendingScrollStep);
      setPendingScrollStep(null);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [pendingScrollStep, contactId, serviceIds.length, date]);

  // Derived state
  const schedule = scheduleFetcher.data?.schedule;
  const scheduleError = scheduleFetcher.data?.error;
  const isLoadingSchedule = scheduleFetcher.state !== 'idle';
  const isSubmitting = navigation.state === 'submitting';
  const canSubmit = validateAppointmentParams({ contactId, serviceIds, date, startTime }) === null;
  const allowedDays = new Set(dailySchedules.map((s) => s.dayOfWeek.toString()));

  const selectedContact = contactId ? (companyContacts.find((c) => c.id === contactId) ?? null) : null;

  const formattedDateLong =
    date &&
    new Date(date).toLocaleDateString('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isComplete = canSubmit;

  // Get selected service names
  const selectedServiceNames = serviceIds
    .map((id) => {
      for (const group of companyGroupedServices) {
        const service = group.services.find((s) => s.id === id);
        if (service) return service.name;
      }
      return null;
    })
    .filter(Boolean) as string[];

  // Check if there are any available time slots in the schedule
  const hasAvailableTimeSlots =
    !!schedule && Array.isArray((schedule as any).timeSlots) && (schedule as any).timeSlots.length > 0;

  // Auto-fetch schedule when dependencies change
  useEffect(() => {
    if (contactId && serviceIds.length > 0 && date) {
      const params = new URLSearchParams({
        contactId: String(contactId),
        serviceIds: serviceIds.join(','),
        date,
      });

      const formData = new FormData();
      formData.append('intent', COMPANY_USER_CREATE_APPOINTMENT_INTENT.GET_SCHEDULE);

      scheduleFetcher.submit(formData, {
        method: 'post',
        action: `/booking/appointments/create?${params}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, serviceIds.join(','), date]);

  // Event handlers
  const handleContactChange = (id: number | null) => {
    const next = new URLSearchParams();
    if (id) next.set('contactId', String(id));
    setSearchParams(next, { replace: true });
  };

  const handleServicesChange = (ids: number[]) => {
    const next = new URLSearchParams(searchParams);

    if (ids.length > 0) {
      next.set('serviceIds', ids.join(','));
    } else {
      next.delete('serviceIds');
    }

    next.delete('date');
    next.delete('startTime');

    setSearchParams(next, { replace: true });
  };

  const handleDateChange = (isoDate: string) => {
    const next = new URLSearchParams(searchParams);
    if (isoDate) {
      next.set('date', isoDate);
    } else {
      next.delete('date');
    }
    next.delete('startTime');
    setSearchParams(next, { replace: true });
  };

  const handleTimeSlotChange = (slot: string) => {
    const next = new URLSearchParams(searchParams);
    if (slot) {
      next.set('startTime', slot);
    } else {
      next.delete('startTime');
    }
    setSearchParams(next, { replace: true });
  };

  const handleCreate = () => {
    const formData = new FormData();
    formData.append('intent', COMPANY_USER_CREATE_APPOINTMENT_INTENT.CREATE);

    scheduleFetcher.submit(formData, {
      method: 'post',
      action: `/booking/appointments/create?${searchParams}`,
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header card */}
        <div className="rounded-md border border-slate-200/70 bg-gradient-to-r from-white/80 via-slate-50/80 to-white/70 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Ny avtale</h1>
              <p className="mt-1 text-sm text-slate-500">
                Velg kunde, tjenester, dato og tidspunkt for å opprette en ny avtale.
              </p>
            </div>
            <div className="hidden text-xs text-slate-400 sm:block">
              <p>⏱️ Endringer lagres ikke før du fullfører reserveringen.</p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {scheduleError && (
          <div className="flex items-start gap-3 rounded-md border border-red-200/70 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <div className="mt-0.5 h-6 w-6 rounded-md bg-red-100/80 text-center text-xs font-semibold leading-6">!</div>
            <div>
              <p className="font-medium">Noe gikk galt</p>
              <p className="text-xs text-red-600/90">{scheduleError}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr),minmax(260px,1fr)] lg:items-start">
          {/* Main steps */}
          <div className="space-y-4">
            {/* Controlled accordion so we can move user smoothly between steps */}
            <Accordion type="single" value={activeStep} onValueChange={handleAccordionChange} className="space-y-4">
              {/* Step 1: Contact */}
              <div ref={step1Ref}>
                <AccordionItem
                  value="step-1"
                  className="rounded-md border border-slate-200/70 bg-white/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                            contactId
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {contactId ? '✓' : '1'}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">Oppgi personopplysninger</h3>
                          <p className="text-xs text-slate-500">
                            {contactId
                              ? (() => {
                                  const contact = companyContacts.find((c) => c.id === contactId);
                                  if (!contact) return 'Valgt';
                                  const parts = [];
                                  if (contact.givenName || contact.familyName) {
                                    parts.push(`${contact.givenName || ''} ${contact.familyName || ''}`.trim());
                                  }
                                  if (contact.email?.value) parts.push(contact.email.value);
                                  if (contact.mobileNumberDto?.value) parts.push(contact.mobileNumberDto.value);
                                  return parts.join(' • ');
                                })()
                              : 'Velg kunden du vil opprette en avtale for'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6">
                    <ContactPicker contacts={companyContacts} value={contactId} onChange={handleContactChange} />
                  </AccordionContent>
                </AccordionItem>
              </div>

              {/* Step 2: Services */}
              {contactId && (
                <div ref={step2Ref}>
                  <AccordionItem
                    value="step-2"
                    className="rounded-md border border-slate-200/70 bg-white/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                              serviceIds.length > 0
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {serviceIds.length > 0 ? '✓' : '2'}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Velg tjenester</h3>
                            <p className="text-xs text-slate-500">
                              {serviceIds.length > 0
                                ? selectedServiceNames.join(', ')
                                : 'Du kan velge én eller flere tjenester som inngår i avtalen'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6">
                      <ServicePicker
                        groupedServices={companyGroupedServices}
                        selectedServiceIds={serviceIds}
                        onChange={handleServicesChange}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </div>
              )}

              {/* Step 3: Date */}
              {contactId && serviceIds.length > 0 && (
                <div ref={step3Ref}>
                  <AccordionItem
                    value="step-3"
                    className="rounded-md border border-slate-200/70 bg-white/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                              date
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {date ? '✓' : '3'}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Velg dato</h3>
                            <p className="text-xs text-slate-500">
                              {date
                                ? formattedDateLong
                                : 'Kun dager hvor bedriften har åpningstid vil være tilgjengelige'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6">
                      <DatePicker
                        selectedDate={date ?? undefined}
                        onChange={handleDateChange}
                        isDateAllowed={(dateObj) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (dateObj < today) return false;

                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                          return allowedDays.has(dayName);
                        }}
                      />
                      {/* If we have a schedule and no available slots, show message under the date picker */}
                      {schedule && !hasAvailableTimeSlots && !isLoadingSchedule && (
                        <p className="mt-3 text-xs text-red-500">Ingen ledige timer denne dagen</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </div>
              )}

              {/* Step 4: Time slot */}
              {contactId && serviceIds.length > 0 && date && (
                <div ref={step4Ref}>
                  <AccordionItem
                    value="step-4"
                    className="rounded-md border border-slate-200/70 bg-white/80 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                              startTime
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {startTime ? '✓' : '4'}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">Velg tidspunkt</h3>
                            <p className="text-xs text-slate-500">
                              {startTime
                                ? `Valgt tid: ${startTime}`
                                : 'Velg et ledig tidspunkt basert på kundens og bedriftens tilgjengelighet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-slate-100 px-4 pb-5 pt-3 sm:px-6">
                      {isLoadingSchedule ? (
                        <div className="space-y-3 py-2 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Laster ledige tider...</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-9 rounded-full bg-slate-100/80 shadow-inner animate-pulse" />
                            ))}
                          </div>
                        </div>
                      ) : schedule ? (
                        hasAvailableTimeSlots ? (
                          <TimeSlotPicker
                            schedule={schedule}
                            selectedTimeSlot={startTime}
                            onChange={handleTimeSlotChange}
                          />
                        ) : (
                          <div className="py-4 text-sm text-red-500">Ingen ledige timer denne dagen</div>
                        )
                      ) : (
                        <div className="py-4 text-sm text-slate-500">Ingen ledige tider funnet</div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </div>
              )}
            </Accordion>
          </div>

          {/* Live summary sidebar – only when everything is filled out */}
          {isComplete && (
            <aside className="min-h-[260px]">
              <div className="relative rounded-md bg-gradient-to-br from-indigo-500/10 via-slate-50 to-emerald-50 p-[1px] shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                <div
                  tabIndex={-1}
                  autoFocus
                  className="flex h-full flex-col justify-between rounded-md bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-500">
                      Oppsummering
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">Din reservering</h2>
                    <p className="mt-1 text-xs text-slate-500">Kontroller detaljene før du fullfører reserveringen.</p>

                    <div className="mt-4 space-y-3 text-xs">
                      <div className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Kunde</p>
                        {selectedContact ? (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">
                              {[selectedContact.givenName, selectedContact.familyName].filter(Boolean).join(' ') ||
                                'Ukjent navn'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {selectedContact.email?.value || 'Ingen e-post registrert'}
                            </p>
                            {selectedContact.mobileNumberDto?.value && (
                              <p className="text-[11px] text-slate-500">{selectedContact.mobileNumberDto.value}</p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Tjenester</p>
                        <ul className="mt-1 space-y-0.5">
                          {selectedServiceNames.map((name) => (
                            <li key={name} className="text-[11px] text-slate-700">
                              • {name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Dato og tidspunkt
                        </p>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-[11px] text-slate-700">
                            {formattedDateLong}
                            {startTime ? ` • kl. ${startTime}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[11px] text-slate-400">
                      Alt ser bra ut. Klikk på knappen under for å fullføre reserveringen.
                    </p>
                    <div className="mt-3 flex items-center justify-end">
                      <Button
                        className="rounded-md bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-7 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:brightness-105 hover:shadow-indigo-500/40 disabled:from-slate-200 disabled:via-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        onClick={handleCreate}
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Oppretter...
                          </>
                        ) : (
                          'Fullfør reservering'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
