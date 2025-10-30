import { K } from "../context";
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
    displayed: Entity | null = null;
    private _handsBone: string | undefined
    constructor(public me: Entity) {
        const { inventorySize, inventorySlots, inventoryHolder } = me.getPrototype().behavior;
        this.size = inventorySize;
        this.maxSlots = inventorySlots;
        this._handsBone = inventoryHolder;
    }
    async tryAdd(obj: Entity) {
        const otherSize = obj.inventory.size;
        if (otherSize === undefined || this.maxSlots === undefined) return "cannotTake";
        if ((this._occupied + otherSize) > this.maxSlots) return "noRoom";
        if (EntityManager.objIsAlreadyOwned(obj)) return "cannotTake";
        const t = EntityManager.startHookOnEntity(obj, "taken", { taker: this.me.id });
        if (t) {
            const v = await new Promise(res => t.onFinish(res));
            if (t.failed && v instanceof RefuseTake) return "refused";
        }
        EntityManager.startHookOnEntity(this.me, "take", { taken: obj.id });
        this._occupied += otherSize;
        this.slots.push(obj);
        obj.currentRoom = null;
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
    displayObj(obj: Entity) {
        if (!this.slots.includes(obj)) return false;
        if (this.me.obj && this.displayed) {
            this.displayed.destroy();
        }
        this.displayed = obj;
        return true;
    }
    update() {
        const o = this.displayed;
        if (!o) return;
        o.load();
        o.obj!.parent = this._handsBone ? this.me.bones[this._handsBone]! : this.me.obj;
        // Pull it to the middle
        o.setPosition(K.vec2());
        // Reset velocity to prevent infinite falling
        (o as any).obj.vel = K.vec2();
    }
}
