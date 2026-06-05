import { Form, useLoaderData, useNavigation } from 'react-router';
import {
  BookingStepTemplate,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Grid,
  Panel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  cn,
} from '~/ui';
import { BookingBottomActionBar } from '~/routes/_features/booking/_components/bottom-nav';
import type { createBookingEmployeeLoader } from './booking.employee.loader';

export function BookingEmployeePage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingEmployeeLoader>>();
  const profiles = loaderData.profiles ?? [];
  const selectedProfileId = loaderData.selectedProfileId;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const submittingProfileId = navigation.formData?.get('selectedProfileId');

  return (
    <BookingStepTemplate
      label="Velg behandler"
      title="Hvem skal vi bestille avtalen på?"
      description={
        selectedProfileId
          ? 'Du har allerede valgt en frisør. Du kan endre valget eller fortsette.'
          : 'Velg en frisør for å fortsette med timebestilling'
      }
    >
      <Grid columns={2}>
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;
          const isSubmittingProfile =
            isSubmitting && submittingProfileId !== null && String(profile.id) === String(submittingProfileId);

          return (
            <Card
              key={profile.id}
              variant="default"
              className={cn(
                'group flex h-full min-h-64 flex-col border-border bg-surface-variant-1 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-interactive',
                isSelected
                  ? 'border-interactive bg-surface-primary-subtle ring-2 ring-interactive/35'
                  : 'hover:border-interactive/20 hover:bg-surface',
                isSubmittingProfile && 'opacity-80',
              )}
            >
              <CardHeader>
                {isSelected ? (
                  <Text as="p" variant="overline" className="text-interactive">
                    Valgt behandler
                  </Text>
                ) : null}
                <div className="flex min-h-20 items-start gap-3 rounded-md border border-border bg-surface-variant-2 p-3">
                  {profile.image ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
                      <img
                        src={profile.image.url}
                        alt={`${profile.givenName} ${profile.familyName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-text-primary">
                      {profile.givenName} {profile.familyName}
                    </CardTitle>
                    {profile.description ? (
                      <Text className="mt-1 text-text-secondary">{profile.description}</Text>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                {profile.services.length > 0 && (
                  <div className="rounded-md border border-border bg-surface-variant-1 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                        Tjenester
                      </Text>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs hover:bg-background"
                          >
                            Vis alle
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 border-border bg-surface p-4">
                          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                            {profile.services.map((group) => (
                              <div
                                key={group.id}
                                className="space-y-2 rounded-md border border-border bg-surface-variant-1 p-3"
                              >
                                <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                  {group.name}
                                </div>
                                <div className="space-y-2">
                                  {group.services.map((service) => (
                                    <div
                                      key={service.id}
                                      className="flex items-baseline justify-between gap-2 rounded-sm bg-surface-variant-2 px-2 py-1.5"
                                    >
                                      <span className="text-sm text-text-primary">{service.name}</span>
                                      <div className="flex flex-shrink-0 items-baseline gap-2">
                                        <span className="text-xs text-text-secondary">{service.duration} min</span>
                                        <span className="text-sm font-medium text-text-primary">
                                          {service.price} kr
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      {profile.services.reduce((sum, group) => sum + group.services.length, 0)} tjenester tilgjengelig
                    </Text>
                  </div>
                )}
              </CardContent>

              <CardFooter className="mt-auto border-t border-border bg-surface-variant-2 p-3">
                {isSelected ? (
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    disabled
                    className="gap-2 border-interactive/40 bg-background text-text-primary"
                  >
                    Valgt
                  </Button>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="selectedProfileId" value={profile.id} />
                    <Button
                      type="submit"
                      fullWidth
                      loading={isSubmittingProfile}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      Velg {profile.givenName}
                    </Button>
                  </Form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </Grid>
      <BookingBottomActionBar
        actions={[
          {
            id: 'back',
            type: 'link',
            to: loaderData.navigation.contact,
            label: 'Tilbake',
            variant: 'secondary',
          },
          {
            id: 'continue',
            type: 'link',
            to: loaderData.navigation.selectServices,
            label: selectedProfileId ? 'Fortsett' : 'Velg behandler',
            variant: 'primary',
            disabled: !selectedProfileId,
          },
        ]}
        compact
      />
    </BookingStepTemplate>
  );
}
