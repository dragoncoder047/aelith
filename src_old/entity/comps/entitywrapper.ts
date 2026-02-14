import { Comp } from "kaplay";
import { Entity } from "../Entity";

export interface EntityComp extends Comp {
    readonly entity: Entity;
}

export function entitywrapper(entity: Entity): EntityComp {
    return {
        id: "entity",
        get entity() {
            return entity;
        },
        inspect() {
            return [
                `motion state: ${entity.motionController.state}`,
                `animations running: ${entity.animator.animations.flatMap(({ name, running }) => running ? [name] : [])}`
            ].join("\n")
        }
    }
}
