import { BodyComp, GameObj } from "kaplay";
import { K } from "../init";
import { player } from "../player";
import { barrier } from "./barrier";

export function onetimeCushion() {
    return [
        ...barrier(),
        {
            add(this: GameObj<BodyComp>) {
                this.onBeforePhysicsResolve(c => {
                    if (c.target === player) {
                        player.vel = K.vec2(0);
                        this.destroy();
                    }
                });
            }
        }
    ]
}
