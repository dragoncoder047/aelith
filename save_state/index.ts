import { Color, GameObj, OpacityComp, Vec2 } from "kaplay";
import { K } from "../init";
import { WorldManager } from "../levels";
import { player } from "../player";
import { ObjectSnapshot, RestoreFlags, StateComps, WorldSnapshot } from "./state";
import { CloneableComp } from "../components/cloneable";
import { splash } from "../misc/particles";
import { ContinuationComp } from "../components/continuationCore";


export const StateManager = {
    capture(params: WorldSnapshot["restoreParams"], selfPos: Vec2): WorldSnapshot {
        // Capture all of the objects
        const data: WorldSnapshot = {
            playerPos: params.useSelfPosition ? selfPos : player.worldPos()!,
            worldID: WorldManager.activeLevel!.id,
            restoreParams: Object.assign({}, params),
            objects: [],
            afterObjects: new Set,
        };
        if (params.radius > 0 || params.global) {
            for (var key of (params.global ? Object.keys(WorldManager.allLevels) : [WorldManager.activeLevel!.id])) {
                // find all the objects
                const circle = new K.Circle(data.playerPos, params.radius);
                const foundObjects = WorldManager.allLevels[key]!.levelObj.get<StateComps>("machine", { recursive: true })
                    .filter(obj =>
                        !obj.is("checkpoint")
                        && !obj.is("portal")
                        && (((obj as unknown as GameObj<OpacityComp>).opacity === 0
                            // If opacity is 0, it's a wind tunnel or something else, must use distance to pos
                            // else just let's see if it collides
                            ? undefined
                            : obj.worldArea?.().collides(circle))
                            ?? obj.worldPos()!.sdist(data.playerPos) < (params.radius * params.radius)))
                    .concat(player.inventory.filter(x => x.has("body")) as any);
                for (var obj of foundObjects) {
                    const inInventory = player.inventory.includes(obj as any);
                    const e: ObjectSnapshot = {
                        obj,
                        restoreFlags: this.getRestoreFlags(obj),
                        location: {
                            levelID: inInventory ? null : key,
                            pos: (inInventory ? data.playerPos : obj.worldPos()!).clone(),
                            angle: obj.angle,
                        },
                        state: {
                            toggle: obj.togglerState,
                            trigger: obj.triggered,
                            bug: obj.state,
                        },
                    };
                    data.objects.push(e);
                }
            }
        }
        if (params.destroysObjects) {
            // Must use onTag cause objects get tags later when they get cloned
            K.onTag((obj: any, tag: string) => {
                if (tag === "machine" || tag === "continuation") {
                    data.afterObjects.add(obj);
                }
            });
        }
        return data;
    },
    getRestoreFlags(obj: GameObj): number {
        var out = 0;
        if (obj.has("body") && !obj.isStatic)
            out |= RestoreFlags.pos;
        if (obj.has("toggler"))
            out |= RestoreFlags.toggle;
        if (obj.has("invisible-trigger"))
            out |= RestoreFlags.trigger;
        if (obj.has("bug"))
            out |= RestoreFlags.bug;
        return out;
    },
    async restore(state: WorldSnapshot, color: Color) {
        // do restore of captured data
        const p = player.worldPos()!;
        const delta = state.playerPos.sub(p);
        const reverseDelta = K.vec2(0);

        if (state.restoreParams.reverseTeleport) {
            // do move
            reverseDelta.x = -delta.x;
            reverseDelta.y = -delta.y;
            // don't move
            delta.x = delta.y = 0;
            state.worldID = WorldManager.activeLevel!.id;
        }

        if (state.worldID !== WorldManager.activeLevel!.id) {
            await WorldManager.goLevel(state.worldID, false, true);
        }
        if (!delta.isZero()) {
            player.tpTo(p.add(delta));
        }
        player.playSound("teleport");
        player.trigger("teleport");
        splash(player.pos, color);
        for (var e of state.objects) {
            var obj = e.obj;
            const canClone = e.obj.has("cloneable");
            const shouldClone = (
                !state.restoreParams.reverseTeleport
                && (player.inventory.includes(e.obj as any) ? state.playerPos : e.obj.pos)
                    .sdist(state.playerPos) > (state.restoreParams.radius * state.restoreParams.radius))
            obj.vel = K.vec2(0);
            if (e.restoreFlags & RestoreFlags.bug)
                obj.enterState(e.state.bug!);
            if (e.restoreFlags & RestoreFlags.toggle)
                obj.togglerState = state.restoreParams.fuzzStates ? !obj.togglerState : e.state.toggle!;
            if (e.restoreFlags & RestoreFlags.trigger)
                obj.triggered = e.state.trigger!;
            if (e.location.levelID !== null) {
                player.removeFromInventory(obj as any);
                const tLevel = WorldManager.allLevels[e.location.levelID]!.levelObj;
                obj.parent = tLevel;
                obj.hidden = tLevel.hidden;
                obj.paused = tLevel.paused;
                const off = typeof (obj as any).isOffScreen === "function" ? (obj as any).isOffScreen() : false;
                if (e.location.levelID === state.worldID
                    && !off
                    && (obj.has("toggler") || obj.has("bug"))
                    && (obj.has("body") || obj.is("interactable"))) {
                    splash(obj.pos, color, undefined, undefined, obj.tags.filter(x => x !== "*"));
                }
            }
            else {
                obj.paused = obj.hidden = true;
                player.addToInventory(obj as any);
            }
            if (e.restoreFlags & RestoreFlags.pos) {
                if (shouldClone && canClone) {
                    // It is out of range, clone it
                    obj = (e.obj as GameObj<StateComps | CloneableComp<StateComps>>).clone();
                    e.obj.tags.forEach(t => obj.tag(t));
                }
                // Update pos, angle
                obj.worldPos(e.location.pos.add(reverseDelta));
                obj.angle = e.location.angle;
            }
            // If it is a button or laser that *was* triggered by a box when captured, but
            // isn't triggered currently, the following happens when the continuation is
            // invoked:
            // 1. The box is moved back, so that it is triggering the button or laser.
            // 2. The button/laser state is surreptitiously restored by the continuation.
            // 3. On the next frame, the button/laser notices that it got triggered, and toggles
            //    state - undoing the continuation invocation.
            // To prevent #3 from occuring, the button/laser is told to ignore new triggers for
            // 5 physics frames (0.1 seconds) after being restored.
            if (obj.has("collisioner"))
                obj.ignoreTriggerTimeout = 5;
        }
        for (var obj of state.afterObjects) {
            if (!obj.exists()) continue;
            if (obj.has("continuation") && (obj as any as GameObj<ContinuationComp>).params?.destroyImmune) continue;
            obj.destroy();
        }
    },
};
