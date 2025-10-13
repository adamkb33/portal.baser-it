export type OAS = any;

export type ApiName = 'identity' | 'booking';

export type MigrationMap = {
  merged: string[];
  renamed: Array<{ from: string; to: string; reason: 'collision' | 'namespace' }>;
  aliases: Array<{ alias: string; target: string }>;
};

export type SpecPack = { identitySpec: OAS; bookingSpec: OAS };
export type GenPack = { identityOut: string; bookingOut: string };
