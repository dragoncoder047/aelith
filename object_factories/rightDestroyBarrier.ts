import { BodyComp, CompList, GameObj } from "kaplay";
import { barrier } from "./barrier";
import { player } from "../player";

export function rightDestroyBarrier(): CompList<any> {
    return [
        ...barrier(),
        {
            add(this: GameObj<BodyComp>) {
                this.onPhysicsResolve(coll => {
                    if (coll.target === player && coll.isRight())
                        this.destroy();
                });
            }
        }
    ]
}
