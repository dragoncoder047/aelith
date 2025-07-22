import { Comp, GameObj, PosComp, StateComp } from "kaplay";
import { player } from "../player";
import { TogglerComp } from "./toggler";
import { isPaused } from "../misc/utils";

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
    return {} as AmbientSoundComp;
    // XXX: This component is causing a HUGE amount of lag so I just disabled it so that the game is playable.
    return {
        id: "ambient-sound",
        require: ["state", "toggler", "pos"],
        cur: undefined,
        add(this: GameObj<StateComp<(typeof states)[number]> | TogglerComp | AmbientSoundComp | PosComp>) {
            this.onStateEnter(states[0], () => {
                // turning off
                this.cur?.cancel();
                if (shutdown !== undefined) {
                    this.cur = player.playSound(shutdown, { loop: false }, this.worldPos()!, undefined, this);
                }
            });
            this.onStateEnter(states[1], () => {
                // turning on
                this.cur?.cancel();
                const recurse = (sound: string) => {
                    console.log("playing sound", sound, "on object with tags", this.tags, "me paused=", isPaused(this));
                    this.cur = player.playSound(sound, { loop: false }, this.worldPos()!, undefined, this);
                    if (this.cur) this.cur.onEnd(() => recurse(mainSound));
                    else setTimeout(recurse, 10, mainSound);
                };
                recurse(startup || mainSound);
            });
            this.onPause(() => {
                if (this.cur) this.cur.paused = true;
            });
            this.onUnpause(() => {
                if (this.cur) this.cur.paused = false;
            });
        },
    };
}
