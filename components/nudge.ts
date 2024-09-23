import { GameObj, PosComp, Vec2Args } from 'kaplay';
import K from '../init';

export function nudge(...by: Vec2Args) {
    return {
        id: "nudge",
        require: ["pos"],
        add(this: GameObj<PosComp>) {
            const x = K.onUpdate(() => {
                // @ts-ignore
                this.moveBy(K.vec2(...by));
                this.unuse("nudge");
                x.cancel();
            });
        }
    };
}
