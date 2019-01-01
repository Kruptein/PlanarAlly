declare module "polygon-clipping" {
    export function union(...shapes: number[][][][]): number[][][][];
    export function intersection(...shapes: number[][][][]): number[][][][];
    export function xor(...shapes: number[][][][]): number[][][][];
}
