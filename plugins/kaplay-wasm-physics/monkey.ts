import type { KAPLAYCtx, Comp } from "kaplay";

type CompFactoryNames<T = KAPLAYCtx> = {
    [K in keyof T]: T[K] extends (...args: any[]) => Comp ? K : never
}[keyof T];

function monkey1<T extends Record<string, any>>(target: T, key: keyof T, originalValue: T[keyof T], overriddenValue: any) {
    if (typeof originalValue === "function") {
        Object.assign(target, {
            [key](...args: any[]) {
                const ret = originalValue.call(this, ...args);
                overriddenValue.call(this, ret, ...args);
                return ret;
            }
        });
    } else {
        target[key] = overriddenValue;
    }
}
function monkey(target: Record<string, any>, overrides: Record<string, any>) {
    for (var k of Object.keys(overrides)) {
        monkey1(target, k, target[k], overrides[k]);
    }
}
export function patchComponent<T extends CompFactoryNames>(k: KAPLAYCtx, compID: T, additional: Partial<Comp>): KAPLAYCtx[T] {
    const oldFunc = k[compID] as (...args: any[]) => ReturnType<KAPLAYCtx[T]>;
    // @ts-expect-error
    return (...args: Parameters<KAPLAYCtx[T]>) => {
        const defaultComp = oldFunc(...args);
        monkey(defaultComp as any, additional);
        return defaultComp;
    };
}
