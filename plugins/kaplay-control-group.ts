import { KAPLAYCtx, KEventController, KEvent, Registry } from "kaplay";

export interface KEventControllerPatch extends KEventController {
    forEventGroup(evGroups: string | string[]): void
}

export function kaplayControlGroup(K: KAPLAYCtx & KAPLAYControlGroupPlugin): KAPLAYControlGroupPlugin {
    // patch KEvent to support group pausing
    class patchedEC extends K.KEventController implements KEventControllerPatch {
        evGroups: string[] = [];
        forEventGroup(evGroups: string | string[]) {
            this.evGroups = Array.isArray(evGroups) ? evGroups : [evGroups];
        }
    }
    K.KEvent.prototype.add = function <Args extends any[]>(this: KEvent<Args>,
        action: (...args: Args) => unknown): patchedEC {
        function handler(...args: Args) {
            if (ev.paused
                || (ev.evGroups.length > 0
                    && ev.evGroups.every(g => !K.eventGroups.has(g)))) return;
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

type Foo<T, From, To> = {
    [K in keyof T]: T[K] extends From ? To : T[K] extends (...args: any) => any ? (...args: Foo<Parameters<T[K]>, From, To>) => Foo<ReturnType<T[K]>, From, To> : Foo<T[K], From, To>;
}

export type KAPLAYControlGroupPlugin = Partial<Foo<KAPLAYCtx, KEventController, KEventControllerPatch>> & {
    eventGroups: Set<string>;
}
