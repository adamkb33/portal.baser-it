export type TemplateFieldValue = string | string[];

export type CreateOfferValues = {
  orgNumber: string;
  templateId: string;
  validUntil: string;
  templateValues: Record<string, TemplateFieldValue>;
  lineDescriptions: string[];
  lineQuantities: string[];
  lineUnitPrices: string[];
  lineVatRates: string[];
  recipientNames: string[];
  recipientEmails: string[];
  recipientMobiles: string[];
};

export type LineFormRow = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

export type RecipientFormRow = {
  key: string;
  name: string;
  email: string;
  mobileNumber: string;
};
