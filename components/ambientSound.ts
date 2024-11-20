import { Comp, GameObj, PosComp, StateComp } from "kaplay";
import { player } from "../player";
import { TogglerComp } from "./toggler";

export interface AmbientSoundComp extends Comp {
    cur: ReturnType<typeof player.playSound> | undefined
}

/**
 * Plays ambient sounds when the object is "on".
 * @param mainSound The sound to be played on loop while the object is "on".
 * @param startup The sound to play once when the object first turns "on", before playing the `mainSound`.
 * @param shutdown The sound to play right after the object turns "off".
 */
export function ambiance(mainSound: string, startup?: string, shutdown?: string, states: [string, string] = ["off", "on"]): AmbientSoundComp {
    return {
        id: "ambient-sound",
        require: ["state", "toggler", "pos"],
        cur: undefined,
        add(this: GameObj<StateComp | TogglerComp | AmbientSoundComp | PosComp>) {
            this.onStateEnter(states[0], () => {
                // turning off
                if (this.cur) this.cur.cancel();
                this.cur = undefined;
                if (shutdown !== undefined) {
                    this.cur = player.playSound(shutdown, undefined, this.worldPos()!);
                }
            });
            this.onStateEnter(states[1], () => {
                // turning on
                if (this.cur) this.cur.cancel();
                this.cur = undefined;
                const recurse = (sound: string) => {
                    this.cur = player.playSound(sound, undefined, this.worldPos()!);
                    this.cur?.onEnd(() => recurse(mainSound));
                };
                recurse(startup || mainSound);
            });
        },
    };
}
