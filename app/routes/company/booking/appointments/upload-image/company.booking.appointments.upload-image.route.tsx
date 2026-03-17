import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { data, Link, useNavigation, useSubmit } from 'react-router';
import { Camera, Image as ImageIcon, Move, ZoomIn } from 'lucide-react';
import { CompanyUserAppointmentController, PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { fileToBase64 } from '~/lib/file.utils';
import type { Route } from './+types/company.booking.appointments.upload-image.route';
import { Badge, Button, Card, CardContent, CompanyPageTemplate, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Notice, Text } from '~/ui';

const EDITOR_SIZE = 240;
const OUTPUT_SIZE = 1024;

const parseAppointmentIdFromUrl = (url: string): number | null => {
  const value = new URL(url).searchParams.get('id');
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

export async function loader({ request }: Route.LoaderArgs) {
  const appointmentId = parseAppointmentIdFromUrl(request.url);

  if (!appointmentId) {
    return data(
      {
        appointmentId: null,
        appointment: null,
        error: 'Mangler eller ugyldig avtale-ID.',
      },
      { status: 400 },
    );
  }

  try {
    const response = await withAuth(request, async () =>
      PublicAppointmentSessionController.getAppointmentById({
        query: { appointmentId },
      }),
    );

    return data({
      appointmentId,
      appointment: response.data?.data ?? null,
      error: null,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente avtaledetaljer');
    return data(
      {
        appointmentId,
        appointment: null,
        error: message,
      },
      { status: 400 },
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  const appointmentId = parseAppointmentIdFromUrl(request.url);

  if (!appointmentId) {
    return data({ success: false, message: 'Mangler eller ugyldig avtale-ID.' }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'upload');

  if (intent === 'delete-image') {
    const imageId = Number(formData.get('imageId'));

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return data({ success: false, message: 'Ugyldig bilde-ID.' }, { status: 400 });
    }

    try {
      await withAuth(request, async () =>
        CompanyUserAppointmentController.deleteAppointmentImage({
          path: {
            id: appointmentId,
            imageId,
          },
        }),
      );

      return data({ success: true, message: 'Bildet ble fjernet.', intent: 'delete-image' });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke fjerne bilde');
      return data({ success: false, message, intent: 'delete-image' }, { status: 400 });
    }
  }

  const fileName = String(formData.get('fileName') ?? '').trim();
  const contentType = String(formData.get('contentType') ?? '').trim();
  const dataValue = String(formData.get('data') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();

  if (!fileName || !contentType || !dataValue) {
    return data({ success: false, message: 'Velg et bilde og juster det før opplasting.' }, { status: 400 });
  }

  try {
    await withAuth(request, async () =>
      CompanyUserAppointmentController.uploadAppointmentImage({
        path: { id: appointmentId },
        body: {
          image: {
            fileName,
            contentType,
            data: dataValue,
            label,
          },
        },
      }),
    );

    return data({ success: true, message: 'Bildet ble lastet opp.', intent: 'upload' });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke laste opp bilde');
    return data({ success: false, message, intent: 'upload' }, { status: 400 });
  }
}

type ImageMeta = {
  naturalWidth: number;
  naturalHeight: number;
};

export default function CompanyBookingAppointmentUploadImagePage({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === 'submitting';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [label, setLabel] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ url: string; label: string; size: number } | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const appointment = loaderData.appointment;
  const selectedServiceNames = useMemo(
    () =>
      appointment?.groupedServiceGroups
        ?.flatMap((group) => (group.services ?? []).map((service) => service.name))
        .filter(Boolean) ?? [],
    [appointment],
  );
  const existingImages = appointment?.images ?? [];
  const submittingIntent = navigation.formData?.get('intent')?.toString();
  const deletingImageId =
    navigation.state === 'submitting' && submittingIntent === 'delete-image'
      ? Number(navigation.formData?.get('imageId'))
      : null;

  const previewSize = useMemo(() => {
    if (!imageMeta) return null;
    const fit = Math.min(EDITOR_SIZE / imageMeta.naturalWidth, EDITOR_SIZE / imageMeta.naturalHeight);
    return {
      width: imageMeta.naturalWidth * fit,
      height: imageMeta.naturalHeight * fit,
    };
  }, [imageMeta]);

  const placementHint = useMemo(() => {
    const normalizedDistance = Math.hypot(offset.x / EDITOR_SIZE, offset.y / EDITOR_SIZE);
    if (normalizedDistance < 0.06) return 'Bra plassering nær midten';
    if (normalizedDistance < 0.14) return 'Litt ute av midten - dra bildet litt for å sentrere hodet';
    return 'Flytt bildet nærmere midten for bedre plassering';
  }, [offset]);

  const setNewFile = (file: File | null) => {
    if (!file) return;

    setSelectedFile(file);
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setImageMeta(null);

    const url = URL.createObjectURL(file);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(url);

    const image = new Image();
    image.onload = () => {
      setImageMeta({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      });
    };
    image.src = url;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!imagePreviewUrl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    setOffset({
      x: dragStateRef.current.originX + deltaX,
      y: dragStateRef.current.originY + deltaY,
    });
  };

  const handlePointerUp = () => {
    dragStateRef.current = null;
  };

  const resetEditor = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageMeta(null);
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setLabel('');
  };

  useEffect(() => {
    if (actionData?.success && 'intent' in actionData && actionData.intent === 'upload') {
      resetEditor();
    }
  }, [actionData]);

  const handleUpload = async () => {
    if (!selectedFile || !imageMeta) return;

    const normalizedFile = await renderNormalizedImage({
      file: selectedFile,
      imageMeta,
      scale,
      offset,
      editorSize: EDITOR_SIZE,
      outputSize: OUTPUT_SIZE,
      appointmentId: loaderData.appointmentId,
    });

    const encoded = await fileToBase64(normalizedFile);
    const formData = new FormData();
    formData.append('intent', 'upload');
    formData.append('fileName', normalizedFile.name);
    formData.append('contentType', normalizedFile.type || 'image/jpeg');
    formData.append('data', encoded);
    formData.append('label', label);

    submit(formData, { method: 'post' });
  };

  const handleDeleteImage = (imageId: number) => {
    const formData = new FormData();
    formData.append('intent', 'delete-image');
    formData.append('imageId', String(imageId));
    submit(formData, { method: 'post' });
  };

  return (
    <CompanyPageTemplate
      title="Last opp avtalebilder"
      description="Ta bilde med kamera eller last opp eksisterende bilde, og flytt/zoom for å få hodet nær midten."
      routeLinks={
        <Link
          to={ROUTES_MAP['company.booking.appointments'].href}
          className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
        >
          Tilbake til timebestillinger
        </Link>
      }
    >
      {loaderData.error ? <Notice tone="emphasis" title="Kunne ikke hente avtale" message={loaderData.error} /> : null}

      {appointment ? (
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface via-background to-surface p-3 sm:p-4">
          <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-primary/10 blur-xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-secondary/10 blur-xl" />
          <div className="relative grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-2">
              <Badge variant="outline" size="sm" className="rounded-full">
                Avtaledetaljer
              </Badge>
              <Text as="p" variant="heading-sm" className="tracking-tight">
                {appointment.user.givenName} {appointment.user.familyName}
              </Text>
              <Text as="p" variant="caption" className="text-text-secondary">
                {new Date(appointment.startTime).toLocaleString('nb-NO')} - {new Date(appointment.endTime).toLocaleTimeString('nb-NO')}
              </Text>
            </div>

            <div className="space-y-1.5">
              <Text as="p" variant="caption" className="font-semibold">
                Tjenester
              </Text>
              {selectedServiceNames.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedServiceNames.map((serviceName, index) => (
                    <Badge key={`${serviceName}-${index}`} variant="outline" size="sm" className="rounded-full">
                      {serviceName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Ingen tjenester registrert
                </Text>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Text as="p" variant="label">
                  Opplastede Bilder
                </Text>
                <Text as="p" variant="caption" className="text-text-secondary">
                  Kompakt liste. Dra horisontalt for å se flere bilder.
                </Text>
              </div>
              {existingImages.length > 0 ? (
                <Badge variant="outline" size="sm" className="rounded-full">
                  {existingImages.length} bilder
                </Badge>
              ) : null}
            </div>

            {existingImages.length === 0 ? (
              <div className="rounded-lg bg-surface p-3 text-xs text-text-secondary">
                Ingen bilder lastet opp ennå.
              </div>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-max gap-2">
                  {existingImages.map((image, index) => (
                    <article key={image.id ?? `${image.url}-${index}`} className="w-[110px] shrink-0 overflow-hidden rounded-lg bg-surface">
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() =>
                          setSelectedPreviewImage({
                            url: image.url,
                            label: image.label || `Bilde ${index + 1}`,
                            size: image.size,
                          })
                        }
                      >
                        <div className="h-[92px] w-full overflow-hidden bg-background">
                          <img
                            src={image.url}
                            alt={image.label || `Avtalebilde ${index + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </div>
                      </button>
                      <div className="space-y-1 p-2">
                        <Text as="p" variant="caption" className="truncate font-semibold">
                          {image.label || `Bilde ${index + 1}`}
                        </Text>
                        <Text as="p" variant="caption" className="text-[10px] text-text-secondary">
                          {(image.size / 1024).toFixed(0)} KB
                        </Text>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 w-full px-2 text-[10px]"
                          disabled={!image.id || deletingImageId === image.id}
                          loading={deletingImageId === image.id}
                          onClick={() => {
                            if (!image.id) return;
                            handleDeleteImage(image.id);
                          }}
                        >
                          Fjern
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-12">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="space-y-1">
              <Text as="p" variant="label">
                Last Opp Nye Bilder
              </Text>
              <Text as="p" variant="caption" className="text-text-secondary">
                Kamera eller filopplasting. Flytt og zoom bildet så hodet havner i midten av guiden.
              </Text>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary hover:bg-surface">
                <Camera className="h-3.5 w-3.5" />
                Ta bilde
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => setNewFile(event.currentTarget.files?.[0] ?? null)}
                />
              </label>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-primary hover:bg-surface">
                <ImageIcon className="h-3.5 w-3.5" />
                Last opp bilde
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setNewFile(event.currentTarget.files?.[0] ?? null)}
                />
              </label>

              {selectedFile ? (
                <Button variant="outline" size="sm" type="button" onClick={resetEditor}>
                  Fjern valgt bilde
                </Button>
              ) : null}
            </div>

            {imagePreviewUrl && previewSize ? (
              <div className="space-y-2">
                <div
                  className="relative mx-auto touch-none overflow-hidden rounded-xl bg-black shadow-inner"
                  style={{ width: EDITOR_SIZE, height: EDITOR_SIZE }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img
                    src={imagePreviewUrl}
                    alt="Forhåndsvisning"
                    onDragStart={(event) => event.preventDefault()}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                    style={{
                      width: previewSize.width * scale,
                      height: previewSize.height * scale,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    }}
                  />

                  <div className="pointer-events-none absolute inset-0 border border-white/25" />
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/80"
                    aria-hidden
                  />
                </div>

                <Text as="p" variant="caption" className="text-text-secondary">
                  {placementHint}
                </Text>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-text-primary" htmlFor="zoom-range">
                      <ZoomIn className="h-3.5 w-3.5" /> Zoom
                    </label>
                    <input
                      id="zoom-range"
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={scale}
                      onChange={(event) => setScale(Number(event.currentTarget.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="flex items-center gap-1.5 text-xs font-medium text-text-primary"
                      htmlFor="image-label"
                    >
                      <Move className="h-3.5 w-3.5" /> Bildetekst (valgfritt)
                    </label>
                    <Input
                      id="image-label"
                      type="text"
                      placeholder="f.eks. Sideprofil"
                      value={label}
                      onChange={(event) => setLabel(event.currentTarget.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    loading={isSubmitting}
                    disabled={isSubmitting || !selectedFile || !imageMeta}
                  >
                    Last opp bilde
                  </Button>
                </div>
              </div>
            ) : imagePreviewUrl ? (
              <Text as="p" variant="caption" className="text-text-secondary">
                Klargjør bilde...
              </Text>
            ) : (
              <Text as="p" variant="caption" className="text-text-secondary">
                Velg et bilde for å starte justering.
              </Text>
            )}

            {actionData?.message ? (
              <Notice
                tone={actionData.success ? 'default' : 'emphasis'}
                title={actionData.success ? 'Opplasting fullført' : 'Opplasting feilet'}
                message={actionData.message}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPreviewImage} onOpenChange={(open) => !open && setSelectedPreviewImage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPreviewImage?.label ?? 'Forhåndsvisning'}</DialogTitle>
            <DialogDescription>
              {selectedPreviewImage ? `${(selectedPreviewImage.size / 1024).toFixed(0)} KB` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedPreviewImage ? (
            <div className="overflow-hidden rounded-lg bg-background">
              <img
                src={selectedPreviewImage.url}
                alt={selectedPreviewImage.label}
                className="max-h-[72vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </CompanyPageTemplate>
  );
}

type RenderNormalizedImageArgs = {
  file: File;
  imageMeta: ImageMeta;
  scale: number;
  offset: { x: number; y: number };
  editorSize: number;
  outputSize: number;
  appointmentId: number | null;
};

async function renderNormalizedImage({
  file,
  imageMeta,
  scale,
  offset,
  editorSize,
  outputSize,
  appointmentId,
}: RenderNormalizedImageArgs): Promise<File> {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Kunne ikke opprette tegneflate for bildebehandling.');
    }

    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, outputSize, outputSize);

    const fitRatio = Math.min(outputSize / imageMeta.naturalWidth, outputSize / imageMeta.naturalHeight);
    const drawWidth = imageMeta.naturalWidth * fitRatio * scale;
    const drawHeight = imageMeta.naturalHeight * fitRatio * scale;

    const centerX = outputSize / 2 + (offset.x * outputSize) / editorSize;
    const centerY = outputSize / 2 + (offset.y * outputSize) / editorSize;

    const x = centerX - drawWidth / 2;
    const y = centerY - drawHeight / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Kunne ikke kode bildet.'));
            return;
          }
          resolve(result);
        },
        'image/jpeg',
        0.88,
      );
    });

    const fileName = `appointment-${appointmentId ?? 'image'}-${Date.now()}.jpg`;
    return new File([blob], fileName, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Kunne ikke lese bildet.'));
    image.src = url;
  });
}
