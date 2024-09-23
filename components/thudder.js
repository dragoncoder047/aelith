import K from '../init.js';

/**
 * Component that plays a sound when the object hits the floor.
 * @param {string} [soundID="thud"]
 * @param {import("kaplay").AudioPlayOpt} [soundOpts={}]
 */
export function thudder(soundID = "thud", soundOpts = {}) {
    return {
        id: "thudder",
        require: ["body"],
        add() {
            this.onGround(() => {
                if (K.time() > 0.1) // prevent spurious sounds when game starts
                    K.play(soundID, soundOpts);
            });
        }
    };
}
