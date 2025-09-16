import { KGamepadStick, Vec2 } from "kaplay";
import { K } from "../context";

export abstract class DirectionalInput {
    constructor(public axes: Vec2) { };
    protected abstract raw(): Vec2;
    poll() { return this.raw().scale(this.axes); }
}

export class GamepadInput extends DirectionalInput {
    constructor(public stick: KGamepadStick, axes: Vec2 = K.Vec2.ONE) { super(axes); }
    raw() { return K.getGamepadStick(this.stick); }
}

const NOT_A_BUTTON = "NOT_A_BUTTON" as any;

export class ButtonsDpadInput extends DirectionalInput {
    constructor(public left: string = NOT_A_BUTTON, public right: string = NOT_A_BUTTON, public down: string = NOT_A_BUTTON, public up: string = NOT_A_BUTTON) { super(K.Vec2.ONE); }
    raw() { return K.vec2(+K.isButtonDown(this.right) - +K.isButtonDown(this.left), +K.isButtonDown(this.down) - +K.isButtonDown(this.up)).unit(); }
}
