export const str = JSON.stringify;

export function isinstance<C>(obj: any, cls: abstract new (...args: any[]) => C): obj is C {
    return obj instanceof cls;
}

const idMap = new WeakMap<Object, number>();
var idCounter = 0;
export const id = (obj: any): number => {
    if (!idMap.has(obj)) idMap.set(obj, idCounter++);
    return idMap.get(obj)!;
}
