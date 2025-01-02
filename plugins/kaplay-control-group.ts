import { KAPLAYCtx, KEventController, KEvent, Registry, Vec2 } from "kaplay";

export interface KEventControllerPatch extends KEventController {
    forEventGroup(evGroups: string | string[]): this
}

export function kaplayControlGroup(K: KAPLAYCtx & KAPLAYControlGroupPlugin): KAPLAYControlGroupPlugin {
    // patch KEvent to support group pausing
    class patchedEC extends K.KEventController implements KEventControllerPatch {
        evGroups: string[] = [];
        forEventGroup(evGroups: string | string[]) {
            this.evGroups = Array.isArray(evGroups) ? evGroups : [evGroups];
            return this;
        }
    }
    K.KEvent.prototype.add = function <Args extends any[]>(this: KEvent<Args>,
        action: (...args: Args) => unknown): patchedEC {
        function handler(...args: Args) {
            if (ev.paused
                || (ev.evGroups.length > 0
                    && !eGroupsMatches(ev.evGroups, K.eventGroups))) return;
            return action(...args);
        }

        // @ts-ignore
        const cancel = (this.handlers as Registry<typeof handler>).pushd(handler);
        const ev = new patchedEC(cancel);
        // @ts-ignore
        (this.cancellers as WeakMap<typeof handler, typeof cancel>).set(handler, cancel);
        return ev;
    }
    return {
        eventGroups: new Set,
    }
}

type ReplaceTypes<T, From, To extends From> =
    T extends Vec2 ? Vec2 :
    T extends From ? To :
    T extends Promise<From> ? Promise<To> :
    T extends Set<From> ? Set<To> :
    T extends Map<From, infer Value> ? Map<To, ReplaceTypes<Value, From, To>> :
    T extends Map<infer Key, From> ? Map<ReplaceTypes<Key, From, To>, To> :
    T extends WeakMap<infer Key, From> ? WeakMap<Extract<ReplaceTypes<Key, From, To>, WeakKey>, To> :
    T extends WeakMap<Extract<From, WeakKey>, infer Value> ? WeakMap<Extract<To, WeakKey>, ReplaceTypes<Value, From, To>> :
    T extends WeakSet<Extract<From, WeakKey>> ? WeakSet<Extract<To, WeakKey>> :
    T extends (...args: infer Params) => infer Return ? (...args: Extract<ReplaceTypes<Params, From, To>, any[]>) => ReplaceTypes<Return, From, To> :
    { [K in keyof T]: ReplaceTypes<T[K], From, To> };

export type KAPLAYControlGroupPlugin = Partial<ReplaceTypes<KAPLAYCtx, KEventController, KEventControllerPatch>> & {
    eventGroups: Set<string>;
}

function eGroupsMatches(evGroups: string[], eventGroups: Set<string>) {
    for (var evGroup of evGroups) {
        if (evGroup.startsWith("!")) {
            if (eventGroups.has(evGroup.slice(1))) {
                return false;
            }
        } else {
            if (!eventGroups.has(evGroup)) {
                return false;
            }
        }
    }
    return true;
}
