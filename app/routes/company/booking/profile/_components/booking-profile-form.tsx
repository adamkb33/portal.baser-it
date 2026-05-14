import { useEffect, useMemo, useState } from 'react';
import { Form, NavLink, useNavigation } from 'react-router';
import { Briefcase, CalendarDays, Image as ImageIcon, PencilLine } from 'lucide-react';
import type { BookingProfileDto, DailyScheduleDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ServicesSelector } from '../../_components/services-selector';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Checkbox,
  CompanyPageTemplate,
  Input,
  Label,
  Notice,
  Text,
  Textarea,
} from '~/ui';

const DAY_LABELS: Record<DailyScheduleDto['dayOfWeek'], string> = {
  MONDAY: 'Mandag',
  TUESDAY: 'Tirsdag',
  WEDNESDAY: 'Onsdag',
  THURSDAY: 'Torsdag',
  FRIDAY: 'Fredag',
  SATURDAY: 'Lørdag',
  SUNDAY: 'Søndag',
};

const DAY_ORDER: DailyScheduleDto['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

type BookingProfileFormProps = {
  mode: 'create' | 'edit';
  bookingProfile: BookingProfileDto | null;
  groupedServiceGroups: GroupedServiceGroupDto[];
  loaderError: string | null;
};

export function BookingProfileForm({
  mode,
  bookingProfile,
  groupedServiceGroups,
  loaderError,
}: BookingProfileFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isEdit = mode === 'edit';

  const initialSelectedServiceIds = useMemo(
    () => bookingProfile?.services?.flatMap((group) => group.services.map((service) => service.id)) ?? [],
    [bookingProfile],
  );
  const initialSchedules = useMemo(() => bookingProfile?.dailySchedule ?? [], [bookingProfile]);

  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(initialSelectedServiceIds);
  const [dailySchedules, setDailySchedules] = useState<DailyScheduleDto[]>(initialSchedules);
  const [serviceSearch, setServiceSearch] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(bookingProfile?.image?.url ?? null);

  useEffect(() => {
    setSelectedServiceIds(initialSelectedServiceIds);
  }, [initialSelectedServiceIds]);

  useEffect(() => {
    setDailySchedules(initialSchedules);
  }, [initialSchedules]);

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl(removeImage ? null : bookingProfile?.image?.url ?? null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImageFile, removeImage, bookingProfile?.image?.url]);

  const filteredServiceGroups = useMemo(() => {
    if (!serviceSearch.trim()) {
      return groupedServiceGroups;
    }

    const searchLower = serviceSearch.toLowerCase();
    return groupedServiceGroups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => service.name.toLowerCase().includes(searchLower)),
      }))
      .filter((group) => group.services.length > 0);
  }, [groupedServiceGroups, serviceSearch]);

  const profileName =
    bookingProfile?.familyName && bookingProfile?.givenName
      ? `${bookingProfile.familyName} ${bookingProfile.givenName}`
      : 'Bookingprofil';

  return (
    <CompanyPageTemplate
      title={isEdit ? 'Rediger bookingprofil' : 'Opprett bookingprofil'}
      description="Bruk en dedikert ruteside for å oppdatere profil, tjenester og arbeidstider uten modal eller accordion-form."
      routeLinks={
        <>
          <NavLink
            to={ROUTES_MAP['company.booking.profile'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            Tilbake til bookingprofil
          </NavLink>
          <NavLink
            to={ROUTES_MAP['company.booking.schedule-unavailability'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            Mitt fravik
          </NavLink>
        </>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card variant="default" size="sm" className="bg-surface">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Profilstatus
                  </Text>
                  <Text as="p" variant="heading-md">
                    {isEdit ? 'Oppdatering' : 'Oppretting'}
                  </Text>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <PencilLine className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" size="sm" className="bg-surface">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Valgte tjenester
                  </Text>
                  <Text as="p" variant="heading-md">
                    {selectedServiceIds.length}
                  </Text>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10">
                  <Briefcase className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" size="sm" className="bg-surface">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Arbeidsdager
                  </Text>
                  <Text as="p" variant="heading-md">
                    {dailySchedules.length}
                  </Text>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <Form method="post" encType="multipart/form-data" className="space-y-3">
        {loaderError ? <Notice tone="emphasis" title="Kunne ikke hente data" message={loaderError} /> : null}

        <Accordion type="multiple" defaultValue={['profile', 'services', 'schedule']} className="space-y-2">
          <AccordionItem value="profile">
            <AccordionTrigger>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface">
                  <ImageIcon className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="space-y-0.5">
                  <Text as="p" variant="heading-sm">
                    Profil
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Beskrivelse og profilbilde
                  </Text>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 space-y-0.5">
                    <Text as="p" variant="label" className="text-text-primary">
                      Profilbilde
                    </Text>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      Last opp eller fjern bildet som vises i bookingprofilen.
                    </Text>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface">
                      {imagePreviewUrl ? (
                        <img src={imagePreviewUrl} alt={profileName} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-text-secondary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        id="imageFile"
                        name="imageFile"
                        type="file"
                        accept="image/*"
                        className="text-sm"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] ?? null;
                          setSelectedImageFile(file);
                          if (file) {
                            setRemoveImage(false);
                          }
                        }}
                      />

                      {bookingProfile?.image?.id ? (
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                          <Checkbox
                            checked={removeImage}
                            onCheckedChange={(checked) => {
                              setRemoveImage(checked);
                              if (checked) {
                                setSelectedImageFile(null);
                              }
                            }}
                          />
                          Fjern eksisterende profilbilde ved lagring
                        </label>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 space-y-0.5">
                    <Text as="p" variant="label" className="text-text-primary">
                      Beskrivelse
                    </Text>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      Gi kundene et kort inntrykk av hva du tilbyr.
                    </Text>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    size="sm"
                    defaultValue={bookingProfile?.description ?? ''}
                    placeholder="Fortell kunder om dine spesialiteter, arbeidsområder eller andre relevante detaljer."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="services">
            <AccordionTrigger>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface">
                  <Briefcase className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="space-y-0.5">
                  <Text as="p" variant="heading-sm">
                    Tjenester
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    {selectedServiceIds.length} valgt
                  </Text>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-2 space-y-0.5">
                  <Text as="p" variant="label" className="text-text-primary">
                    Tjenestevalg
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Velg tjenestene som skal vises i bookingprofilen.
                  </Text>
                </div>
                <ServicesSelector
                  compact
                  serviceGroups={filteredServiceGroups}
                  selectedServiceIds={selectedServiceIds}
                  onSelectService={(serviceId) =>
                    setSelectedServiceIds((current) => (current.includes(serviceId) ? current : [...current, serviceId]))
                  }
                  onDeselectService={(serviceId) =>
                    setSelectedServiceIds((current) => current.filter((currentId) => currentId !== serviceId))
                  }
                  onSearchChange={setServiceSearch}
                  initialSearch={serviceSearch}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="schedule">
            <AccordionTrigger>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface">
                  <CalendarDays className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="space-y-0.5">
                  <Text as="p" variant="heading-sm">
                    Arbeidstider
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    {dailySchedules.length} aktive dager
                  </Text>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-2 space-y-0.5">
                  <Text as="p" variant="label" className="text-text-primary">
                    Tilgjengelighet
                  </Text>
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Sett opp hvilke dager og tider som skal kunne bookes.
                  </Text>
                </div>
                <DailyScheduleEditor schedules={dailySchedules} onChange={setDailySchedules} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {selectedServiceIds.map((serviceId) => (
          <input key={serviceId} type="hidden" name="services[]" value={serviceId} />
        ))}
        <input type="hidden" name="dailySchedules" value={JSON.stringify(dailySchedules)} />
        <input type="hidden" name="existingImageId" value={bookingProfile?.image?.id ?? ''} />
        <input type="hidden" name="removeImage" value={removeImage ? 'true' : 'false'} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <NavLink
            to={ROUTES_MAP['company.booking.profile'].href}
            className="inline-flex h-10 items-center justify-center rounded-sm border border-border bg-background px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            Avbryt
          </NavLink>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Lagrer...' : isEdit ? 'Lagre endringer' : 'Opprett bookingprofil'}
          </Button>
        </div>
      </Form>
    </CompanyPageTemplate>
  );
}

function DailyScheduleEditor({
  schedules,
  onChange,
}: {
  schedules: DailyScheduleDto[];
  onChange: (nextSchedules: DailyScheduleDto[]) => void;
}) {
  const activeDays = useMemo(() => new Set(schedules.map((schedule) => schedule.dayOfWeek)), [schedules]);

  const setStandardHours = () => {
    onChange([
      { id: 0, dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '17:00:00' },
      { id: 0, dayOfWeek: 'TUESDAY', startTime: '09:00:00', endTime: '17:00:00' },
      { id: 0, dayOfWeek: 'WEDNESDAY', startTime: '09:00:00', endTime: '17:00:00' },
      { id: 0, dayOfWeek: 'THURSDAY', startTime: '09:00:00', endTime: '17:00:00' },
      { id: 0, dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '17:00:00' },
    ]);
  };

  const toggleDay = (dayOfWeek: DailyScheduleDto['dayOfWeek']) => {
    if (activeDays.has(dayOfWeek)) {
      onChange(schedules.filter((schedule) => schedule.dayOfWeek !== dayOfWeek));
      return;
    }

    onChange([...schedules, { id: 0, dayOfWeek, startTime: '09:00:00', endTime: '17:00:00' }]);
  };

  const updateTime = (dayOfWeek: DailyScheduleDto['dayOfWeek'], field: 'startTime' | 'endTime', value: string) => {
    onChange(
      schedules.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek
          ? {
              ...schedule,
              [field]: value.length === 5 ? `${value}:00` : value,
            }
          : schedule,
      ),
    );
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" size="sm" onClick={setStandardHours}>
          Sett standardtimer
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clearAll} disabled={schedules.length === 0}>
          Fjern alle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {DAY_ORDER.map((dayOfWeek) => {
          const schedule = schedules.find((current) => current.dayOfWeek === dayOfWeek);
          const checked = activeDays.has(dayOfWeek);
          const startTime = schedule?.startTime.slice(0, 5) ?? '09:00';
          const endTime = schedule?.endTime.slice(0, 5) ?? '17:00';

          return (
            <div key={dayOfWeek} className="rounded-md border border-border bg-background p-2.5">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Checkbox checked={checked} onCheckedChange={() => toggleDay(dayOfWeek)} />
                  {DAY_LABELS[dayOfWeek]}
                </label>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  {checked ? 'Aktiv' : 'Ikke aktiv'}
                </Text>
              </div>

              {checked ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`${dayOfWeek}-start`}>Fra</Label>
                    <Input
                      id={`${dayOfWeek}-start`}
                      type="time"
                      className="h-9 text-sm"
                      value={startTime}
                      onChange={(event) => updateTime(dayOfWeek, 'startTime', event.currentTarget.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${dayOfWeek}-end`}>Til</Label>
                    <Input
                      id={`${dayOfWeek}-end`}
                      type="time"
                      className="h-9 text-sm"
                      value={endTime}
                      onChange={(event) => updateTime(dayOfWeek, 'endTime', event.currentTarget.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
