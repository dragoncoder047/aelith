import { KGamepadStick, Vec2 } from "kaplay";
import { K } from "../context";
import { Entity } from "../entity/Entity";
import { STICK_DEADZONE } from "../static/constants";

export abstract class DirectionalInput {
    constructor(public axes: Vec2) { };
    protected abstract raw(entity: Entity | null): Vec2;
    poll(entity: Entity | null) { return this.raw(entity).scale(this.axes); }
}

export class GamepadInput extends DirectionalInput {
    constructor(public stick: KGamepadStick, axes: Vec2 = K.Vec2.ONE) { super(axes); }
    raw() {
        const s = K.getGamepadStick(this.stick);
        if (s.slen() > STICK_DEADZONE * STICK_DEADZONE) return s;
        return K.Vec2.ZERO;
    }
}

const NOT_A_BUTTON = "NOT_A_BUTTON" as any;

export class ButtonsDpadInput extends DirectionalInput {
    constructor(public left: string = NOT_A_BUTTON, public right: string = NOT_A_BUTTON, public down: string = NOT_A_BUTTON, public up: string = NOT_A_BUTTON) { super(K.Vec2.ONE); }
    raw() { return K.vec2(+K.isButtonDown(this.right) - +K.isButtonDown(this.left), +K.isButtonDown(this.down) - +K.isButtonDown(this.up)).unit(); }
}

export class MouseWheelInput extends DirectionalInput {
    delta: Vec2 = K.Vec2.ZERO;
    constructor(axes: Vec2) {
        super(axes);
        K.onScroll(delta => this.delta = delta);
        K.onDraw(() => this.delta = K.Vec2.ZERO);
    }
    raw() { return this.delta; }
}

export class MouseMoveInput extends DirectionalInput {
    constructor() {
        super(K.Vec2.ONE);
    }
    raw(entity: Entity | null) {
        if (K.getLastInputDeviceType() === "gamepad") return K.Vec2.ZERO;
        if (!entity) return K.mouseDeltaPos();
        const head = entity.getHead()!;
        return K.mousePos().sub(head.worldPos()!);
    }
}
