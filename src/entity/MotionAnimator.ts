import { EntityModelData } from "../DataPackFormat";
import { Entity } from "./Entity";

enum MotionState {
    STOPPED,
    WALKING,
    CLIMBING,
}

export class MotionAnimator {
    state = MotionState.STOPPED;
    constructor(public obj: Entity, public data: EntityModelData["kinematics"]) {
    }
}
