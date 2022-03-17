export type ArrayElementType<T extends any[]> = T extends (infer U)[] ? U : never;
