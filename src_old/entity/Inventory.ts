import { K } from "../../src/context";
import { DisplayEntity } from "./DisplayEntity";
import { Entity } from "./Entity";
import * as EntityManager from "./EntityManager";

export class RefuseTake extends Error {
    message = "REFUSE_TAKE";
    name = "REFUSE_TAKE";
}

export class Inventory {
    readonly size: number | undefined;
    slots: Entity[] = [];
    readonly maxSlots: number | undefined;
    private _occupied = 0;
    displayed: DisplayEntity | null = null;
    holdingIndex = 0;
    private readonly _handsBone: string | undefined
    constructor(public me: Entity) {
        const b = me.getPrototype().behavior;
        if (b) {
            this.size = b.inventorySize;
            this.maxSlots = b.inventorySlots;
            this._handsBone = b.inventoryHolder;
        }
    }
    silentAdd(obj: Entity) {
        this._occupied += obj.inventory.size ?? 0;
        this.slots.push(obj);
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
        this.silentAdd(obj);
        this.switchHoldingTo(obj);
        EntityManager.teleportEntityTo(obj, null, K.Vec2.ZERO);
        this.displayObj();
        return "taken";
    }
    currentObject() {
        return this.slots[this.holdingIndex];
    }
    has(e: Entity) {
        return this.slots.includes(e);
    }
    switchHoldingTo(obj: Entity | null) {
        if (obj === null) {
            this.holdingIndex = -1;
        }
        else {
            if (!this.has(obj)) return false;
            this.holdingIndex = this.slots.indexOf(obj);
        }
        this.displayObj();
        return true;
    }
    silentRemove(obj: Entity) {
        const i = this.slots.indexOf(obj);
        if (i < 0) return;
        this.slots.splice(i, 1);
        this._occupied -= obj.inventory.size ?? 0;
    }
    drop(obj: Entity) {
        if (!this.slots.includes(obj)) return;
        this.silentRemove(obj);
        const pos = this.hand?.worldPos ?? this.me.pos;
        EntityManager.teleportEntityTo(obj, this.me.currentRoom, pos);
        return true;
    }
    get hand() {
        return this._handsBone ? this.me.bones[this._handsBone]! : this.me.obj;
    }
    displayObj() {
        if (this.me.obj && this.displayed) {
            this.displayed.unload();
            this.displayed = null;
        }
        const obj = this.currentObject();
        if (obj) {
            const d = this.displayed = obj.toDisplayEntity();
            d.setPosition(K.vec2());
            if (this.me.obj) {
                d.obj!.parent = this.hand;
                for (var bone of Object.values(d.bones)) {
                    if (!d.obj!.isAncestorOf(bone)) bone.parent = d.obj!.parent;
                }
            }
        }
    }
    update() {
        this.displayed?.setPosition(K.vec2());
    }
}
