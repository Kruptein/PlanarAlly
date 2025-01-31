export type NumberId<T extends string> = number & { __brand: T };
export type StringId<T extends string> = string & { __brand: T };
export type GlobalId = StringId<"globalId">;
export type LocalId = NumberId<"localId">;
