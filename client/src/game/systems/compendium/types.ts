import type { CompendiumEntry } from "@planarally/mod-api";

export type RuleRef = `${string}/${string}`;

export interface IndexedEntry extends CompendiumEntry {
    mod: string;
    collection: string;
    path: string[];
    ref: RuleRef;
}
