import type { IShape } from "../shape";

export interface IRect extends IShape {
    get h(): number;
    set h(height: number);
    get w(): number;
    set w(width: number);
}
