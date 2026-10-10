import type { CompendiumEntry, CompendiumRegisterOptions, CompendiumView } from "@planarally/mod-api";

import { registerSystem } from "../../../core/systems";
import type { System, SystemClearReason } from "../../../core/systems/models";

import { compendiumState } from "./state";
import type { CompendiumBook, CompendiumFolder, CompendiumGrouping, IndexedEntry, RuleRef } from "./types";

export type { CompendiumBook, CompendiumFolder, CompendiumGrouping, IndexedEntry, RuleRef } from "./types";

const { mutableReactive: $ } = compendiumState;

const ENTRY_ID = /^[^/\s]+$/;

function cleanSegments(segments: string[]): string[] {
    return segments.map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}

function samePath(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function entryPath(entry: CompendiumEntry): string[] {
    const raw = entry.path !== undefined && entry.path.length > 0 ? entry.path : [entry.kind];
    return cleanSegments(raw);
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

function sortGroups(names: string[], order: string[] | undefined): string[] {
    if (order === undefined || order.length === 0) return names.sort((a, b) => a.localeCompare(b));
    const rank = new Map(order.map((label, index) => [label, index]));
    return names.sort((a, b) => {
        const left = rank.get(a);
        const right = rank.get(b);
        if (left !== undefined && right !== undefined) return left - right;
        if (left !== undefined) return -1;
        if (right !== undefined) return 1;
        return a.localeCompare(b);
    });
}

class CompendiumSystem implements System {
    // Entries come from loaded mods, which stay across location loads.
    clear(reason: SystemClearReason): void {
        if (reason !== "leaving" && reason !== "logging-out") return;
        $.byRef.clear();
        $.bookNames.clear();
        $.bookViews.clear();
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
        const book = named === undefined || named.length === 0 ? mod : named;
        $.bookNames.set(mod, book);
        const addedViews = (options?.views ?? []).flatMap((view) => {
            const normalized = normalizeView(view);
            return normalized === undefined ? [] : [normalized];
        });
        if (addedViews.length > 0) $.bookViews.set(mod, [...($.bookViews.get(mod) ?? []), ...addedViews]);
        const refs: RuleRef[] = [];
        for (const entry of entries) {
            if (!ENTRY_ID.test(entry.id) || !ENTRY_ID.test(mod)) continue;
            const ref: RuleRef = `${mod}/${entry.id}`;
            $.byRef.set(ref, { ...entry, mod, book, path: entryPath(entry), group: entryGroup(entry), ref });
            refs.push(ref);
        }
        return () => {
            for (const ref of refs) {
                if ($.byRef.get(ref)?.mod === mod) $.byRef.delete(ref);
            }
            const remaining = ($.bookViews.get(mod) ?? []).filter((view) => !addedViews.includes(view));
            if (remaining.length === 0) $.bookViews.delete(mod);
            else $.bookViews.set(mod, remaining);
            if (![...$.byRef.values()].some((entry) => entry.mod === mod)) {
                $.bookNames.delete(mod);
                $.bookViews.delete(mod);
            }
        };
    }

    viewsAt(mod: string, folder: string[]): CompendiumView[] {
        const seen = new Set<string>();
        const views: CompendiumView[] = [];
        for (const view of $.bookViews.get(mod) ?? []) {
            if (!samePath(view.at, folder) || seen.has(view.name)) continue;
            seen.add(view.name);
            views.push(view);
        }
        return views;
    }

    getEntry(ref: string): IndexedEntry | undefined {
        return $.byRef.get(ref as RuleRef);
    }

    listEntries(): IndexedEntry[] {
        return [...$.byRef.values()].sort((a, b) => a.mod.localeCompare(b.mod) || a.name.localeCompare(b.name));
    }

    listBooks(): CompendiumBook[] {
        const counts = new Map<string, number>();
        for (const entry of $.byRef.values()) counts.set(entry.mod, (counts.get(entry.mod) ?? 0) + 1);
        return [...counts]
            .map(([mod, count]) => ({ mod, name: $.bookNames.get(mod) ?? mod, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    listLevel(
        mod: string,
        folder: string[],
        grouping?: CompendiumGrouping,
    ): { folders: CompendiumFolder[]; entries: IndexedEntry[] } {
        const entries: IndexedEntry[] = [];
        const pathCounts = new Map<string, number>();
        const groupCounts = new Map<string, number>();
        for (const entry of $.byRef.values()) {
            if (entry.mod !== mod || !samePath(entry.path.slice(0, folder.length), folder)) continue;
            if (entry.path.length === folder.length) {
                const label = grouping === undefined ? undefined : entry.group?.[grouping.by];
                if (grouping === undefined) entries.push(entry);
                else if (grouping.group !== undefined) {
                    if (label === grouping.group) entries.push(entry);
                } else if (label !== undefined) groupCounts.set(label, (groupCounts.get(label) ?? 0) + 1);
                continue;
            }
            if (grouping?.group !== undefined) continue;
            const child = entry.path[folder.length]!;
            pathCounts.set(child, (pathCounts.get(child) ?? 0) + 1);
        }
        const pathFolders: CompendiumFolder[] = [...pathCounts]
            .map(([name, count]) => ({ name, count, kind: "path" as const }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const groupFolders: CompendiumFolder[] = sortGroups([...groupCounts.keys()], grouping?.order).map((name) => ({
            name,
            count: groupCounts.get(name) ?? 0,
            kind: "group" as const,
        }));
        return {
            folders: [...pathFolders, ...groupFolders],
            entries: entries.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }

    searchEntries(query: string): IndexedEntry[] {
        const needle = query.trim().toLowerCase();
        if (needle.length === 0) return [];
        return this.listEntries().filter((entry) =>
            [
                entry.name,
                entry.book,
                entry.kind,
                ...entry.path,
                ...Object.values(entry.group ?? {}),
                ...(entry.aliases ?? []),
            ].some((label) => label.toLowerCase().includes(needle)),
        );
    }
}

export const compendiumSystem = new CompendiumSystem();
registerSystem("compendium", compendiumSystem, false, compendiumState);
