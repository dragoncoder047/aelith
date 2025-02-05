import { Asset, KAPLAYCtx } from "kaplay";

export type RumbleArgs =
    | [string] // effect name
    | [string, number] // effect name, player number
    | [number, number, number] // strong, weak, duration
    | [number, number, number, number] // strong, weak, duration, player number
    | [number, number, number, number, number] // strong, weak, trig left, trig right, duration
    | [number, number, number, number, number, number] // strong, weak, trig left, trig right, duration, player number

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
    function fixPrestoredEffect(effect: ([number, number, number] | [number, number, number, number, number])[]): [number, number, number, number, number][] {
        return effect.map(f => {
            switch (f.length) {
                case 3:
                    return [f[0], f[1], 0, 0, f[2]];
                case 5:
                    return f;
                default:
                    throw new Error("bad rumble slice " + f);
            }
        });
    }
    const rumbleFunc: GamepadRumbleObj = async (...args: RumbleArgs) => {
        if (!rumbleFunc.enabled) return;
        if (rumbleFunc.onlyWhenGamepadInUse && K.getLastInputDeviceType() !== "gamepad") return;
        var gamepads = navigator.getGamepads();
        var effect: [number, number, number, number, number][];
        var playerNumber: number | undefined = undefined;
        if (!gamepads) return;
        if (typeof args[0] === "string") {
            // @ts-ignore
            effect = fixPrestoredEffect(K.rumbleEffects[args[0]]);
            playerNumber = args[1];
        } else {
            switch (args.length) {
                case 3:
                case 4:
                    effect = [[args[0], args[1], 0, 0, args[2]]];
                    playerNumber = args[3];
                    break;
                case 5:
                case 6:
                    effect = [[args[0], args[1], args[2], args[3], args[4]]];
                    playerNumber = args[5];
                    break;
                default:
                    throw new Error("bad rumble param " + args);
            }
        }
        if (playerNumber !== undefined) gamepads = [gamepads[playerNumber]!];
        for (const [left, right, tLeft, tRight, timeslice] of effect) {
            for (const gamepad of gamepads) {
                if (!gamepad) continue;
                const rumbleMotors: GamepadHapticActuator[] =
                    // @ts-ignore
                    gamepad.hapticActuators
                    ?? [];
                if (gamepad.vibrationActuator) rumbleMotors.push(gamepad.vibrationActuator);
                await Promise.all([
                    ...rumbleMotors.map(motor => {
                        if (!left && !right) return;
                        try {
                            motor.playEffect("dual-rumble", {
                                strongMagnitude: left,
                                weakMagnitude: right,
                                duration: timeslice
                            });
                        } catch (e) { }
                    }),
                    ...rumbleMotors.map(motor => {
                        if (!tLeft && !tRight) return;
                        console.log(tLeft, tRight);
                        try {
                            motor.playEffect("trigger-rumble", {
                                leftTrigger: tLeft,
                                rightTrigger: tRight,
                                duration: timeslice
                            });
                        } catch (e) { }
                    }),
                    new Promise(r => setTimeout(r, timeslice))
                ]);
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
