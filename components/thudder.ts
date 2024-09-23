import { AudioPlayOpt, BodyComp, GameObj } from 'kaplay';
import K from '../init';

/**
 * Component that plays a sound when the object hits the floor.
 */
export function thudder(soundID: string = "thud", soundOpts: AudioPlayOpt = {}) {
    return {
        id: "thudder",
        require: ["body"],
        add(this: GameObj<BodyComp>) {
            this.onGround(() => {
                if (K.time() > 0.1) // prevent spurious sounds when game starts
                    K.play(soundID, soundOpts);
            });
        }
    };
}
