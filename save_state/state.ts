import { AreaComp, BodyComp, GameObj, PosComp, RotateComp, StateComp, Vec2 } from "kaplay";
import { CollisionerComp } from "../components/collisioner";
import { ContinuationTrapComp } from "../components/continuationTrap";
import { InvisibleTriggerComp } from "../components/invisibleTrigger";
import { TogglerComp } from "../components/toggler";


export type StateComps =
    | PosComp
    | RotateComp
    | BodyComp
    | CollisionerComp
    | TogglerComp
    | InvisibleTriggerComp
    | StateComp<string>
    | AreaComp;

export type ObjectLocation = {
    pos: Vec2;
    levelID: string | null;
    angle: number;
}

export type ObjectState = {
    toggle?: boolean;
    trigger?: boolean;
    bug?: string;
}

export enum RestoreFlags {
    pos = 1,
    toggle = 2,
    trigger = 4,
    bug = 8,
}

export type ObjectSnapshot = {
    restoreFlags: number,
    obj: GameObj<StateComps>;
    location: ObjectLocation,
    state: ObjectState
};

export type WorldSnapshot = {
    playerPos: Vec2;
    worldID: string;
    objects: ObjectSnapshot[];
    restoreParams: ContinuationTrapComp["params"];
    afterObjects: Set<GameObj<StateComps>>;
};
