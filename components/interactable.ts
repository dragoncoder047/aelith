import { Comp, GameObj, PosComp, SpriteComp, Vec2 } from "kaplay";
import { hintFlags } from "../player/body";

export interface InteractableComp extends Comp {
    action1Hint?: string;
    action1?(): boolean;
    action2Hint?: string;
    action2?(targeted: GameObj<PosComp> | undefined): boolean;
    action3Hint?: string;
    action3?(): boolean;
    action4Hint?: string;
    action4?(): boolean;
    moveHint?: string;
    motionHandler?(motion: Vec2): boolean;
    target1Hint?: string;
    target1?(): boolean;
    target2Hint?: string;
    target2?(): boolean;
    tellMe?(): string;
    manpage?: {
        header: string;
        section: string;
        secName: string;
        body: string;
        spriteSrc: GameObj<SpriteComp>;
    },
    specialFlags: number;
}

export function interactable(): InteractableComp {
    // For the most part, other components will insert themselves
    // into the optional properties of this component.
    return {
        id: "interactable",
        specialFlags: hintFlags.all,
    }
}


