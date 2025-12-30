import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { X, Undo2 } from 'lucide-react';

export type ImageField = {
  id?: number;
  file: File | null;
  label: string;
  previewUrl?: string;
  pendingDeletion?: boolean;
};

type ImagesFieldProps = {
  images: ImageField[];
  onChange: (images: ImageField[]) => void;
};

export function ImagesField({ images, onChange }: ImagesFieldProps) {
  const updateImageAt = (index: number, patch: Partial<ImageField>) => {
    const next = images.map((img, i) => (i === index ? { ...img, ...patch } : img));
    onChange(next);
  };

  const addImage = () => {
    onChange([
      ...images,
      {
        id: undefined,
        file: null,
        label: '',
        previewUrl: undefined,
      },
    ]);
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];

    // If removing an existing image (has id), mark it for deletion instead of removing
    if (imageToRemove?.id) {
      const next = images.map((img, i) => (i === index ? { ...img, pendingDeletion: true } : img));
      onChange(next);
    } else {
      // New image without ID - remove it completely
      const next = images.filter((_, i) => i !== index);
      onChange(next);
    }
  };

  const undoDelete = (index: number) => {
    const next = images.map((img, i) => (i === index ? { ...img, pendingDeletion: false } : img));
    onChange(next);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) {
      updateImageAt(index, { file: null, previewUrl: undefined });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateImageAt(index, { file, previewUrl });
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => {
            const isExisting = !!img.id && !img.file;
            const hasPreview = !!img.previewUrl;

            return (
              <div
                key={img.id ?? index}
                className={`group relative overflow-hidden rounded-md border-2 transition-all ${
                  img.pendingDeletion ? 'border-red-500 bg-red-50 opacity-60' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {img.pendingDeletion ? (
                  <>
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/70 p-4">
                      <Badge variant="destructive" className="text-sm font-semibold">
                        Slettes ved lagring
                      </Badge>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => undoDelete(index)}
                        className="gap-2"
                      >
                        <Undo2 className="h-3 w-3" />
                        Angre
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-2 ring-white transition hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fjern bilde</span>
                  </button>
                )}

                {hasPreview ? (
                  <div className="relative">
                    <img
                      src={img.previewUrl}
                      alt={img.label || 'Forhåndsvisning av bilde'}
                      className="h-32 w-full object-cover"
                    />
                    {isExisting && !img.pendingDeletion && (
                      <div className="absolute bottom-1 left-1">
                        <Badge variant="secondary" className="text-xs">
                          Eksisterende
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center text-xs text-slate-400">
                    Ingen bilde valgt
                  </div>
                )}

                <div className="space-y-2 border-t border-slate-200 bg-white p-2.5">
                  {!isExisting && !img.pendingDeletion && (
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-8 cursor-pointer text-xs"
                      onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                    />
                  )}
                  <Input
                    type="text"
                    placeholder="Bildetekst / label"
                    value={img.label}
                    onChange={(e) => updateImageAt(index, { label: e.target.value })}
                    className="h-8 text-xs"
                    disabled={isExisting || img.pendingDeletion}
                  />
                  {isExisting && !img.pendingDeletion && (
                    <p className="text-xs text-muted-foreground">Eksisterende bilde - klikk X for å fjerne</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button type="button" variant="outline" onClick={addImage} className="h-9 border-dashed text-xs font-medium">
        + Legg til bilde
      </Button>
    </div>
  );
}
