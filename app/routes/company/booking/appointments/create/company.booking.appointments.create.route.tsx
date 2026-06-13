import { formatISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { data, Form, Link, useNavigate, useNavigation, useSearchParams } from 'react-router';
import { CompanyUserController } from '~/api/generated/base';
import {
  CompanyUserAppointmentController,
  CompanyUserBookingProfileController,
  CompanyUserScheduleController,
} from '~/api/generated/booking';
import type { UserDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { CustomerSelector } from '~/routes/company/booking/_components/customer-selector';
import { DateTimeSelector } from '~/routes/company/booking/_components/date-time-selector';
import { ServicesSelector } from '~/routes/company/booking/_components/services-selector';
import { redirectWithSuccess, setFlashMessage } from '~/lib/flash-message.server';
import type { Route } from './+types/company.booking.appointments.create.route';
import {
  parseCreateFlowQueryState,
  parseListPageParam,
  parseListSizeParam,
  withCreateFlowQueryState,
} from './_utils/create-flow-query-params';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  CompanyPageTemplate,
  Input,
  Label,
} from '~/ui';

const CONTACT_PAGE_SIZE = 10;

const parsePositiveInt = (value: FormDataEntryValue | null): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const getStatusCode = (error: unknown): number | undefined => {
  const payload = error as { response?: { status?: number } };
  return payload.response?.status;
};

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const state = parseCreateFlowQueryState(url.searchParams);
    const contactPage = parseListPageParam(url.searchParams.get('contact-page'), 0);
    const contactSize = parseListSizeParam(url.searchParams.get('contact-size'), CONTACT_PAGE_SIZE);
    const contactSearch = url.searchParams.get('customer-search') || url.searchParams.get('contact-search') || '';
    const serviceSearch = url.searchParams.get('service-search') || '';
    const contactDirectionParam =
      url.searchParams.get('customer-direction') || url.searchParams.get('contact-direction');
    const contactDirection = contactDirectionParam === 'DESC' ? 'DESC' : 'ASC';
    const contactsQuery = {
      page: contactPage,
      size: contactSize,
      sort: 'familyName',
      direction: contactDirection,
      ...(contactSearch && { search: contactSearch }),
    } as const;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[appointments.create.loader] customers: incoming params', {
        requestUrl: url.toString(),
        raw: {
          customerSearch: url.searchParams.get('customer-search'),
          contactSearch: url.searchParams.get('contact-search'),
          contactPage: url.searchParams.get('contact-page'),
          contactSize: url.searchParams.get('contact-size'),
          customerDirection: url.searchParams.get('customer-direction'),
          contactDirection: url.searchParams.get('contact-direction'),
        },
        parsed: {
          contactSearch,
          contactPage,
          contactSize,
          contactDirection,
        },
      });
      console.log('[appointments.create.loader] customers: api query', contactsQuery);
    }

    const apiResponses = await withAuth(request, async () => {
      const contactsResponse = await CompanyUserAppointmentController.getAppointmentCustomers({
        query: contactsQuery,
      });

      const bookingProfileResponse = await CompanyUserBookingProfileController.getBookingProfile();
      const scheduleResponse =
        state.serviceIds.length > 0
          ? await CompanyUserScheduleController.getSchedule({
              body: { selectedServiceIds: state.serviceIds },
            })
          : null;

      return { contactsResponse, bookingProfileResponse, scheduleResponse };
    });

    const contactsData = apiResponses.contactsResponse.data?.data;
    const customers = (contactsData?.content || []).map((user) => ({
      id: user.id,
      givenName: user.givenName,
      familyName: user.familyName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      emailVerified: user.emailVerified,
      mobileVerified: user.mobileVerified,
      provider: user.provider,
    })) as UserDto[];

    if (process.env.NODE_ENV !== 'production') {
      console.log('[appointments.create.loader] customers: response summary', {
        requestedQuery: contactsQuery,
        pagination: {
          page: contactsData?.page ?? 0,
          size: contactsData?.size ?? contactSize,
          totalElements: contactsData?.totalElements ?? 0,
          totalPages: contactsData?.totalPages ?? 1,
        },
        returnedCount: contactsData?.content?.length ?? 0,
      });
      console.log(
        '[appointments.create.loader] customers: returned users',
        (contactsData?.content ?? []).map((user) => ({
          id: user.id,
          givenName: user.givenName,
          familyName: user.familyName,
          email: user.email,
          mobileNumber: user.mobileNumber,
        })),
      );
    }

    return {
      customers,
      contactPagination: {
        page: contactsData?.page ?? 0,
        size: contactsData?.size ?? contactSize,
        totalElements: contactsData?.totalElements ?? 0,
        totalPages: contactsData?.totalPages ?? 1,
      },
      bookingProfile: apiResponses.bookingProfileResponse.data,
      schedules: apiResponses.scheduleResponse?.data?.data || [],
      contactSearch,
      contactDirection,
      serviceSearch,
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente data');
    return {
      customers: [],
      contactPagination: {
        page: 0,
        size: CONTACT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 1,
      },
      bookingProfile: null,
      schedules: [],
      contactSearch: '',
      contactDirection: 'ASC',
      serviceSearch: '',
      error: message,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = parsePositiveInt(formData.get('userId'));
  const email = formData.get('email')?.toString().trim() || '';
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() || '';
  const givenName = formData.get('givenName')?.toString().trim() || '';
  const familyName = formData.get('familyName')?.toString().trim() || '';
  const serviceIds =
    formData
      .get('serviceIds')
      ?.toString()
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0) || [];
  const startTime = formData.get('startTime')?.toString() || '';

  if (!userId && !email && !mobileNumber) {
    const error = 'Velg kunde eller oppgi e-post/mobilnummer.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  if (serviceIds.length === 0) {
    const error = 'Velg minst en tjeneste.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  if (!startTime) {
    const error = 'Velg tidspunkt.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  if (userId) {
    try {
      const response = await withAuth(request, async () =>
        CompanyUserAppointmentController.companyUserCreateAppointment({
          body: {
            userId,
            serviceIds,
            startTime,
          },
        }),
      );

      return redirectWithSuccess(
        request,
        ROUTES_MAP['company.booking.appointments'].href,
        response.data?.message?.value || 'Avtalen er opprettet.',
      );
    } catch (error) {
      if (getStatusCode(error) === 409) {
        const conflictError = 'Valgt tidspunkt ble nettopp opptatt. Velg et annet tidspunkt.';
        const flashCookie = await setFlashMessage(request, { type: 'error', text: conflictError });
        return data({ error: conflictError }, { status: 409, headers: { 'Set-Cookie': flashCookie } });
      }
      const { message } = resolveErrorPayload(error, 'Kunne ikke opprette avtale');
      const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
      return data({ error: message }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
    }
  }

  const resolverBody = {
    email: email || undefined,
    mobileNumber: mobileNumber || undefined,
    givenName: givenName || undefined,
    familyName: familyName || undefined,
  };

  try {
    const resolvedCustomer = await withAuth(request, async () =>
      CompanyUserController.resolveOrCreateAppointmentCustomer({
        body: resolverBody,
      }),
    );
    const resolvedUserId = resolvedCustomer.data?.data?.userId;
    const resolverStatus = resolvedCustomer.data?.data?.status;

    if (!resolvedUserId || !Number.isInteger(resolvedUserId)) {
      const error = 'Klarte ikke å finne eller opprette kunde. Prøv igjen.';
      const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
      return data({ error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
    }

    try {
      const response = await withAuth(request, async () =>
        CompanyUserAppointmentController.companyUserCreateAppointment({
          body: {
            userId: resolvedUserId,
            serviceIds,
            startTime,
          },
        }),
      );

      const baseMessage = response.data?.message?.value || 'Avtalen er opprettet.';
      const successMessage =
        resolverStatus === 'CREATED' ? `${baseMessage} Kunden ble opprettet og invitert.` : baseMessage;

      return redirectWithSuccess(request, ROUTES_MAP['company.booking.appointments'].href, successMessage);
    } catch (error) {
      if (getStatusCode(error) === 409) {
        const conflictError = 'Valgt tidspunkt ble nettopp opptatt. Velg et annet tidspunkt.';
        const flashCookie = await setFlashMessage(request, { type: 'error', text: conflictError });
        return data({ error: conflictError }, { status: 409, headers: { 'Set-Cookie': flashCookie } });
      }
      const { message } = resolveErrorPayload(error, 'Kunne ikke opprette avtale');
      const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
      return data({ error: message }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
    }
  } catch (error) {
    if (getStatusCode(error) === 409) {
      const conflictError = 'Email and mobile belong to different customers. Please use only one or correct contact info.';
      const flashCookie = await setFlashMessage(request, { type: 'error', text: conflictError });
      return data({ error: conflictError }, { status: 409, headers: { 'Set-Cookie': flashCookie } });
    }
    const { message } = resolveErrorPayload(error, 'Kunne ikke finne eller opprette kunde');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingAppointmentsCreatePage({ loaderData }: Route.ComponentProps) {
  type CreateStep = 'contact' | 'services' | 'time' | 'submit';
  type CustomerMode = 'existing' | 'new';
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const state = parseCreateFlowQueryState(searchParams);
  const isSubmitting = navigation.state === 'submitting';

  const services = loaderData.bookingProfile?.services || [];
  const searchLower = loaderData.serviceSearch.toLowerCase();
  const filteredServices = !loaderData.serviceSearch
    ? services
    : services
        .map((group) => ({
          ...group,
          services: group.services.filter((service) => service.name.toLowerCase().includes(searchLower)),
        }))
        .filter((group) => group.services.length > 0);

  const defaultStep = useMemo<CreateStep>(() => {
    const hasIdentifier = Boolean(state.userId) || Boolean(state.email.trim()) || Boolean(state.mobileNumber.trim());
    if (!hasIdentifier) return 'contact';
    if (state.serviceIds.length === 0) return 'services';
    if (!state.startTime) return 'time';
    return 'submit';
  }, [state.userId, state.email, state.mobileNumber, state.serviceIds.length, state.startTime]);

  const [openStep, setOpenStep] = useState<CreateStep>(defaultStep);
  const [draftUserId, setDraftUserId] = useState<number | null>(state.userId);
  const [draftEmail, setDraftEmail] = useState(state.email);
  const [draftMobileNumber, setDraftMobileNumber] = useState(state.mobileNumber);
  const [draftGivenName, setDraftGivenName] = useState(state.givenName);
  const [draftFamilyName, setDraftFamilyName] = useState(state.familyName);
  const [draftServiceIds, setDraftServiceIds] = useState<number[]>(state.serviceIds);
  const [draftStartTime, setDraftStartTime] = useState<string>(state.startTime);
  const [customerMode, setCustomerMode] = useState<CustomerMode>(() => {
    if (state.userId) return 'existing';
    if (state.email.trim() || state.mobileNumber.trim() || state.givenName.trim() || state.familyName.trim())
      return 'new';
    return 'existing';
  });
  const stateServiceIdsKey = state.serviceIds.join(',');

  useEffect(() => {
    setDraftUserId(state.userId);
    setDraftEmail(state.email);
    setDraftMobileNumber(state.mobileNumber);
    setDraftGivenName(state.givenName);
    setDraftFamilyName(state.familyName);
    setDraftServiceIds(state.serviceIds);
    setDraftStartTime(state.startTime);
    setCustomerMode(() => {
      if (state.userId) return 'existing';
      if (state.email.trim() || state.mobileNumber.trim() || state.givenName.trim() || state.familyName.trim())
        return 'new';
      return 'existing';
    });
    setOpenStep(defaultStep);
  }, [
    state.userId,
    state.email,
    state.mobileNumber,
    state.givenName,
    state.familyName,
    stateServiceIdsKey,
    state.startTime,
    defaultStep,
  ]);

  const updateState = (partial: Partial<typeof state>) => {
    const next = withCreateFlowQueryState(searchParams, partial);
    navigate(`?${next.toString()}`, { replace: true, preventScrollReset: true });
  };

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    navigate(`?${next.toString()}`, { replace: true, preventScrollReset: true });
  };

  const updateParams = (updates: Array<{ key: string; value: string | null }>) => {
    const next = new URLSearchParams(searchParams);
    updates.forEach(({ key, value }) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    navigate(`?${next.toString()}`, { replace: true, preventScrollReset: true });
  };

  const hasIdentifier = Boolean(state.userId) || Boolean(state.email.trim()) || Boolean(state.mobileNumber.trim());
  const isValid = hasIdentifier && state.serviceIds.length > 0 && Boolean(state.startTime);
  const servicesUnlocked = hasIdentifier;
  const timeUnlocked = servicesUnlocked && state.serviceIds.length > 0;
  const submitUnlocked = timeUnlocked && Boolean(state.startTime);

  return (
    <CompanyPageTemplate
      title="Opprett ny time"
      description="Velg eksisterende kunde eller oppgi brukerinfo, deretter tjenester og tidspunkt i én flyt."
      size="xl"
      routeLinks={
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES_MAP['company.booking.appointments'].href}>Tilbake til timebestillinger</Link>
        </Button>
      }
    >
      <Accordion
        type="single"
        collapsible={false}
        value={openStep}
        onValueChange={(value) => {
          if (value === 'contact') setOpenStep('contact');
          if (value === 'services' && servicesUnlocked) setOpenStep('services');
          if (value === 'time' && timeUnlocked) setOpenStep('time');
          if (value === 'submit' && submitUnlocked) setOpenStep('submit');
        }}
      >
        <AccordionItem value="contact">
          <AccordionTrigger>1. Kunde og brukerinfo</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid w-full grid-cols-2 rounded-md border border-border bg-surface p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === 'existing' ? 'outline' : 'ghost'}
                  className={customerMode === 'existing' ? 'bg-background' : ''}
                  onClick={() => setCustomerMode('existing')}
                >
                  Eksisterende kunde
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === 'new' ? 'outline' : 'ghost'}
                  className={customerMode === 'new' ? 'bg-background' : ''}
                  onClick={() => {
                    setCustomerMode('new');
                    setDraftUserId(null);
                  }}
                >
                  Ny kunde
                </Button>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-3">
                  <CustomerSelector
                    customers={loaderData.customers}
                    selectedCustomerId={draftUserId}
                    onSelectCustomer={(customer) => {
                      setDraftUserId(customer?.id ?? null);
                    }}
                    pagination={loaderData.contactPagination}
                    onPageChange={(page) => updateParam('contact-page', String(Math.max(0, page)))}
                    onSearchChange={(search) => {
                      updateParams([
                        { key: 'contact-page', value: '0' },
                        { key: 'customer-search', value: search || null },
                      ]);
                    }}
                    initialSearch={loaderData.contactSearch}
                  />
                  <Button
                    className="w-full"
                    disabled={!draftUserId}
                    onClick={() => {
                      if (!draftUserId) return;
                      updateState({
                        userId: draftUserId,
                        email: '',
                        mobileNumber: '',
                        givenName: '',
                        familyName: '',
                      });
                      setOpenStep('services');
                    }}
                  >
                    Fortsett med valgt kunde
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-3 border-t border-border pt-3">
                    <p className="text-sm font-medium text-text-primary">Oppgi ny kunde</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-post</Label>
                        <Input
                          id="email"
                          name="email-view"
                          placeholder="navn@eksempel.no"
                          value={draftEmail}
                          onChange={(e) => setDraftEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobilnummer</Label>
                        <Input
                          id="mobileNumber"
                          name="mobileNumber-view"
                          placeholder="+47 99 99 99 99"
                          value={draftMobileNumber}
                          onChange={(e) => setDraftMobileNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="givenName">Fornavn (valgfritt)</Label>
                        <Input
                          id="givenName"
                          name="givenName-view"
                          placeholder="Fornavn"
                          value={draftGivenName}
                          onChange={(e) => setDraftGivenName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="familyName">Etternavn (valgfritt)</Label>
                        <Input
                          id="familyName"
                          name="familyName-view"
                          placeholder="Etternavn"
                          value={draftFamilyName}
                          onChange={(e) => setDraftFamilyName(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Minst ett felt for e-post eller mobilnummer må fylles ut.
                  </p>
                  <Button
                    className="w-full"
                    disabled={!draftEmail.trim() && !draftMobileNumber.trim()}
                    onClick={() => {
                      if (!draftEmail.trim() && !draftMobileNumber.trim()) return;
                      updateState({
                        userId: null,
                        email: draftEmail,
                        mobileNumber: draftMobileNumber,
                        givenName: draftGivenName,
                        familyName: draftFamilyName,
                      });
                      setOpenStep('services');
                    }}
                  >
                    Fortsett med ny kunde
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="services">
          <AccordionTrigger disabled={!servicesUnlocked}>2. Velg tjenester</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <ServicesSelector
              serviceGroups={filteredServices}
              selectedServiceIds={draftServiceIds}
              onSelectService={(serviceId) =>
                setDraftServiceIds((prev) => (prev.includes(serviceId) ? prev : [...prev, serviceId]))
              }
              onDeselectService={(serviceId) => setDraftServiceIds((prev) => prev.filter((id) => id !== serviceId))}
              onSearchChange={(value) => updateParam('service-search', value || null)}
              initialSearch={loaderData.serviceSearch}
            />
            <Button
              className="w-full"
              disabled={draftServiceIds.length === 0}
              onClick={() => {
                if (draftServiceIds.length === 0) return;
                updateState({ serviceIds: draftServiceIds });
                setOpenStep('time');
              }}
            >
              Lagre og fortsett
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="time">
          <AccordionTrigger disabled={!timeUnlocked}>3. Velg tidspunkt</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <DateTimeSelector
              schedules={loaderData.schedules}
              selectedDateTime={draftStartTime ? new Date(draftStartTime) : null}
              onSelectDateTime={(date) => setDraftStartTime(formatISO(date))}
            />
            <Button
              className="w-full"
              disabled={!draftStartTime}
              onClick={() => {
                if (!draftStartTime) return;
                updateState({ startTime: draftStartTime });
                setOpenStep('submit');
              }}
            >
              Lagre og fortsett
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="submit">
          <AccordionTrigger disabled={!submitUnlocked}>4. Opprett time</AccordionTrigger>
          <AccordionContent className="space-y-2">
            <Form method="post" className="space-y-2">
              <input type="hidden" name="userId" value={state.userId ?? ''} />
              <input type="hidden" name="email" value={state.email} />
              <input type="hidden" name="mobileNumber" value={state.mobileNumber} />
              <input type="hidden" name="givenName" value={state.givenName} />
              <input type="hidden" name="familyName" value={state.familyName} />
              <input type="hidden" name="serviceIds" value={state.serviceIds.join(',')} />
              <input type="hidden" name="startTime" value={state.startTime} />
              <Button type="submit" className="w-full" disabled={!isValid || isSubmitting}>
                {isSubmitting ? 'Oppretter time...' : 'Opprett time'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate(ROUTES_MAP['company.booking.appointments'].href)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
            </Form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CompanyPageTemplate>
  );
}
