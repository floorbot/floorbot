type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

export type MixinConstructor<T = {}> = new (...args: any[]) => T;
export type MixinFunction<T extends MixinConstructor = MixinConstructor, R extends T = T & MixinConstructor> = (Base: T) => R;
export type MixinReturnValue<T extends MixinConstructor, M extends MixinFunction<T, any>[]> = UnionToIntersection<| T | { [K in keyof M]: M[K] extends MixinFunction<any, infer U> ? U : never; }[number]>;
export type MixinInstance<F extends MixinFunction<any>> = F extends MixinFunction<MixinConstructor<any>, infer R> ? InstanceType<R> : never;

/**
 * Code from ts-mixin-extended ([GitHub](https://github.com/1nVitr0/lib-ts-mixin-extended), [NPM](https://www.npmjs.com/package/ts-mixin-extended)) package which does not seem to work?
 *
 * Note: TypeScript will show overloads for common functions but will call only the last mixin that adds it.
 *
 * @param Base The base class to extend from
 * @param mixins The mixin functions to return extended classes
 * @returns The final mixed class from base and all mixins
 */
export default function mixin<T extends MixinConstructor, M extends MixinFunction<T, any>[]>(Base: T, ...mixins: M): MixinReturnValue<T, M> {
    return mixins.reduce((mix, applyMixin) => applyMixin(mix), Base) as MixinReturnValue<T, M>;
}
