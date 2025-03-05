import { BodyComp, Comp, GameObj, NamedComp, PlatformEffectorComp, PosComp, RotateComp } from "kaplay";
import { K } from "../init";
import { WorldManager } from "../levels";
import { player } from "../player";

export interface PortalComp extends Comp {
    toLevel: string | undefined,
    outPortal: string | undefined,
    displayAngle: number;
}

export function portalComp(): PortalComp {
    return {
        id: "portal",
        require: ["pos", "area", "platformEffector", "named"],
        toLevel: undefined,
        outPortal: undefined,
        displayAngle: 0,
        add(this: GameObj<PosComp | BodyComp | PortalComp | PlatformEffectorComp | NamedComp | RotateComp>) {
            this.onPhysicsResolve(c => {
                const o = c.target;
                if (o.is("machine")
                    || o.is("continuation")
                    || o.is("promise")
                    || o === player) {
                    const targetLevel = WorldManager.allLevels[this.toLevel!]!;
                    const matchingPortal: GameObj<PosComp | PlatformEffectorComp> | undefined = targetLevel.levelObj.children.find(g => g.name === this.outPortal) as any;
                    if (!matchingPortal) throw new Error("No matching portal for id " + this.outPortal);
                    const mpp = matchingPortal.worldPos()!;
                    player.playSound("portal_teleport", undefined, this.worldPos()!);
                    if (o === player) {
                        WorldManager.goLevel(this.toLevel!).then(() => player.tpTo(mpp));
                    }
                    else {
                        o.setParent(targetLevel.levelObj, { keep: K.KeepFlags.Pos });
                        o.worldPos(mpp);
                    }
                    matchingPortal.platformIgnore.add(o);
                }
            });
            this.use(K.shader("portal", () => {
                return {
                    u_angle: K.deg2rad(this.displayAngle),
                    u_time: K.time(),
                    u_staticrand: this.id!,
                };
            }));
            this.on("postprocess", () => {
                this.displayAngle = this.angle;
                this.angle = 0;
            });
        },
    }
}
