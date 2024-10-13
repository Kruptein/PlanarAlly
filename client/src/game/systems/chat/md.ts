import MarkdownIt from "markdown-it";

export const chatMarkDown = new MarkdownIt({ linkify: true });

chatMarkDown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx]?.attrSet("target", "_blank");
    return self.renderToken(tokens, idx, options);
};
