import { AreaComp, BodyComp, GameObj, PosComp, StateComp, Vec2 } from "kaplay";
import type { Saveable } from ".";
import { CollisionerComp } from "../components/collisioner";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { InvisibleTriggerComp } from "../components/invisibleTrigger";
import { TogglerComp } from "../components/toggler";


export type LiveStateSaveable =
    | PosComp
    | BodyComp
    | CollisionerComp
    | TogglerComp
    | InvisibleTriggerComp
    | StateComp
    | AreaComp
    | Saveable;

export type LiveObjectState = {
    obj: GameObj<LiveStateSaveable>;
    where: string | null; // null = in inventory; string = which world
    pos?: Vec2;
    state: any; /*{
        toggle?: boolean;
        trigger?: boolean;
        bug?: string;
    } */
};

export type LiveState = {
    playerPos: Vec2;
    worldID: string;
    objects: LiveObjectState[];
    restoreParams?: ContinuationTrapComp["params"];
};


export type Snapshot = {
    objectsToBeDestroyed: Set<GameObj>;
    cancel(): void,
} & LiveState;