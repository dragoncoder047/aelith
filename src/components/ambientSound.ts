import { Comp, GameObj, PosComp, StateComp } from "kaplay";
import { isHidden, isPaused } from "../misc/utils";
import { player } from "../player";
import { TogglerComp } from "./toggler";

export interface AmbientSoundComp extends Comp {
    cur: ReturnType<typeof player.playSound> | undefined
    playLoop(which: string): void;
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
        add(this: GameObj<StateComp<(typeof states)[number]> | TogglerComp | AmbientSoundComp | PosComp>) {
            this.onStateEnter(states[0], () => {
                // turning off
                this.cur?.cancel();
                if (shutdown !== undefined) {
                    this.cur = player.playSound(shutdown, {}, this.worldPos()!, undefined, this);
                }
            });
            this.onStateEnter(states[1], () => {
                // turning on
                this.cur?.cancel();
                this.playLoop(startup ?? mainSound);
            });
            this.onPause(() => {
                if (this.cur) this.cur.paused = true;
            });
            this.onUnpause(() => {
                if (this.cur) this.cur.paused = false;
                else this.playLoop(mainSound);
            });
        },
        playLoop(this: GameObj<StateComp<(typeof states)[number]> | TogglerComp | AmbientSoundComp | PosComp>, which) {
            this.cur = player.playSound(which, {}, this.worldPos()!, undefined, this);
            if (this.cur) {
                this.cur.onEnd(() => this.playLoop(mainSound));
            }
        },
        destroy() {
            this.cur?.cancel();
        }
    };
}
