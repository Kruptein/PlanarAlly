import type { CompendiumEntry, CompendiumRecord, CompendiumRegisterOptions, CompendiumView } from "@planarally/mod-api";

import { registerSystem } from "../../../core/systems";
import type { System, SystemClearReason } from "../../../core/systems/models";

import { compendiumState } from "./state";
import type { IndexedEntry, RuleRef } from "./types";

export type { IndexedEntry, RuleRef } from "./types";

const { mutableReactive: $ } = compendiumState;

const ENTRY_ID = /^[^/\s]+$/;

function cleanSegments(segments: string[]): string[] {
    return segments.map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}

function entryPath(entry: CompendiumEntry): string[] {
    return cleanSegments(entry.path ?? []);
}

function entryGroup(entry: CompendiumEntry): Record<string, string> | undefined {
    if (entry.group === undefined) return undefined;
    const group: Record<string, string> = {};
    for (const [key, value] of Object.entries(entry.group)) {
        const label = value.trim();
        const name = key.trim();
        if (name.length > 0 && label.length > 0) group[name] = label;
    }
    return Object.keys(group).length > 0 ? group : undefined;
}

function normalizeView(view: CompendiumView): CompendiumView | undefined {
    const name = view.name.trim();
    const by = view.by.trim();
    if (name.length === 0 || by.length === 0) return undefined;
    const order = view.order === undefined ? undefined : cleanSegments(view.order);
    return { at: cleanSegments(view.at), name, by, order };
}

class CompendiumSystem implements System {
    // Entries come from loaded mods, which stay across location loads.
    clear(reason: SystemClearReason): void {
        if (reason !== "leaving" && reason !== "logging-out") return;
        $.byRef.clear();
        $.views.clear();
        $.open = false;
        $.popover.ref = null;
    }

    toggle(): void {
        $.open = !$.open;
    }

    close(): void {
        $.open = false;
    }

    openRuleAt(ref: RuleRef, x: number, y: number): void {
        $.popover.ref = ref;
        $.popover.x = x;
        $.popover.y = y;
    }

    closeRule(): void {
        $.popover.ref = null;
    }

    ruleClick = (event: MouseEvent): void => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const link = target.closest("a.pa-rule");
        if (!(link instanceof HTMLAnchorElement)) return;
        const ref = link.dataset.rule;
        if (ref === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        this.openRuleAt(ref as RuleRef, event.clientX, event.clientY);
    };

    registerEntries(mod: string, entries: CompendiumEntry[], options?: CompendiumRegisterOptions): () => void {
        const named = options?.name?.trim();
        const collection = named === undefined || named.length === 0 ? mod : named;
        const addedViews = (options?.views ?? []).flatMap((view) => {
            const normalized = normalizeView(view);
            return normalized === undefined ? [] : [normalized];
        });
        if (addedViews.length > 0) {
            const owned = addedViews.map((view) => ({ mod, view }));
            $.views.set(collection, [...($.views.get(collection) ?? []), ...owned]);
        }
        const refs: RuleRef[] = [];
        for (const entry of entries) {
            if (!ENTRY_ID.test(entry.id) || !ENTRY_ID.test(mod)) continue;
            const ref: RuleRef = `${mod}/${entry.id}`;
            $.byRef.set(ref, { ...entry, mod, collection, path: entryPath(entry), group: entryGroup(entry), ref });
            refs.push(ref);
        }
        return () => {
            for (const ref of refs) {
                if ($.byRef.get(ref)?.mod === mod) $.byRef.delete(ref);
            }
            const remaining = ($.views.get(collection) ?? []).filter((item) => !addedViews.includes(item.view));
            if (remaining.length === 0) $.views.delete(collection);
            else $.views.set(collection, remaining);
        };
    }

    getEntry(ref: string): IndexedEntry | undefined {
        return $.byRef.get(ref as RuleRef);
    }

    getEntries(system: string, kind: string): CompendiumRecord[] {
        return this.listEntries().filter(
            (entry): entry is IndexedEntry & CompendiumRecord =>
                entry.schema?.system === system && entry.schema.kind === kind,
        );
    }

    listEntries(): IndexedEntry[] {
        return [...$.byRef.values()].sort(
            (a, b) => a.collection.localeCompare(b.collection) || a.name.localeCompare(b.name),
        );
    }

    searchEntries(query: string): IndexedEntry[] {
        const needle = query.trim().toLowerCase();
        if (needle.length === 0) return [];
        return this.listEntries().filter((entry) =>
            [
                entry.name,
                entry.collection,
                entry.schema?.system,
                entry.schema?.kind,
                ...entry.path,
                ...Object.values(entry.group ?? {}),
                ...(entry.aliases ?? []),
            ]
                .filter((label) => label !== undefined)
                .some((label) => label.toLowerCase().includes(needle)),
        );
    }
}

export const compendiumSystem = new CompendiumSystem();
registerSystem("compendium", compendiumSystem, false, compendiumState);
