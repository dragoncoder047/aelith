import { GameObj, KAPLAYCtx, SpriteAnimPlayOpt, SpriteComp } from "kaplay";

export interface KAPLAYSpritePlayRestartPlugin {
    sprite(...p: Parameters<KAPLAYCtx["sprite"]>): PSpriteComp;
}

export interface PSpriteAnimPlayOpt extends SpriteAnimPlayOpt {
    preventRestart?: boolean;
}

export interface PSpriteComp extends SpriteComp {
    play(anim: string, opt?: PSpriteAnimPlayOpt): void;
}

export function kaplaySpriteRestart(k: KAPLAYCtx): KAPLAYSpritePlayRestartPlugin {
    const oldSprite = k.sprite;
    return {
        sprite(name, opt) {
            const comp = oldSprite(name, opt);
            const oldPlay = comp.play;
            comp.play = function(this: GameObj<SpriteComp>, name, opt: PSpriteAnimPlayOpt) {
                if (opt?.preventRestart && this.getCurAnim()?.name === name)
                    return;
                oldPlay.call(this, name, opt);
            }
            return comp;
        }
    }
}
