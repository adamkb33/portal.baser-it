import { useLoaderData, useSearchParams, useFetcher, useNavigation } from 'react-router';
import { CompanyUserPicker } from '~/components/pickers/company-user-picker';
import { ServicePicker } from '~/components/pickers/service-picker';
import { DatePicker } from '~/components/pickers/date-picker';
import { TimeSlotPicker } from '~/components/pickers/time-slot-picker';
import { Accordion } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, useTransition, useCallback } from 'react';
import { GetOrCreateContactForm } from '~/components/forms/get-or-create-contact.form';
import { type GetOrCreateContactSchema } from '~/features/booking/get-or-create-contact.schema';
import { BiTBusinessHero } from '~/components/heros/BiT-business.hero';
import { ShapesAngularOne } from '~/components/shapes/shapes';
import { parseSearchParams } from '~/features/booking/company-user-create-appointment';
import {
  type AppointmentsLoaderData,
  type AppointmentsActionData,
  APPOINTMENTS_INTENT,
  createAppointmentloader,
  createAppointmentAction,
} from '~/features/booking/create-appointment-route';
import { BookingStep } from '~/components/booking/booking-step';

export const loader = createAppointmentloader;
export const action = createAppointmentAction;

const CONTACT_STORAGE_KEY = 'booking_contact_info';

export default function Appointments() {
  const { companyUsers } = useLoaderData<AppointmentsLoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const contactFetcher = useFetcher<AppointmentsActionData>();
  const scheduleFetcher = useFetcher<AppointmentsActionData>();
  const navigation = useNavigation();

  const companyId = Number(searchParams.get('companyId'));
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : null;
  const { contactId, serviceIds, date, startTime } = parseSearchParams(searchParams);

  // ============================================================================
  // STEP NAVIGATION LOGIC
  // ============================================================================

  // Determine which step user should be at based on data completeness
  const availableStep = useMemo(() => {
    if (!userId) return 'step-1';
    if (!contactId) return 'step-2';
    if (serviceIds.length === 0) return 'step-3';
    if (!date || !startTime) return 'step-4';
    return 'step-5';
  }, [userId, contactId, serviceIds.length, date, startTime]);

  const [activeStep, setActiveStep] = useState<string>(availableStep);
  const [savedContactData, setSavedContactData] = useState<Partial<GetOrCreateContactSchema> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  const scrollToStepRef = useCallback((step: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      'step-1': step1Ref,
      'step-2': step2Ref,
      'step-3': step3Ref,
      'step-4': step4Ref,
      'step-5': step5Ref,
    };

    refs[step]?.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleAccordionChange = useCallback(
    (value: string | undefined) => {
      if (value) {
        console.log(value);
        setActiveStep(value);
        // Delay scroll to allow accordion animation
        setTimeout(() => scrollToStepRef(value), 150);
      } else {
        // Allow closing by setting to empty string
        setActiveStep('');
      }
    },
    [scrollToStepRef],
  );

  // Auto-advance to next step when previous step completes
  useEffect(() => {
    const stepOrder = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
    const currentIndex = stepOrder.indexOf(activeStep);
    const availableIndex = stepOrder.indexOf(availableStep);

    // Only push the user forward when a NEW step becomes available
    if (availableIndex > currentIndex) {
      setActiveStep(availableStep);
      setTimeout(() => scrollToStepRef(availableStep), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableStep, scrollToStepRef]);

  // Reset downstream steps based on what changed
  const resetDownstreamSteps = useCallback(
    (fromStep: number) => {
      const next = new URLSearchParams(searchParams);

      if (fromStep <= 1) {
        next.delete('userId');
        next.delete('contactId');
        next.delete('serviceIds');
        next.delete('date');
        next.delete('startTime');
        setIsEditing(false);
      }
      if (fromStep <= 2) {
        next.delete('contactId');
        next.delete('serviceIds');
        next.delete('date');
        next.delete('startTime');
        setIsEditing(false);
      }
      if (fromStep <= 3) {
        next.delete('serviceIds');
        next.delete('date');
        next.delete('startTime');
      }
      if (fromStep <= 4) {
        next.delete('date');
        next.delete('startTime');
      }

      return next;
    },
    [searchParams],
  );

  // ============================================================================
  // END STEP NAVIGATION LOGIC
  // ============================================================================

  const isSubmittingContact = contactFetcher.state !== 'idle';
  const contactError = contactFetcher.data?.error;
  const schedule = scheduleFetcher.data?.schedule;
  const scheduleError = scheduleFetcher.data?.error;
  const isLoadingSchedule = scheduleFetcher.state !== 'idle';
  const isSubmitting = navigation.state === 'submitting';

  // Load contact data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GetOrCreateContactSchema>;
        setSavedContactData(parsed);
      }
    } catch (error) {
      console.error('Failed to load contact data from localStorage:', error);
    }
  }, []);

  // Save contact data to localStorage whenever it changes
  useEffect(() => {
    if (savedContactData) {
      try {
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(savedContactData));
      } catch (error) {
        console.error('Failed to save contact data to localStorage:', error);
      }
    }
  }, [savedContactData]);

  // Fetch schedule when all prerequisites are met
  useEffect(() => {
    if (userId && contactId && serviceIds.length > 0 && date) {
      const params = new URLSearchParams(searchParams);
      const formData = new FormData();
      formData.append('intent', APPOINTMENTS_INTENT.GET_SCHEDULE);

      scheduleFetcher.submit(formData, {
        method: 'post',
        action: `/appointments?${params}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, contactId, serviceIds.join(','), date]);

  const handleUserChange = useCallback(
    (id: number | null) => {
      startTransition(() => {
        const next = resetDownstreamSteps(1);

        if (id) {
          next.set('userId', String(id));
        }

        setSearchParams(next, { replace: true });
      });
    },
    [resetDownstreamSteps, setSearchParams],
  );

  const handleContactSubmit = useCallback(
    (values: GetOrCreateContactSchema) => {
      setSavedContactData(values);
      setIsEditing(false);

      const formData = new FormData();
      formData.append('intent', APPOINTMENTS_INTENT.GET_OR_CREATE_CONTACT);
      formData.append('givenName', values.givenName);
      formData.append('familyName', values.familyName);
      if (values.email) formData.append('email', values.email);
      if (values.mobileNumber) formData.append('mobileNumber', values.mobileNumber);

      contactFetcher.submit(formData, {
        method: 'post',
        action: `/appointments?${searchParams}`,
      });
    },
    [contactFetcher, searchParams],
  );

  const handleFormChange = useCallback(() => {
    if (!isEditing && contactId) {
      setIsEditing(true);

      startTransition(() => {
        const next = resetDownstreamSteps(2);
        setSearchParams(next, { replace: true });
      });
    }
  }, [isEditing, contactId, resetDownstreamSteps, setSearchParams]);

  const handleServicesChange = useCallback(
    (ids: number[]) => {
      startTransition(() => {
        const next = resetDownstreamSteps(3);

        if (ids.length > 0) {
          next.set('serviceIds', ids.join(','));
        }

        setSearchParams(next, { replace: true });
      });
    },
    [resetDownstreamSteps, setSearchParams],
  );

  const handleDateChange = useCallback(
    (isoDate: string) => {
      startTransition(() => {
        const next = new URLSearchParams(searchParams);

        if (isoDate) {
          next.set('date', isoDate);
        } else {
          next.delete('date');
        }

        // Clear time slot when date changes
        next.delete('startTime');

        setSearchParams(next, { replace: true });
      });
    },
    [searchParams, setSearchParams],
  );

  const handleTimeSlotChange = useCallback(
    (slot: string) => {
      startTransition(() => {
        const next = new URLSearchParams(searchParams);

        if (slot) {
          next.set('startTime', slot);
        }

        setSearchParams(next, { replace: true });
      });
    },
    [searchParams, setSearchParams],
  );

  const handleCreateAppointment = useCallback(() => {
    const formData = new FormData();
    formData.append('intent', APPOINTMENTS_INTENT.CREATE_APPOINTMENT);

    scheduleFetcher.submit(formData, {
      method: 'post',
      action: `/appointments?${searchParams}`,
    });
  }, [scheduleFetcher, searchParams]);

  const selectedUser = useMemo(
    () => (userId ? companyUsers.find((u) => u.userId === userId) : null),
    [userId, companyUsers],
  );

  const groupedServices = selectedUser?.services || [];
  const dailySchedules = selectedUser?.dailySchedules || [];

  const allowedDays = useMemo(() => new Set(dailySchedules.map((s) => s.dayOfWeek.toString())), [dailySchedules]);

  const selectedServiceNames = useMemo(() => {
    return serviceIds
      .map((id) => {
        for (const group of groupedServices) {
          const service = group.services.find((s) => s.id === id);
          if (service) return service.name;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }, [serviceIds, groupedServices]);

  const formattedDateLong = useMemo(
    () =>
      date
        ? new Date(date).toLocaleDateString('nb-NO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null,
    [date],
  );

  const hasAvailableTimeSlots = useMemo(
    () => !!schedule && Array.isArray((schedule as any).timeSlots) && (schedule as any).timeSlots.length > 0,
    [schedule],
  );

  const isDateAllowed = useCallback(
    (dateObj: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) return false;

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      return allowedDays.has(dayName);
    },
    [allowedDays],
  );

  const displayedStartTime = startTime?.split('T')[1]?.substring(0, 5);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-2 space-y-6">
        {/* Header card - Enhanced */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 px-6 py-6 shadow-[0_20px_50px_rgba(99,102,241,0.12)] backdrop-blur-sm sm:px-8 sm:py-7">
          <ShapesAngularOne />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Book Time</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Velg ansatt, oppgi kontaktopplysninger, velg tjenester og tidspunkt.
              </p>
            </div>
            {/* Progress indicator */}
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <div className="text-sm font-semibold text-indigo-600">
                Steg {['step-1', 'step-2', 'step-3', 'step-4', 'step-5'].indexOf(availableStep) + 1} av 5
              </div>
            </div>
          </div>
        </div>

        {/* Error banner - Enhanced */}
        {(contactError || scheduleError) && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 px-5 py-4 text-sm text-red-700 shadow-md">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-sm font-bold">
              !
            </div>
            <div>
              <p className="font-semibold">Noe gikk galt</p>
              <p className="mt-1 text-xs text-red-600">{contactError || scheduleError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          {/* Main steps */}
          <div className="space-y-4">
            <Accordion
              type="single"
              value={activeStep}
              onValueChange={handleAccordionChange}
              className="space-y-3"
              collapsible
            >
              {/* Step 1: Company User */}
              <BookingStep
                ref={step1Ref}
                stepNumber={1}
                stepValue="step-1"
                title="Velg ansatt"
                description={
                  userId && selectedUser ? selectedUser.email : 'Velg hvilken ansatt du ønsker å bestille time hos'
                }
                isCompleted={!!userId}
              >
                <CompanyUserPicker companyUsers={companyUsers} selectedUserId={userId} onChange={handleUserChange} />
              </BookingStep>

              {/* Step 2: Contact Information */}
              <BookingStep
                ref={step2Ref}
                stepNumber={2}
                stepValue="step-2"
                title="Oppgi kontaktopplysninger"
                description={
                  contactId
                    ? 'Kontaktopplysninger lagret'
                    : 'Vi trenger dine kontaktopplysninger for å bekrefte avtalen'
                }
                isCompleted={!!contactId}
              >
                {!userId && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Vennligst velg en ansatt først
                  </div>
                )}
                {userId && (
                  <>
                    {savedContactData && !contactId && (
                      <div className="mb-3 flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Dine tidligere kontaktopplysninger er forhåndsutfylt</span>
                      </div>
                    )}
                    <GetOrCreateContactForm
                      companyId={companyId}
                      onSubmit={handleContactSubmit}
                      onChange={handleFormChange}
                      isSubmitting={isSubmittingContact}
                      initialValues={savedContactData || undefined}
                    />
                  </>
                )}
              </BookingStep>

              {/* Step 3: Services */}
              <BookingStep
                ref={step3Ref}
                stepNumber={3}
                stepValue="step-3"
                title="Velg tjenester"
                description={
                  serviceIds.length > 0
                    ? selectedServiceNames.join(', ')
                    : 'Du kan velge én eller flere tjenester som inngår i avtalen'
                }
                isCompleted={serviceIds.length > 0}
              >
                {(!userId || !contactId) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {!userId && 'Vennligst velg en ansatt først'}
                    {userId && !contactId && 'Vennligst oppgi kontaktopplysninger først'}
                  </div>
                )}
                {userId && contactId && (
                  <ServicePicker
                    groupedServices={groupedServices}
                    selectedServiceIds={serviceIds}
                    onChange={handleServicesChange}
                  />
                )}
              </BookingStep>

              {/* Step 4: Date & Time */}
              <BookingStep
                ref={step4Ref}
                stepNumber={4}
                stepValue="step-4"
                title="Velg dato og tidspunkt"
                description={
                  date && startTime
                    ? `${formattedDateLong} kl. ${displayedStartTime}`
                    : 'Velg en dato og et ledig tidspunkt'
                }
                isCompleted={!!(date && startTime)}
              >
                {(!userId || !contactId || serviceIds.length === 0) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {!userId && 'Vennligst velg en ansatt først'}
                    {userId && !contactId && 'Vennligst oppgi kontaktopplysninger først'}
                    {userId && contactId && serviceIds.length === 0 && 'Vennligst velg minst én tjeneste først'}
                  </div>
                )}
                {userId && contactId && serviceIds.length > 0 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-slate-900">Velg dato</h4>
                      <DatePicker
                        selectedDate={date ?? undefined}
                        onChange={handleDateChange}
                        isDateAllowed={isDateAllowed}
                      />
                    </div>

                    {date && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">Velg tidspunkt</h4>
                        {isLoadingSchedule ? (
                          <div className="space-y-3 py-2 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Laster ledige tider...</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="h-9 w-20 animate-pulse rounded-full bg-slate-100/80 shadow-inner"
                                />
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
                            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                              Ingen ledige timer denne dagen
                            </div>
                          )
                        ) : (
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            Velg en dato for å se ledige tider
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </BookingStep>

              {/* Step 5: Confirm and Submit */}
              <BookingStep
                ref={step5Ref}
                stepNumber={5}
                stepValue="step-5"
                title="Bekreft reservering"
                description="Sjekk at alt er korrekt og fullfør reserveringen"
                isCompleted={false}
                variant="final"
              >
                {(!userId || !contactId || serviceIds.length === 0 || !date || !startTime) && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Vennligst fullfør alle trinnene ovenfor før du kan bekrefte reserveringen
                  </div>
                )}
                {userId && contactId && serviceIds.length > 0 && date && startTime && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Oppsummering
                      </h4>
                      <div className="space-y-2.5 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-900">Ansatt:</span>
                          <span>{selectedUser?.email}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-900">Tjenester:</span>
                          <span>{selectedServiceNames.join(', ')}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-900">Tidspunkt:</span>
                          <span>
                            {formattedDateLong} kl. {displayedStartTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateAppointment}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-8 py-3.5 text-base font-bold shadow-xl shadow-indigo-500/40 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/50 disabled:scale-100 disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Fullfører reservering...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Fullfør reservering
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-slate-500">
                      Du vil motta en bekreftelse på e-post umiddelbart
                    </p>
                  </div>
                )}
              </BookingStep>
            </Accordion>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <BiTBusinessHero />
      </div>
    </div>
  );
}
