import { Asset, KAPLAYCtx } from "kaplay";

export type RumbleArgs =
    | [number, number, number] // strong, weak, duration
    | [string] // effect name
    | [number, number, number, number] // strong, weak, duration, player number
    | [string, number]; // effect name, player number

    export type RumbleEffect = number[][]

export type GamepadRumbleObj = {
    enabled: boolean
    onlyWhenGamepadInUse: boolean
} & ((...args: RumbleArgs) => Promise<void>)

export interface KAPLAYRumblePlugin {
    rumble: GamepadRumbleObj
    loadRumbleEffects: (effects: Record<string, RumbleEffect>) => Asset<Record<string, RumbleEffect>>
    rumbleEffects: Record<string, RumbleEffect>
}

export function kaplayRumble(K: KAPLAYCtx & KAPLAYRumblePlugin): KAPLAYRumblePlugin {
    const rumbleFunc: GamepadRumbleObj = async (...args: RumbleArgs) => {
        if (!rumbleFunc.enabled) return;
        if (rumbleFunc.onlyWhenGamepadInUse && K.getLastInputDeviceType() !== "gamepad") return;
        var gamepads = navigator.getGamepads();
        var effect: ([number, number, number] | [number, number])[];
        var playerNumber: number | undefined;
        if (!gamepads) return;
        if (typeof args[0] === "string") {
            // @ts-ignore
            effect = K.rumbleEffects[args[0]];
            playerNumber = args[1];
        } else {
            effect = [args.slice(0, 3) as [number, number, number]];
            playerNumber = args[3];
        }
        if (playerNumber !== undefined) gamepads = [gamepads[playerNumber]!];
        for (const [left, right, ...time] of effect) {
            const timeslice = time[0] ?? 100;
            for (const gamepad of gamepads) {
                if (!gamepad) continue;
                const rumbleMotors: GamepadHapticActuator[] =
                    // @ts-ignore
                    gamepad.hapticActuators
                    ?? [];
                if (gamepad.vibrationActuator) rumbleMotors.push(gamepad.vibrationActuator);
                await Promise.all(rumbleMotors.map(motor =>
                    motor.playEffect("dual-rumble", {
                        strongMagnitude: left,
                        weakMagnitude: right,
                        duration: timeslice
                    })));
            }
        }
    }
    rumbleFunc.enabled = true;
    rumbleFunc.onlyWhenGamepadInUse = true;
    return {
        rumbleEffects: {},
        rumble: rumbleFunc,
        loadRumbleEffects(effects) {
            Object.assign(K.rumbleEffects, effects);
            return K.load(Promise.resolve(effects));
        },
    };
}
