import { Vec2 } from "kaplay";
import { K } from "../context";
import { EntityData, EntityPrototypeData } from "../DataPackFormat";
import { JSONObject, JSONValue } from "../JSON";
import * as RoomManager from "../room/RoomManager";
import * as ScriptHandler from "../script/ScriptHandler";
import { Entity } from "./Entity";


var entityPrototypes: Record<string, EntityPrototypeData> = {};

export function setEntityLibrary(lib: Record<string, EntityPrototypeData>) {
    entityPrototypes = lib;
}

export function getEntityPrototypeStrict(name: string): EntityPrototypeData {
    const proto = entityPrototypes[name];
    if (!proto) throw new Error(`entity kind ${name} has no definition`);
    return proto;
}

export function startHookOnEntity(entity: Entity, name: string, context: JSONObject): ScriptHandler.Task | null {
    const proto = getEntityPrototypeStrict(entity.kind);
    var hook = proto.hooks?.[name] as any;
    if (!hook) return null;
    if (Array.isArray(hook)) hook = { impl: hook, priority: 0 };
    return ScriptHandler.spawnTask(hook.priority, hook.impl, entity, context);
}

const allEntities: Entity[] = [];

export function getEntityByName(entityName: string): Entity | undefined {
    return allEntities.find(e => e.id === entityName);
}

var idc = 0;
function blankEntityId(forKind: string) {
    for (; ;) {
        const newId = forKind + (idc++);
        if (allEntities.every(e => e.id !== newId)) return newId;
    }
}

export function spawnEntityInRoom(slotPos: Vec2, inRoom: string | null, data: EntityData): Entity {
    const realPos = (data.pos ? K.vec2(data.pos.x, data.pos.y) : K.vec2()).add(slotPos);
    const e = new Entity(data.id ?? blankEntityId(data.kind), inRoom, data.kind, data.state, realPos, data.leashed, data.linkGroup, data.lights);
    allEntities.push(e);
    startHookOnEntity(e, "setup", {});
    if (RoomManager.getCurrentRoom() === inRoom) {
        e.load();
    }
    return e;
}

export function loadAllEntitiesInRoom(id: string) {
    allEntities.forEach(e => e.currentRoom === id && e.load());
}

export function destroyEntity(e: Entity) {
    const i = allEntities.indexOf(e);
    if (i >= 0) {
        allEntities.splice(i, 1);
        e.destroy();
        ScriptHandler.killAllTasksControlledBy(e);
    }
}

export function teleportEntityTo(e: Entity, room: string | null, pos: Vec2) {
    if (e.currentRoom !== room) {
        const cr = RoomManager.getCurrentRoom();
        if (e.currentRoom === cr) e.destroy();
        else if (room === cr) e.load();
    }
    e.setPosition(pos);
}

export function objIsAlreadyOwned(e: Entity) {
    return allEntities.some(e2 => e2.inventory.slots.includes(e));
}

export function broadcastMessage(linkGroup: string, message: string, context: JSONValue) {
    for (var e of allEntities) {
        if (e.linkGroup === linkGroup) startHookOnEntity(e, "message", { message, context });
    }
}

var activePlayer: Entity | null = null;
export function setPlayer(e: Entity | null) {
    activePlayer = e;
}

export function getPlayer(): Entity | null {
    return activePlayer;
}
