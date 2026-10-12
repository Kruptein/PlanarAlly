import type { MathNode } from "mathjs";

import { i18n } from "../../../i18n";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const loadMathJs = () => import("mathjs");

type MathJs = Awaited<ReturnType<typeof loadMathJs>>;

type DiceOperator = "add" | "subtract" | "unaryMinus" | "unaryPlus";

export interface DiceMathSyntax {
    // Must be a global regex, every match is treated as a single opaque dice term
    termPattern: RegExp;
    // Operators that may be applied to (sub)expressions that contain dice
    diceOperators: ReadonlySet<DiceOperator>;
    // Whether numbers in the resolved expression may be fractional, intermediate results always can be
    allowFractions: boolean;
}

export const dxMathSyntax: DiceMathSyntax = {
    termPattern: /\d+d\d+(?:(?:(?:[kpe]|r[aor])[hl<>=]?|m[ai])\d+)?/g,
    diceOperators: new Set(["add", "subtract", "unaryMinus", "unaryPlus"]),
    // The DX parser only reads whole numbers
    allowFractions: false,
};

export class DiceMathError extends Error {}

const FUNCTIONS = new Map<string, { arity?: number; fn: (...args: number[]) => number }>([
    ["floor", { arity: 1, fn: Math.floor }],
    ["ceil", { arity: 1, fn: Math.ceil }],
    ["round", { arity: 1, fn: Math.round }],
    ["abs", { arity: 1, fn: Math.abs }],
    ["min", { fn: Math.min }],
    ["max", { fn: Math.max }],
]);

const NUMBER_OPERATORS = new Set(["add", "subtract", "multiply", "divide", "unaryMinus", "unaryPlus"]);

interface Term {
    negative: boolean;
    text: string;
}

type Value = { kind: "number"; value: number } | { kind: "dice"; terms: Term[] };

interface Context {
    math: MathJs;
    syntax: DiceMathSyntax;
    terms: Map<string, string>;
}

function error(key: string, params: Record<string, string | number> = {}): DiceMathError {
    return new DiceMathError(i18n.global.t(`game.ui.tools.DiceTool.math_errors.${key}`, params));
}

function restore(text: string, ctx: Context): string {
    return text.replaceAll(/_d\d+_/g, (name) => ctx.terms.get(name) ?? name);
}

function toNumber(value: number): Value {
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw error("invalid_number");
    return { kind: "number", value };
}

function toTerms(value: Value, ctx: Context): Term[] {
    if (value.kind === "dice") return value.terms;
    if (!ctx.syntax.allowFractions && !Number.isInteger(value.value)) {
        throw error("fraction", { value: value.value });
    }
    return [{ negative: value.value < 0, text: Math.abs(value.value).toString() }];
}

function negate(terms: Term[]): Term[] {
    return terms.map((term) => ({ ...term, negative: !term.negative }));
}

function applyOperator(fn: string, args: number[]): number {
    const [a, b] = args as [number, number];
    switch (fn) {
        case "add":
            return a + b;
        case "subtract":
            return a - b;
        case "multiply":
            return a * b;
        case "divide":
            return a / b;
        case "unaryMinus":
            return -a;
        default:
            return a;
    }
}

function resolveNode(node: MathNode, ctx: Context): Value {
    const { math } = ctx;
    if (math.isParenthesisNode(node)) return resolveNode(node.content, ctx);
    if (math.isConstantNode(node)) {
        if (typeof node.value !== "number") throw error("unsupported", { expression: restore(node.toString(), ctx) });
        return toNumber(node.value);
    }
    if (math.isSymbolNode(node)) {
        const term = ctx.terms.get(node.name);
        if (term === undefined) throw error("unknown_name", { name: node.name });
        return { kind: "dice", terms: [{ negative: false, text: term }] };
    }
    if (math.isFunctionNode(node)) {
        const name = math.isSymbolNode(node.fn) ? restore(node.fn.name, ctx) : "";
        const func = FUNCTIONS.get(name);
        if (func === undefined) {
            throw error("unknown_function", { name, functions: [...FUNCTIONS.keys()].join(", ") });
        }
        if (func.arity === undefined ? node.args.length === 0 : node.args.length !== func.arity) {
            throw error("argument_count", { name });
        }
        const args = node.args.map((arg) => resolveNode(arg, ctx));
        const values: number[] = [];
        for (const arg of args) {
            if (arg.kind === "dice") throw error("dice_in_function", { name });
            values.push(arg.value);
        }
        return toNumber(func.fn(...values));
    }
    if (math.isOperatorNode(node)) {
        if (!NUMBER_OPERATORS.has(node.fn)) throw error("unsupported_operator", { op: node.op });
        const args = node.args.map((arg) => resolveNode(arg, ctx));
        const values: number[] = [];
        for (const arg of args) if (arg.kind === "number") values.push(arg.value);
        if (values.length === args.length) return toNumber(applyOperator(node.fn, values));

        if (!ctx.syntax.diceOperators.has(node.fn as DiceOperator)) throw error("dice_operator", { op: node.op });
        const [a, b] = args.map((arg) => toTerms(arg, ctx)) as [Term[], Term[]];
        switch (node.fn) {
            case "add":
                return { kind: "dice", terms: [...a, ...b] };
            case "subtract":
                return { kind: "dice", terms: [...a, ...negate(b)] };
            case "unaryMinus":
                return { kind: "dice", terms: negate(a) };
            default:
                return { kind: "dice", terms: a };
        }
    }
    throw error("unsupported", { expression: restore(node.toString(), ctx) });
}

/**
 * Resolves all math in a dice expression that does not depend on dice results,
 * e.g. `1d20 + floor((16 - 10) / 2) - -1` becomes `1d20 + 3 + 1`.
 *
 * The result only consists of dice terms and whole numbers joined by the allowed dice operators,
 * so that it can be passed to the dice system as-is.
 */
export async function resolveDiceMath(input: string, syntax: DiceMathSyntax): Promise<string> {
    if (input.trim().length === 0) return input;

    const ctx: Context = { math: await loadMathJs(), syntax, terms: new Map() };
    const prepared = input.replaceAll(syntax.termPattern, (term) => {
        const name = `_d${ctx.terms.size}_`;
        ctx.terms.set(name, term);
        return ` ${name} `;
    });

    let root: MathNode;
    try {
        root = ctx.math.parse(prepared);
    } catch (e) {
        throw error("invalid", { error: restore(e instanceof Error ? e.message : String(e), ctx) });
    }

    return toTerms(resolveNode(root, ctx), ctx)
        .map((term, i) => {
            if (i === 0) return term.negative ? `-${term.text}` : term.text;
            return `${term.negative ? "-" : "+"} ${term.text}`;
        })
        .join(" ");
}
