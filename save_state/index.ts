import { CompList, GameObj } from "kaplay";
import { WorldManager } from "../levels";
import { player } from "../player";
import { DeadObjectState, DeadState } from "./dead";
import { LiveObjectState, LiveStateSaveable, LiveState, Snapshot } from "./live";
import { K } from "../init";

export interface Saveable {
    liveState(): LiveObjectState["state"];
    deadState(): DeadObjectState["state"];
    reviver: string;
    restoreLiveState(state: LiveObjectState["state"]): void;
    restoreDeadState(state: DeadObjectState["state"]): void;
}

type ReviveFunction = () => CompList<any>;

export const StateManager = {
    revivers: {} as Record<string, ReviveFunction>,
    registerReviver(id: string, factory: ReviveFunction) {
        this.revivers[id] = factory;
    },
    snapshot(restoreParams: LiveState["restoreParams"]): Snapshot {
        const c1 = K.onTag((obj, tag) => {
            if (tag === "saveable") theState.objectsToBeDestroyed.add(obj);
        });
        const c2 = K.onDestroy("saveable", obj => theState.objectsToBeDestroyed.delete(obj));
        const theState: Snapshot = {
            playerPos: player.pos,
            worldID: WorldManager.activeLevel!.id,
            objects: [],
            objectsToBeDestroyed: new Set<GameObj>,
            cancel() { c1.cancel(); c2.cancel(); },
            restoreParams,
        };
        for (var id of Object.keys(WorldManager.allLevels)) {
            for (var obj of WorldManager.allLevels[id]!.levelObj.get<LiveStateSaveable>("saveable")) {
                if (!this.isSaveable(obj)) throw new Error("Not saveable obj " + obj.tags);
                theState.objects.push({
                    obj,
                    where: id,
                    state: obj.liveState(),
                });
            }
        }
        return theState;
    },
    restoreSnapshot(snapshot: Snapshot) {
        snapshot.cancel();
        for (var s of snapshot.objects) {
            s.obj.pos = s.pos!;
            s.obj.restoreLiveState(s.state);
        }
        player.tpTo(snapshot.playerPos);
        snapshot.objectsToBeDestroyed.forEach(o => o.destroy());
    },
    captureLive(captureParams: LiveState["restoreParams"]): LiveState {
        if (captureParams?.global) return this.snapshot(captureParams);
    },
    restoreDead(state: DeadState) {
        throw "TODO";
    },
    restoreLive(state: LiveState) {
        if (state.restoreParams?.global) return this.restoreSnapshot(state as any);
        throw "TODO";
    },
    liveStateFor(obj: GameObj<LiveStateSaveable>, state: LiveObjectState["state"]): LiveObjectState {
        return {
            obj,
            where: player.inventory.includes(obj as any) ?
                null
                : WorldManager.activeLevel!.id,
            state,
        }
    },
    isSaveable(obj: GameObj) {
        return (
            typeof obj.toLiveState === "function"
            && obj.toLiveState.length === 0
            && typeof obj.toDeadState === "function"
            && obj.toDeadState.length === 0
        );
    }
};
