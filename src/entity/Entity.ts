import { Comp, GameObj, PosComp } from "kaplay";
import { LightComp } from "kaplay-lighting";
import { K } from "../context";
import { EntityData, XY } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import { Serializable } from "../Serializable";
import { EntityAnimation } from "./Animation";

interface EntityComp extends Comp {
    readonly entity: Entity;
}

type EntityComponents = EntityComp | PosComp;

export class Entity implements Serializable {
    obj: GameObj<EntityComponents>;
    bones: Record<string, GameObj<EntityComponents>> = {};
    lights: GameObj<PosComp | LightComp>[] = [];
    currentAnimations: EntityAnimation[] = [];
    constructor(
        public id: string,
        public kind: string,
        public state: JSONObject
    ) {
        const self = this;
        this.obj = K.add([
            {
                id: "entity",
                get entity() { return self; },
                update() { self.update(); }
            } as EntityComp,
            K.pos(),
        ]);
        buildSkeleton(this);
    }
    toJSON(): EntityData {
        return {
            id: this.id,
            kind: this.kind,
            state: this.state,
            lights: this.lights.map(l => [
                l.pos.toArray() as XY,
                l.light!.radius,
                l.light!.strength,
                l.light!.color.toHex(),
                [] // TODO: serialize light tags once it's implemented
            ]),
            pos: this.obj.pos.toArray() as XY,
        }
    }
    update() {
        // TODO: update animations
    }
}
