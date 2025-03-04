import { JSONSerializable } from "../misc/utils";

export type DeadObjectState = {
    reviver: string;
    where: string | null; // null = in player inventory
    pos?: { x: number, y: number };
    state: JSONSerializable;
}

export type DeadState = {
    playerPos: { x: number, y: number };
    world: string;
    worldState: Record<string, DeadObjectState[]>;
}