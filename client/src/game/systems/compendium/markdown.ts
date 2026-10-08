import type MarkdownIt from "markdown-it";

import { getEntry, type RuleRef } from "./index";

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
        token.attrSet("class", getEntry(ref) === undefined ? "pa-rule is-missing" : "pa-rule");
        token.attrSet("data-rule", ref);
        token.attrSet("href", "#");
        return previous?.(tokens, idx, options, env, self) ?? self.renderToken(tokens, idx, options);
    };
}

export const rulePlugins = [rulePlugin];
