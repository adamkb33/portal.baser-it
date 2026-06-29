export type OfferTemplateData = Record<string, unknown>;

export function parseOfferTemplateData(value: string): OfferTemplateData | Error {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Error('Maldata må være et JSON-objekt.');
    }

    return parsed as OfferTemplateData;
  } catch {
    return new Error('Maldata må være gyldig JSON.');
  }
}
