import { Vec2 } from "kaplay";
import { K } from "../context";
import { EntityData, EntityPrototypeData } from "../DataPackFormat";
import { JSONObject } from "../JSON";
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
    console.log(name, hook);
    return ScriptHandler.spawnTask(hook.priority, hook.impl, entity, context);
}

const allEntities: Entity[] = [];

export function getEntityByName(entityName: string): Entity | undefined {
    return allEntities.find(e => e.id === entityName);
}

export function spawnEntityInRoom(slotPos: Vec2, inRoom: string | null, data: EntityData): Entity {
    const realPos = (data.pos ? K.vec2(data.pos.x, data.pos.y) : K.vec2()).add(slotPos);
    const e = new Entity(data.id, inRoom, data.kind, data.state, realPos, data.leashed, data.linkGroup, data.lights);
    allEntities.push(e);
    return e;
}

export function loadAllEntitiesInRoom(id: string) {
    allEntities.forEach(e => e.currentRoom === id && e.load());
}

export function destroyEntity(entity: Entity) {
    if (allEntities.includes(entity))
        allEntities.splice(allEntities.indexOf(entity), 1);
    ScriptHandler.killAllTasksControlledBy(entity);
}

var activePlayer: Entity | null = null;
export function setPlayer(e: Entity | null) {
    activePlayer = e;
}

export function getPlayer(): Entity | null {
    return activePlayer;
}
