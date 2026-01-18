import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Form } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import { Check, ChevronRight, User, Briefcase, Calendar as CalendarIcon, Clock, Edit2, X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { formatISO } from 'date-fns';
import type { ContactDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { ContactSelector } from '../../../_components/contact-selector';
import { DateTimeSelector } from '../../../_components/date-time-selector';
import { ServicesSelector } from '../../../_components/services-selector';
import type { Route } from '../+types/company.booking.appointments.create.route';

type WizardStep = 'contact' | 'services' | 'datetime' | 'review';

interface AppointmentWizardProps {
  componentProps: Route.ComponentProps;
}

export function AppointmentBookingWizard({ componentProps }: AppointmentWizardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loaderData, actionData } = componentProps;
  const { contacts, contactPagination, contactSearch, serviceSearch, schedules } = loaderData;

  const [currentStep, setCurrentStep] = useState<WizardStep>('contact');
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [filteredServices, setFilteredServices] = useState<GroupedServiceGroupDto[]>(
    loaderData.bookingProfile?.services || [],
  );

  const steps: WizardStep[] = ['contact', 'services', 'datetime', 'review'];

  // ... (keep all the useEffect hooks and handlers from previous version)

  useEffect(() => {
    if (actionData?.success) {
      navigate('/company/booking/appointments');
    }
  }, [actionData, navigate]);

  useEffect(() => {
    const sessionParam = searchParams.get('appointment-session');
    if (sessionParam && contacts.length > 0) {
      const contactMatch = sessionParam.match(/contact_id:(\d+)/);
      if (contactMatch) {
        const contactId = parseInt(contactMatch[1]);
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
          setSelectedContact(contact);
          setCompletedSteps((prev) => new Set([...prev, 'contact']));
        }
      }

      const servicesMatch = sessionParam.match(/service_ids:(\d+(?:,\d+)*)/);
      if (servicesMatch) {
        const serviceIds = servicesMatch[1].split(',').map(Number);
        setSelectedServiceIds(serviceIds);
        if (serviceIds.length > 0) {
          setCompletedSteps((prev) => new Set([...prev, 'services']));
        }
      }

      const dateTimeMatch = sessionParam.match(/datetime:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?/);
      if (dateTimeMatch) {
        const dateTimeStr = dateTimeMatch[1] + (dateTimeMatch[2] || ':00');
        const dateTime = new Date(dateTimeStr);
        setSelectedDateTime(formatISO(dateTime));
        setCompletedSteps((prev) => new Set([...prev, 'datetime']));
      }
    }
  }, [searchParams, contacts]);

  useEffect(() => {
    if (!loaderData.bookingProfile?.services) {
      setFilteredServices([]);
      return;
    }

    const services = loaderData.bookingProfile.services;
    if (!serviceSearch) {
      setFilteredServices(services);
      return;
    }

    const searchLower = serviceSearch.toLowerCase();
    const filtered = services
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => service.name.toLowerCase().includes(searchLower)),
      }))
      .filter((group) => group.services.length > 0);
    setFilteredServices(filtered);
  }, [serviceSearch, loaderData.bookingProfile]);

  const updateSessionParams = (contactId?: number, serviceIds?: number[], dateTime?: string | null) => {
    const params = new URLSearchParams(searchParams);
    const parts: string[] = [];

    const finalContactId = contactId ?? selectedContact?.id;
    const finalServiceIds = serviceIds ?? selectedServiceIds;
    const finalDateTime = dateTime !== undefined ? dateTime : selectedDateTime;

    if (finalContactId) parts.push(`contact_id:${finalContactId}`);
    if (finalServiceIds.length > 0) parts.push(`service_ids:${finalServiceIds.join(',')}`);
    if (finalDateTime) parts.push(`datetime:${finalDateTime}`);

    if (parts.length > 0) {
      params.set('appointment-session', parts.join('|'));
    } else {
      params.delete('appointment-session');
    }

    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const selectedServices =
    loaderData.bookingProfile?.services?.flatMap((group: GroupedServiceGroupDto) =>
      group.services.filter((service) => selectedServiceIds.includes(service.id)),
    ) || [];

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const isContactStepValid = selectedContact !== null;
  const isServicesStepValid = selectedServiceIds.length > 0;
  const isDateTimeStepValid = selectedDateTime !== null;
  const isFormValid = isContactStepValid && isServicesStepValid && isDateTimeStepValid;

  const isStepComplete = (step: WizardStep) => completedSteps.has(step);
  const isStepActive = (step: WizardStep) => currentStep === step;
  const getStepIndex = (step: WizardStep) => steps.findIndex((s) => s === step);

  const markStepComplete = (step: WizardStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < steps.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleSelectContact = (contact: ContactDto) => {
    setSelectedContact(contact);
    updateSessionParams(contact.id, selectedServiceIds, selectedDateTime);
    setTimeout(() => goToNextStep(), 200);
  };

  const handleSelectService = (serviceId: number) => {
    const newServiceIds = [...selectedServiceIds, serviceId];
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime);
  };

  const handleDeselectService = (serviceId: number) => {
    const newServiceIds = selectedServiceIds.filter((id) => id !== serviceId);
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime);
  };

  const handleSelectDateTime = (dateTime: Date) => {
    setSelectedDateTime(formatISO(dateTime));
    updateSessionParams(selectedContact?.id, selectedServiceIds, formatISO(dateTime));
    setTimeout(() => goToNextStep(), 200);
  };

  const handleContactPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('contact-page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const handleContactSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('contact-search', search);
    } else {
      params.delete('contact-search');
    }
    params.set('contact-page', '0');
    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const handleServiceSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('service-search', search);
    } else {
      params.delete('service-search');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date instanceof Date ? date : new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}t ${mins}m`;
    if (hours > 0) return `${hours}t`;
    return `${mins}m`;
  };

  const progressPercent = ((getStepIndex(currentStep) + 1) / steps.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      {/* Compact Header with Progress */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Steg {getStepIndex(currentStep) + 1} av {steps.length}
            </span>
            {isFormValid && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(totalDuration)}
              </Badge>
            )}
          </div>
          {isFormValid && <span className="text-sm font-bold">{formatPrice(totalPrice)}</span>}
        </div>
        <Progress value={progressPercent} className="h-1" />
      </Card>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-[1fr,280px] gap-3">
        <div className="space-y-2">
          {/* Step Cards - Compact Version */}
          <CompactStepCard
            title="Kunde"
            icon={User}
            step="contact"
            isActive={isStepActive('contact')}
            isComplete={isStepComplete('contact')}
            summary={selectedContact ? `${selectedContact.givenName} ${selectedContact.familyName}` : null}
            onEdit={() => goToStep('contact')}
            onClear={() => setSelectedContact(null)}
          >
            <ContactSelector
              contacts={contacts}
              selectedContactId={selectedContact?.id || null}
              onSelectContact={handleSelectContact}
              pagination={contactPagination}
              onPageChange={handleContactPageChange}
              onSearchChange={handleContactSearchChange}
              initialSearch={contactSearch}
            />
          </CompactStepCard>

          <CompactStepCard
            title="Tjenester"
            icon={Briefcase}
            step="services"
            isActive={isStepActive('services')}
            isComplete={isStepComplete('services')}
            summary={selectedServiceIds.length > 0 ? `${selectedServiceIds.length} valgt` : null}
            disabled={!selectedContact}
            onEdit={() => goToStep('services')}
            onClear={() => setSelectedServiceIds([])}
          >
            {selectedContact ? (
              loaderData.bookingProfile?.services.length ? (
                <div className="space-y-3">
                  <ServicesSelector
                    serviceGroups={filteredServices}
                    selectedServiceIds={selectedServiceIds}
                    onSelectService={handleSelectService}
                    onDeselectService={handleDeselectService}
                    onSearchChange={handleServiceSearchChange}
                    initialSearch={serviceSearch}
                  />
                  {selectedServiceIds.length > 0 && (
                    <Button onClick={goToNextStep} size="sm" className="w-full">
                      Fortsett
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Ingen tjenester tilgjengelige</p>
              )
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Velg kunde først</p>
            )}
          </CompactStepCard>

          <CompactStepCard
            title="Tidspunkt"
            icon={CalendarIcon}
            step="datetime"
            isActive={isStepActive('datetime')}
            isComplete={isStepComplete('datetime')}
            summary={selectedDateTime ? formatDateTime(selectedDateTime) : null}
            disabled={selectedServiceIds.length === 0}
            onEdit={() => goToStep('datetime')}
            onClear={() => setSelectedDateTime(null)}
          >
            {selectedServiceIds.length > 0 ? (
              <DateTimeSelector
                schedules={schedules}
                selectedDateTime={selectedDateTime ? new Date(selectedDateTime) : null}
                onSelectDateTime={handleSelectDateTime}
              />
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Velg tjenester først</p>
            )}
          </CompactStepCard>

          {/* Inline Review - Only shows when form is valid */}
          {isFormValid && isStepActive('review') && (
            <Card className="p-4 bg-accent/30 border-2 border-primary">
              <h3 className="text-sm font-bold mb-3">Bekreft booking</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Kunde</p>
                    <p className="font-medium">
                      {selectedContact?.givenName} {selectedContact?.familyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tidspunkt</p>
                    <p className="font-medium">{formatDateTime(selectedDateTime!)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tjenester</p>
                  <div className="space-y-1">
                    {selectedServices.map((service) => (
                      <div key={service.id} className="flex justify-between text-xs">
                        <span>{service.name}</span>
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {actionData?.error && (
            <Card className="p-3 border-destructive bg-destructive/10">
              <p className="text-xs text-destructive">
                <strong>Feil:</strong> {actionData.error}
              </p>
            </Card>
          )}
        </div>

        {/* Compact Sticky Sidebar */}
        <div className="lg:sticky lg:top-3 lg:self-start">
          <Card className="p-3 space-y-3">
            <div className="space-y-2">
              <SummaryRow
                icon={User}
                label="Kunde"
                value={selectedContact ? `${selectedContact.givenName} ${selectedContact.familyName}` : 'Velg kunde'}
                isEmpty={!selectedContact}
              />
              <SummaryRow
                icon={Briefcase}
                label="Tjenester"
                value={selectedServiceIds.length > 0 ? `${selectedServiceIds.length} valgt` : 'Ingen'}
                isEmpty={selectedServiceIds.length === 0}
              />
              <SummaryRow
                icon={CalendarIcon}
                label="Tid"
                value={selectedDateTime ? formatDateTime(selectedDateTime) : 'Ikke valgt'}
                isEmpty={!selectedDateTime}
              />
            </div>

            {selectedServiceIds.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(totalPrice)}</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(totalDuration)}</p>
                  </div>
                </div>
              </>
            )}

            <Form method="post" className="space-y-2 pt-2">
              <input type="hidden" name="contactId" value={selectedContact?.id || ''} />
              <input type="hidden" name="serviceIds" value={selectedServiceIds.join(',')} />
              <input type="hidden" name="startTime" value={selectedDateTime || ''} />

              <Button type="submit" disabled={!isFormValid} className="w-full" size="sm">
                Opprett time
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                size="sm"
                onClick={() => navigate('/company/booking/appointments')}
              >
                Avbryt
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Compact Step Card Component
interface CompactStepCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  step: WizardStep;
  isActive: boolean;
  isComplete: boolean;
  summary?: string | null;
  disabled?: boolean;
  onEdit: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

function CompactStepCard({
  title,
  icon: Icon,
  isActive,
  isComplete,
  summary,
  disabled,
  onEdit,
  onClear,
  children,
}: CompactStepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && cardRef.current) {
      // Smooth scroll with offset for better visibility
      const offset = 80; // Adjust this for your header height
      const elementPosition = cardRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, [isActive]);

  return (
    <Card
      ref={cardRef}
      className={cn('overflow-hidden transition-all', isActive && 'ring-2 ring-primary', disabled && 'opacity-50')}
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 flex items-center gap-2 text-left',
          'hover:bg-accent/50 transition-colors',
          !disabled && 'cursor-pointer',
          disabled && 'cursor-not-allowed',
        )}
      >
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            isComplete && 'bg-primary text-primary-foreground',
            !isComplete && 'bg-muted text-muted-foreground',
          )}
        >
          {isComplete ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {summary && <span className="text-xs text-muted-foreground truncate">{summary}</span>}
          </div>
        </div>

        {summary && onClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {!isActive && isComplete && <Edit2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
      </button>

      {isActive && (
        <div className="px-3 pb-3 pt-1 border-t animate-in slide-in-from-top-1 duration-200">{children}</div>
      )}
    </Card>
  );
}

// Compact Summary Row
interface SummaryRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isEmpty?: boolean;
}

function SummaryRow({ icon: Icon, label, value, isEmpty }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium truncate', isEmpty && 'text-muted-foreground italic')}>{value}</span>
    </div>
  );
}
