import type { CompendiumEntry } from "@planarally/mod-api";

export type RuleRef = `${string}/${string}`;

export interface IndexedEntry extends CompendiumEntry {
    mod: string;
    book: string;
    path: string[];
    ref: RuleRef;
}

export interface CompendiumBook {
    mod: string;
    name: string;
    count: number;
}

export interface CompendiumFolder {
    name: string;
    count: number;
    kind: "path" | "group";
}

export interface CompendiumGrouping {
    by: string;
    order?: string[];
    group?: string;
}
