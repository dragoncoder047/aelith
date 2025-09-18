import { EntityPrototypeData } from "../DataPackFormat";
import { JSONObject } from "../JSON";
import * as ScriptHandler from "../script/ScriptHandler";
import { Entity } from "./Entity";

var entityPrototypes: Record<string, EntityPrototypeData> = {};

export function setEntityLibrary(lib: Record<string, EntityPrototypeData>) {
    entityPrototypes = lib;
}

export function startHookOnEntity(entity: Entity, name: string, context: JSONObject): ScriptHandler.Task | null {
    const proto = entityPrototypes[entity.kind];
    if (!proto) throw new Error(`entity kind ${entity.kind} has no definition`);
    const hook = proto.hooks[name];
    if (!hook) return null;
    return ScriptHandler.spawnTask(hook.priority, hook.impl, entity, context);
}

const allEntities: Entity[] = [];

export function getEntityByName(entityName: string): Entity | undefined {
    return allEntities.find(e => e.id === entityName);
}
