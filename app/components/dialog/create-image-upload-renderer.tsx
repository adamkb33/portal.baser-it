import type { FormFieldRenderProps } from '~/components/dialog/form-dialog';
import { Input } from '~/components/ui/input';
import { X } from 'lucide-react';

interface ImageData {
  file: File;
  previewUrl: string;
}

interface ImageUploadRendererProps extends FormFieldRenderProps<any> {
  accept?: string;
  maxHeight?: string;
  helperText?: string;
}

/**
 * Reusable image upload renderer for FormDialog
 *
 * @example
 * ```tsx
 * import { createImageUploadRenderer } from '~/components/renderers/image-upload-renderer';
 *
 * const renderImageUpload = createImageUploadRenderer({
 *   accept: 'image/*',
 *   maxHeight: 'h-48',
 *   helperText: 'Last opp et profilbilde...'
 * });
 *
 * // Use in FormDialog field
 * {
 *   name: 'image',
 *   label: 'Profilbilde',
 *   render: renderImageUpload,
 * }
 * ```
 */
export const createImageUploadRenderer = ({
  accept = 'image/*',
  maxHeight = 'h-48',
  helperText = 'Last opp et bilde.',
}: Partial<Omit<ImageUploadRendererProps, 'value' | 'onChange' | 'field' | 'error'>> = {}) => {
  return ({ value, onChange }: FormFieldRenderProps<any>) => {
    const imageData = value as ImageData | null;

    const handleFileChange = (file: File | null) => {
      if (!file) {
        onChange(null);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      onChange({ file, previewUrl });
    };

    const handleRemove = () => {
      if (imageData?.previewUrl) {
        URL.revokeObjectURL(imageData.previewUrl);
      }
      onChange(null);
    };

    return (
      <div className="space-y-3">
        {imageData?.previewUrl ? (
          <div className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Fjern bilde</span>
            </button>

            <img
              src={imageData.previewUrl}
              alt="Forhåndsvisning av profilbilde"
              className={`${maxHeight} w-full object-cover`}
            />

            <div className="border-t border-slate-200 bg-white p-2.5">
              <p className="text-xs text-slate-600">{imageData.file.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
            Ingen bilde valgt
          </div>
        )}

        <Input
          type="file"
          accept={accept}
          className="h-9 cursor-pointer text-xs"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  };
};

/**
 * Direct component version (alternative approach)
 */
export const ImageUploadRenderer = ({
  value,
  onChange,
  accept = 'image/*',
  maxHeight = 'h-48',
  helperText = 'Last opp et profilbilde som vises til bedriften når de administrerer bookingene dine.',
}: ImageUploadRendererProps) => {
  const imageData = value as ImageData | null;

  const handleFileChange = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const handleRemove = () => {
    if (imageData?.previewUrl) {
      URL.revokeObjectURL(imageData.previewUrl);
    }
    onChange(null);
  };

  return (
    <div className="space-y-3">
      {imageData?.previewUrl ? (
        <div className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Fjern bilde</span>
          </button>

          <img
            src={imageData.previewUrl}
            alt="Forhåndsvisning av profilbilde"
            className={`${maxHeight} w-full object-cover`}
          />

          <div className="border-t border-slate-200 bg-white p-2.5">
            <p className="text-xs text-slate-600">{imageData.file.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
          Ingen bilde valgt
        </div>
      )}

      <Input
        type="file"
        accept={accept}
        className="h-9 cursor-pointer text-xs"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
};
