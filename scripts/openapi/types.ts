export type OAS = any;

export type ApiName = 'base' | 'booking';

export type MigrationMap = {
  merged: string[];
  renamed: Array<{ from: string; to: string; reason: 'collision' | 'namespace' }>;
  aliases: Array<{ alias: string; target: string }>;
};

export type SpecPack = { baseSpec: OAS; bookingSpec: OAS };
export type GenPack = { baseOut: string; bookingOut: string };
