/* Types for Brønnøysund Enhetsregisteret API */

export interface BrregEnhetResponse {
  organisasjonsnummer: string;
  navn: string;
  organisasjonsform?: BrregOrganisasjonsform;
  postadresse?: BrregAdresse;
  forretningsadresse?: BrregAdresse;
  registrertIMvaregisteret?: boolean;
  maalform?: string;
  naeringskode1?: BrregNaeringskode;
  naeringskode2?: BrregNaeringskode;
  naeringskode3?: BrregNaeringskode;
  hjelpeenhetskode?: BrregNaeringskode;
  underAvvikling?: boolean;
  underAvviklingDato?: string;
  registrertIStiftelsesregisteret?: boolean;
  konkurs?: boolean;
  konkursdato?: string;
  tvangsavvikletPgaManglendeSlettingDato?: string;
  tvangsopplostPgaManglendeDagligLederDato?: string;
  tvangsopplostPgaManglendeRevisorDato?: string;
  tvangsopplostPgaManglendeRegnskapDato?: string;
  tvangsopplostPgaMangelfulltStyreDato?: string;
  vedtektsdato?: string;
  vedtektsfestetFormaal?: string[];
  aktivitet?: string[];
  paategninger?: BrregPaategning[];
  registrertIFrivillighetsregisteret?: boolean;
  stiftelsesdato?: string;
  institusjonellSektorkode?: BrregKode;
  registrertIForetaksregisteret?: boolean;
  registreringsdatoEnhetsregisteret?: string;
  hjemmeside?: string;
  sisteInnsendteAarsregnskap?: string;
  frivilligMvaRegistrertBeskrivelser?: string[];
  underTvangsavviklingEllerTvangsopplosning?: boolean;
  antallAnsatte?: number;
  harRegistrertAntallAnsatte?: boolean;
  overordnetEnhet?: string;
  registreringsnummerIHjemlandet?: string;
  registreringsdatoAntallAnsatteNAVAaregisteret?: string;
  registreringsdatoAntallAnsatteEnhetsregisteret?: string;
  registreringsdatoMerverdiavgiftsregisteret?: string;
  registreringsdatoMerverdiavgiftsregisteretEnhetsregisteret?: string;
  registreringsdatoFrivilligMerverdiavgiftsregisteret?: string;
  registreringsdatoForetaksregisteret?: string;
  registreringsdatoFrivillighetsregisteret?: string;
  registrertIPartiregisteret?: boolean;
  registreringsdatoPartiregisteret?: string;
  epostadresse?: string;
  telefon?: string;
  mobil?: string;
  erIKonsern?: boolean;
  fravalgRevisjonDato?: string;
  fravalgRevisjonBeslutningsDato?: string;
  underRekonstruksjonsforhandlingDato?: string;
  underUtenlandskInsolvensbehandlingDato?: string;
  _links?: {
    self?: { href: string };
    overordnetEnhet?: { href: string };
  };
}

export interface BrregOrganisasjonsform {
  kode: string;
  beskrivelse: string;
  utgaatt?: string;
  _links?: {
    self?: { href: string };
  };
}

export interface BrregAdresse {
  land?: string;
  landkode?: string;
  postnummer?: string;
  poststed?: string;
  adresse?: string[];
  kommune?: string;
  kommunenummer?: string;
}

export interface BrregNaeringskode {
  kode: string;
  beskrivelse: string;
}

export interface BrregKode {
  kode: string;
  beskrivelse: string;
}

export interface BrregPaategning {
  infotype: string;
  tekst: string;
  innfoertDato?: string;
}

// Error response type
export interface BrregErrorResponse {
  tidsstempel?: number;
  timestamp?: string;
  status: number;
  feilmelding?: string;
  error?: string;
  message?: string;
  sti?: string;
  path?: string;
  antallFeil?: number;
  valideringsfeil?: Array<{
    feilmelding: string;
    parametere?: string[];
    feilaktigVerdi?: string;
  }>;
  trace?: string;
}
