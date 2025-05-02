export type AsyncReturnType<T extends (..._args: any) => Promise<any>> = Awaited<ReturnType<T>>;
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Union pick types are taken from the type-fest repo

// type UnionToIntersection<Union> = // `extends unknown` is always going to be the case and is used to convert the
//     // `Union` into a [distributive conditional
//     // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
//     (
//         Union extends unknown
//             ? // The union type is used as the only argument to a function since the union
//               // of function arguments is an intersection.
//               (distributedUnion: Union) => void
//             : // This won't happen.
//               never
//     ) extends // Infer the `Intersection` type since TypeScript represents the positional
//     // arguments of unions of functions as an intersection of the union.
//     (mergedIntersection: infer Intersection) => void
//         ? // The `& Union` is to allow indexing by the resulting type
//           Intersection & Union
//         : never;
// A simpler KeysOfUnion type is possible but that does not work with generic types being passed higher up the chain
// e.g. type a<T extends Something> = DistributivePick<T, "a" | "b">
// even if "a" and "b" are keys of Something, this info is lost when using the simpler KeyOfUnion type
// type KeysOfUnion<ObjectType> = keyof UnionToIntersection<
//     ObjectType extends unknown ? Record<keyof ObjectType, never> : never
// >;
// export type DistributivePick<ObjectType, KeyType extends KeysOfUnion<ObjectType>> = ObjectType extends unknown
//     ? Pick<ObjectType, Extract<KeyType, keyof ObjectType>>
//     : never;
