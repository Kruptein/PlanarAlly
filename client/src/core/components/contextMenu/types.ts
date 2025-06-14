interface BaseSection {
    title: string;
    action: () => boolean | Promise<boolean>;
    disabled?: boolean;
    selected?: boolean;
}

type Length<T extends unknown[]> = T extends { length: infer L } ? L : never;
type BuildTuple<L extends number, T extends unknown[] = []> = T extends { length: L }
    ? T
    : BuildTuple<L, [...T, unknown]>;
type MinusOne<N extends number> = BuildTuple<N> extends [...infer U, unknown] ? Length<U> : never;

export type Section<Depth extends number = 3> = Depth extends 0
    ? BaseSection
    : BaseSection | Section<MinusOne<Depth>>[] | { title: string; subitems: Section<MinusOne<Depth>>[] };

// Simpler type has recursive issues, causing some places where TS cannot infer the type correctly.
// export type Section = BaseSection | Section[] | { title: string; subitems: Section[] };
