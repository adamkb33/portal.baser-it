// components/dialog/create-image-upload-renderer.tsx
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
  existingImageUrl?: string | null;
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
 *   helperText: 'Last opp et profilbilde...',
 *   existingImageUrl: user.profileImageUrl
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
  existingImageUrl = null,
}: Partial<Omit<ImageUploadRendererProps, 'value' | 'onChange' | 'field' | 'error'>> = {}) => {
  return ({ value, onChange }: FormFieldRenderProps<any>) => {
    const imageData = value as ImageData | null;

    // Use new upload preview if available, otherwise show existing image
    const previewUrl = imageData?.previewUrl || existingImageUrl;
    const isNewUpload = Boolean(imageData?.file);

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
        {previewUrl ? (
          <div className="border border-border bg-muted p-2">
            <div className="relative">
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -right-2 -top-2 border border-border bg-background p-1 text-foreground hover:bg-foreground hover:text-background transition-colors"
                aria-label="Fjern bilde"
              >
                <X className="h-3 w-3" />
              </button>

              <img
                src={previewUrl}
                alt="Forhåndsvisning"
                className={`${maxHeight} w-full border border-border bg-background object-cover`}
              />
            </div>

            {isNewUpload && imageData?.file && (
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-[0.7rem] text-muted-foreground">{imageData.file.name}</p>
              </div>
            )}

            {!isNewUpload && existingImageUrl && (
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-[0.7rem] text-muted-foreground">Nåværende bilde</p>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border bg-muted p-4 text-center">
            <p className="text-[0.7rem] text-muted-foreground">Ingen bilde valgt</p>
          </div>
        )}

        <Input
          type="file"
          accept={accept}
          className="border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {helperText && <p className="text-[0.7rem] text-muted-foreground">{helperText}</p>}
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
  helperText = 'Last opp et profilbilde som vises til kunder.',
  existingImageUrl = null,
}: ImageUploadRendererProps) => {
  const imageData = value as ImageData | null;
  const previewUrl = imageData?.previewUrl || existingImageUrl;
  const isNewUpload = Boolean(imageData?.file);

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
      {previewUrl ? (
        <div className="border border-border bg-muted p-2">
          <div className="relative">
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 border border-border bg-background p-1 text-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="Fjern bilde"
            >
              <X className="h-3 w-3" />
            </button>

            <img
              src={previewUrl}
              alt="Forhåndsvisning"
              className={`${maxHeight} w-full border border-border bg-background object-cover`}
            />
          </div>

          {isNewUpload && imageData?.file && (
            <div className="border-t border-border mt-2 pt-2">
              <p className="text-[0.7rem] text-muted-foreground">{imageData.file.name}</p>
            </div>
          )}

          {!isNewUpload && existingImageUrl && (
            <div className="border-t border-border mt-2 pt-2">
              <p className="text-[0.7rem] text-muted-foreground">Nåværende bilde</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border bg-muted p-4 text-center">
          <p className="text-[0.7rem] text-muted-foreground">Ingen bilde valgt</p>
        </div>
      )}

      <Input
        type="file"
        accept={accept}
        className="border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />
      {helperText && <p className="text-[0.7rem] text-muted-foreground">{helperText}</p>}
    </div>
  );
};
