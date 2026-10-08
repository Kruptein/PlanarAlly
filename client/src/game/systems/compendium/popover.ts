import { reactive } from "vue";

import { type RuleRef } from "./index";

export const rulePopover = reactive({
    ref: null as RuleRef | null,
    x: 0,
    y: 0,
});

export function closeRule(): void {
    rulePopover.ref = null;
}

export function openRuleAt(ref: RuleRef, x: number, y: number): void {
    rulePopover.ref = ref;
    rulePopover.x = x;
    rulePopover.y = y;
}

export function ruleClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a.pa-rule");
    if (!(link instanceof HTMLAnchorElement)) return;
    const ref = link.dataset.rule;
    if (ref === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    openRuleAt(ref as RuleRef, event.clientX, event.clientY);
}
