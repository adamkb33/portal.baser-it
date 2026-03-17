import { useEffect, useState } from 'react';
import { Form, useNavigate, useNavigation, useSubmit } from 'react-router';
import { Check, ChevronsUpDown } from 'lucide-react';
import { fileToBase64 } from '~/lib/file.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ImagesField, type ImageField } from '~/routes/company/_components/images-field';
import {
  Button,
  CompanyFormPageTemplate,
  FormField,
  Notice,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  cn,
} from '~/ui';

export type ServiceOption = {
  id: number;
  name: string;
};

export type ServiceFormValues = {
  id?: number;
  name: string;
  serviceGroupId: number;
  price: number;
  duration: number;
  images: ImageField[];
};

type ServiceFormPageProps = {
  mode: 'create' | 'edit';
  values: ServiceFormValues;
  serviceGroups: ServiceOption[];
  actionData?: {
    error?: string;
    values?: Omit<ServiceFormValues, 'images'>;
  } | null;
};

export function ServiceFormPage({ mode, values, serviceGroups, actionData }: ServiceFormPageProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === 'submitting';
  const isEdit = mode === 'edit';
  const currentValues = actionData?.values
    ? { ...values, ...actionData.values, images: values.images }
    : values;
  const [serviceGroupId, setServiceGroupId] = useState(String(currentValues.serviceGroupId));
  const [images, setImages] = useState<ImageField[]>(currentValues.images);
  const [isServiceGroupPopoverOpen, setIsServiceGroupPopoverOpen] = useState(false);

  useEffect(() => {
    setServiceGroupId(String(currentValues.serviceGroupId));
  }, [currentValues.serviceGroupId]);

  useEffect(() => {
    setImages(currentValues.images);
  }, [currentValues.images]);

  const selectedServiceGroup =
    serviceGroups.find((serviceGroup) => String(serviceGroup.id) === serviceGroupId) ?? null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const htmlForm = event.currentTarget;
    const formData = new FormData(htmlForm);
    formData.set('serviceGroupId', serviceGroupId);

    const imagesToDelete = images.filter((image) => image.pendingDeletion && image.id).map((image) => image.id!);
    for (const imageId of imagesToDelete) {
      formData.append('deleteImageIds', String(imageId));
    }

    const imagesToUpload = images.filter((image) => image.file && !image.pendingDeletion);

    for (const [index, image] of imagesToUpload.entries()) {
      const base64 = await fileToBase64(image.file!);
      formData.append(`images[${index}][fileName]`, image.file!.name);
      formData.append(`images[${index}][contentType]`, image.file!.type || 'application/octet-stream');
      formData.append(`images[${index}][label]`, image.label ?? '');
      formData.append(`images[${index}][data]`, base64);
    }

    submit(formData, { method: 'post' });
  };

  return (
    <CompanyFormPageTemplate
      title={isEdit ? 'Rediger tjeneste' : 'Ny tjeneste'}
      description="Bruk samme kompakte ruteside for tjenestedata som resten av bookingadministrasjonen."
      backLink={{ to: ROUTES_MAP['company.booking.admin.service-groups.services'].href, label: 'Tilbake til tjenester' }}
      notices={actionData?.error ? <Notice tone="emphasis" title="Kunne ikke lagre tjeneste" message={actionData.error} /> : null}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES_MAP['company.booking.admin.service-groups.services'].href)}
          >
            Avbryt
          </Button>
          <Button type="submit" form="service-form" loading={isSubmitting}>
            {isEdit ? 'Lagre endringer' : 'Opprett tjeneste'}
          </Button>
        </>
      }
    >
      <Form id="service-form" method="post" onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="intent" value={isEdit ? 'update' : 'create'} />
        {currentValues.id ? <input type="hidden" name="id" value={currentValues.id} /> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Navn
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Dette navnet vises for kunder og ansatte i bookingløpet.
            </Text>
            <FormField name="name" defaultValue={currentValues.name} placeholder="Skriv inn navn" />
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Tjenestegruppe
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Knyt tjenesten til riktig gruppe for filtrering og oversikt.
            </Text>
            <Popover open={isServiceGroupPopoverOpen} onOpenChange={setIsServiceGroupPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between bg-background font-normal"
                >
                  <span className={cn(!selectedServiceGroup && 'text-text-secondary')}>
                    {selectedServiceGroup?.name ?? 'Velg tjenestegruppe'}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
                <div className="space-y-1">
                  {serviceGroups.map((serviceGroup) => {
                    const isSelected = String(serviceGroup.id) === serviceGroupId;

                    return (
                      <button
                        key={serviceGroup.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm transition-colors',
                          isSelected ? 'bg-surface text-text-primary' : 'text-text-primary hover:bg-surface',
                        )}
                        onClick={() => {
                          setServiceGroupId(String(serviceGroup.id));
                          setIsServiceGroupPopoverOpen(false);
                        }}
                      >
                        <span>{serviceGroup.name}</span>
                        {isSelected ? <Check className="h-4 w-4 text-interactive" /> : null}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Pris
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Oppgis i kroner og brukes direkte i bookingoversikten.
            </Text>
            <FormField name="price" type="number" min={0} defaultValue={String(currentValues.price)} placeholder="0" />
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Varighet
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Antall minutter som blokkeres i kalenderen.
            </Text>
            <FormField name="duration" type="number" min={1} defaultValue={String(currentValues.duration)} placeholder="30" />
          </div>
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <Text as="p" variant="label" className="text-text-primary">
            Bilder
          </Text>
          <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
            Administrer bilder på samme side. Endringer lagres sammen med resten av tjenesten.
          </Text>
          <ImagesField images={images} onChange={setImages} />
        </div>
      </Form>
    </CompanyFormPageTemplate>
  );
}
