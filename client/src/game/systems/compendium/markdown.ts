import type MarkdownIt from "markdown-it";

import { compendiumSystem, type IndexedEntry, type RuleRef } from "./index";

export function ruleMarkdown(entry: IndexedEntry): string {
    const label = entry.name.replaceAll("[", "").replaceAll("]", "");
    return `[${label}](pa:rule/${entry.ref})`;
}

const RULE_HREF = /^pa:rule\/([^/\s]+)\/([^/\s]+)$/;

export function rulePlugin(md: MarkdownIt): void {
    const previous = md.renderer.rules.link_open;
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const href = token?.attrGet("href") ?? "";
        const match = RULE_HREF.exec(href);
        if (match === null || token === undefined) {
            return previous?.(tokens, idx, options, env, self) ?? self.renderToken(tokens, idx, options);
        }

        const ref = `${match[1]}/${match[2]}` as RuleRef;
        token.attrSet("class", compendiumSystem.getEntry(ref) === undefined ? "pa-rule is-missing" : "pa-rule");
        token.attrSet("data-rule", ref);
        token.attrSet("href", "#");
        return previous?.(tokens, idx, options, env, self) ?? self.renderToken(tokens, idx, options);
    };
}

export const rulePlugins = [rulePlugin];
