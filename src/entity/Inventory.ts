import { K } from "../context";
import { DisplayEntity } from "./DisplayEntity";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";

export class RefuseTake extends Error {
    message = "REFUSE_TAKE";
    name = "REFUSE_TAKE";
}

export class Inventory {
    size: number | undefined;
    slots: Entity[] = [];
    maxSlots: number | undefined;
    private _occupied = 0;
    displayed: DisplayEntity | null = null;
    private _handsBone: string | undefined
    constructor(public me: Entity) {
        const b = me.getPrototype().behavior;
        if (b) {
            this.size = b.inventorySize;
            this.maxSlots = b.inventorySlots;
            this._handsBone = b.inventoryHolder;
        }
    }
    async tryAdd(obj: Entity) {
        const otherSize = obj.inventory.size;
        if (otherSize === undefined || this.maxSlots === undefined) return "cannotTake";
        if ((this._occupied + otherSize) > this.maxSlots) return "noRoom";
        // TODO: this is a very expensive check.
        if (EntityManager.objIsAlreadyOwned(obj)) return "cannotTake";
        const t = obj.startHook("taken", { taker: this.me.id });
        if (t) {
            const v = await new Promise<any>(res => t.onFinish(res));
            if (t.failed && v instanceof RefuseTake) return "refused";
        }
        this.me.startHook("take", { taken: obj.id });
        this._occupied += otherSize;
        this.slots.push(obj);
        EntityManager.teleportEntityTo(obj, null, K.Vec2.ZERO);
        this.displayObj(obj);
        return "taken";
    }
    drop(obj: Entity) {
        const i = this.slots.indexOf(obj);
        if (i < 0) return false;
        this.slots.splice(i, 1);
        this._occupied -= obj.inventory.size!;
        const pos = (this._handsBone ? this.me.bones[this._handsBone]! : this.me.obj!).pos;
        EntityManager.teleportEntityTo(obj, this.me.currentRoom, pos);
        return true;
    }
    displayObj(obj: Entity | null) {
        if (obj && !this.slots.includes(obj)) return false;
        if (this.me.obj && this.displayed) {
            this.displayed.unload();
            this.displayed = null;
        }
        if (obj) {
            this.displayed = obj.toDisplayEntity();
            obj.obj!.parent = this._handsBone ? this.me.bones[this._handsBone]! : this.me.obj;
            obj.setPosition(K.vec2());
        }
        return true;
    }
    update() {
        // nothing?
    }
}
