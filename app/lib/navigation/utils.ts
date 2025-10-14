import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Route<P extends string> = {
  readonly route: P;
  readonly sub: <S extends string>(seg: S) => Route<`${P}/${S}`>;
  readonly group: <Defs extends Record<string, string>>(
    defs: Defs,
  ) => {
    readonly [K in keyof Defs]: `${P}/${Defs[K] & string}`;
  };
};

export const route = <P extends string>(base: P): Route<P> => ({
  route: base as P,
  sub: (seg) => route(`${base}/${seg}` as const),
  group: (defs) => {
    const out: Record<string, string> = {};
    for (const k in defs) out[k] = `${base}/${defs[k]}`;
    return out as any;
  },
});
