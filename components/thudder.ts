import { AudioPlayOpt, BodyComp, Comp, GameObj, PosComp } from "kaplay";
import { K } from "../init";
import { player } from "../player";

export interface ThudderComp extends Comp {
}

/**
 * Component that plays a sound when the object hits the floor.
 */
export function thudder(sounds: Record<string, string> = { grating: "thud_metal", else: "thud" }, soundOpts: AudioPlayOpt = {}, shouldPlay: () => boolean = () => true): ThudderComp {
    return {
        id: "thudder",
        require: ["body", "pos"],
        add(this: GameObj<BodyComp | PosComp>) {
            this.onGround(() => {
                if (K.time() > 0.1 && shouldPlay()) { // prevent spurious sounds when game starts
                    const spriteName = this.curPlatform()?.sprite as string;
                    const soundID = sounds[spriteName] || sounds.else;
                    if (soundID)
                        player.playSound(soundID, soundOpts, this.worldPos()!, this.vel.len());
                }
            });
        }
    };
}
