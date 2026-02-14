import { Vec2 } from "kaplay";
import { K } from "../../src/context";
import * as InputManager from "../controls/InputManager";
import { EntityData, EntityPrototypeData } from "../DataPackFormat";
import * as GameManager from "../GameManager";
import { JSONValue } from "../../src/utils/JSON";
import * as RoomManager from "../room/RoomManager";
import * as SceneManager from "../scenes/SceneManager";
import { DisplayEntity } from "./DisplayEntity";
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

const allEntities: Entity[] = [];
const allDisplayEntities: DisplayEntity[] = [];

export function registerDisplayEntity(e: DisplayEntity) {
    allDisplayEntities.push(e);
}

export function getEntityByName(entityName: string): Entity | undefined {
    return allEntities.find(e => e.id === entityName) ?? allDisplayEntities.find(e => e.id === entityName);
}

var idc = 0;
export function blankEntityId(forKind: string) {
    for (; ;) {
        const newId = forKind + (idc++);
        if (allEntities.every(e => e.id !== newId)) return newId;
    }
}

function _createEntity(data: EntityData, inRoom: string | null, realPos: Vec2) {
    const entity = new Entity(data.id ?? blankEntityId(data.kind), inRoom, data.kind, data.state ?? {}, realPos, data.leashed, data.linkGroup);
    if (data.inventory) {
        for (var i = 0; i < data.inventory.length; i++) {
            const obj = data.inventory[i]!;
            if (typeof obj === "string") {
                entity.inventory.silentAdd(getEntityByName(obj)!);
            } else {
                const e2 = spawnEntityInRoom(K.Vec2.ZERO, null, obj);
                data.inventory[i] = e2.id;
                entity.inventory.silentAdd(e2);
            }
        }
    }
    return entity;
}

export function spawnEntityInRoom(slotPos: Vec2, inRoom: string | null, data: EntityData): Entity {
    const realPos = (data.pos ? K.Vec2.deserialize(data.pos) : K.vec2()).add(slotPos);
    const e = _createEntity(data, inRoom, realPos);
    allEntities.push(e);
    if (RoomManager.getCurrentRoom() === inRoom) {
        e.load();
    }
    return e;
}

export function loadAllEntitiesInRoom(id: string) {
    allEntities.forEach(e => e.currentRoom === id && e.load());
}

export function destroyEntity(e: Entity) {
    if (getPlayer() === e) {
        throw new Error("Cannot remove active player.");
    }
    const i = allEntities.indexOf(e);
    if (i >= 0) {
        allEntities[i] = allEntities.pop()!;
        e.destroy();
        return true;
    }
    return false;
}

export function teleportEntityTo(e: Entity, room: string | null, pos: Vec2) {
    if (e.currentRoom !== room) {
        const cr = RoomManager.getCurrentRoom();
        if (e.currentRoom === cr) e.unload();
        else if (room === cr) e.load();
    }
    e.setPosition(pos);
}

export function objIsAlreadyOwned(e: Entity) {
    return allEntities.some(e2 => e2.inventory.slots.includes(e));
}

export function broadcastMessage(linkGroup: string, message: string, context: JSONValue) {
    for (var e of allEntities) {
        if (e.linkGroup === linkGroup) e.startHook("message", { message, context });
    }
}

var activePlayer: Entity | null = null;
export function setPlayer(e: Entity | null) {
    if (activePlayer !== e) {
        (activePlayer = e)?.startHook("becamePlayer");
    }
}

export function getPlayer(): Entity | null {
    return activePlayer;
}

K.onSceneLeave(() => {
    allDisplayEntities.length = 0;
});

export function installControlsHandler() {
    K.onUpdate(() => {
        const p = getPlayer();
        if (p) {
            if (RoomManager.getCurrentRoom()?.id !== p.currentRoom) {
                K.go(SceneManager.Scene.ROOM, p.currentRoom);
                return;
            }
            const m = "isButtonPressed";
            // Move and/or climb
            p.doMove(InputManager.getMotionInput("move", p), K.isButtonDown("sprint"));
            // Look
            p.lookInDirection(InputManager.getMotionInput("look", p));
            // Jump
            if (K[m]("jump")) p.tryJump();
            // Actions
            const ACTIONS = ["action1", "action2", "action3", "action4", "target1", "target2", "action5", "action6"];
            for (var i = 0; i < ACTIONS.length; i++) {
                if (K[m](ACTIONS[i])) p.doAction(ACTIONS[i]!);
            }
            // Camera follow
            const alpha = K.dt() * Math.LN2;
            K.setCamPos(K.lerp(K.getCamPos(), p.pos, alpha / GameManager.getDefaultValue("cameraPanAlpha")));
            // Zoom in
            K.setCamScale(K.lerp(K.getCamScale(), K.vec2(p.getPrototype().behavior?.camScale ?? 1), alpha / GameManager.getDefaultValue("cameraScaleAlpha")));
        }
    });
}
