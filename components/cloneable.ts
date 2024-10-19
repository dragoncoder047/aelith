import { Comp, CompList, GameObj, MergeComps } from "kaplay";

export interface CloneableComp<T> extends Comp {
    factory: (original: GameObj<T>) => CompList<T>
    propsToCopy: (keyof MergeComps<T>)[]
    clone(): GameObj<T>
}

export function cloneable<T>(
    factory: (original: GameObj<T>) => CompList<T>,
    propsToCopy: (keyof MergeComps<T>)[],
): CloneableComp<T> {
    return {
        id: "cloneable",
        factory,
        propsToCopy,
        clone(this: GameObj<CloneableComp<T>> & GameObj<T>) {
            const newObj = this.parent!.add(this.factory(this));
            for (var prop of this.propsToCopy) {
                const thisVal = this[prop] as any;
                newObj[prop] = (typeof thisVal.clone === "function"
                    ? thisVal.clone()
                    : thisVal) as any;
            }
            return newObj;
        }
    }
}
