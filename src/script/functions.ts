import { K } from "../context";
import * as InputManager from "../controls/InputManager";
import { objOrStateSplit } from "../entity/Animator";
import { Entity } from "../entity/Entity";
import * as EntityManager from "../entity/EntityManager";
import { RefuseTake } from "../entity/Inventory";
import * as RoomManager from "../room/RoomManager";
import { Form, FormFunc } from "./Form";
import { Env, ScriptRunner, Task, TracebackArray, tracebackError } from "./ScriptHandler";

export const FUNCTIONS_MAP: Record<string, Form> = {};

function macro(name: string, body: FormFunc) {
    FUNCTIONS_MAP[name] = new Form(name, true, body);
}

function func(name: string, body: FormFunc) {
    FUNCTIONS_MAP[name] = new Form(name, false, body);
}

macro("dont", function* () { });
macro("don't", function* () { });
func("log", function* (runner, args) {
    K.debug.log(args);
    console.log(args);
});
func("spy", function* (runner, [tag, arg]) {
    K.debug.log(tag, arg);
    console.log(tag, arg);
    return arg;
});
func("debug", function* (runner, args, task, actor, env, context, traceback) {
    console.log(JSON.stringify({ runner, args, task, actor, env, context, traceback }, null, 4));
});
func("wait", function* (runner, [time], task) {
    task.paused = true;
    K.wait(time, () => task.paused = false);
    yield;
});
func("be", function* (runner, [slot, value, silent], task, actor) {
    const oldValue = actor!.state[slot];
    actor!.state[slot] = value;
    if (!silent) {
        const subTask = actor!.startHook("stateChanged", { slot, oldValue, value });
        if (subTask) {
            task.paused = true;
            subTask.onFinish(() => task.paused = false);
            yield;
        }
    }
    return value;
});
macro("as", function* (runner, [whoExpr, ...what], task, actor, env, context, traceback) {
    const who = yield* runner.eval(whoExpr, task, actor, env, context, traceback);
    const realActor = EntityManager.getEntityByName(who);
    if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
    return yield* runner.eval(what, task, realActor, env, context, traceback);
});
function* do_body_tailcall(runner: ScriptRunner, forms: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) {
    for (var i = 0; i < forms.length - 1; i++) {
        env.it = env.them = yield* runner.eval(forms[i]!, task, actor, env, context, traceback);
    }
    task.tc = true;
    return forms.at(-1);
}
function* do_body(runner: ScriptRunner, forms: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) {
    return yield* runner.eval(yield* do_body_tailcall(runner, forms, task, actor, env, context, traceback), task, actor, env, context, traceback);
}
macro("do", do_body);
macro("when", function* (runner, [test, ...body], task, actor, env, context, traceback) {
    const cond = yield* runner.eval(test, task, actor, env, context, traceback);
    if (cond) return yield* do_body(runner, body, task, actor, env, context, traceback);
});
macro("unless", function* (runner, [test, ...body], task, actor, env, context, traceback) {
    const cond = yield* runner.eval(test, task, actor, env, context, traceback);
    if (!cond) return yield* do_body(runner, body, task, actor, env, context, traceback);
});
macro("if", function* (runner, [test, a, b], task, actor, env, context, traceback) {
    const cond = yield* runner.eval(test, task, actor, env, context, traceback);
    task.tc = true;
    return cond ? a : b;
});
func("switch", function* (runner, [value, cases], task) {
    task.tc = true;
    return cases[value];
});
macro("each", function* (runner, [name, listEx, ...body], task, actor, env, context, traceback) {
    const list = yield* runner.eval(listEx, task, actor, env, context, traceback);
    for (var item of list) {
        env[name] = item;
        yield* do_body(runner, body, task, actor, env, context, traceback);
    }
});
function makeloop(continue_: boolean) {
    return function* (runner: ScriptRunner, [test, ...body]: any[], task: Task, actor: Entity | null, env: Env, context: Env, traceback: TracebackArray) {
        var lastResult;
        var prevFrameNo = K.debug.numFrames();
        for (var repeatCount = 0; repeatCount < 1000; repeatCount++) {
            const cond = yield* runner.eval(test, task, actor, env, context, traceback);
            if ((continue_ && !cond) || (!continue_ && cond)) return lastResult;
            lastResult = yield* do_body(runner, body, task, actor, env, context, traceback);
            const nextFrame = K.debug.numFrames();
            if (prevFrameNo !== nextFrame) repeatCount = 0;
            prevFrameNo = nextFrame;
        }
        throw new Error("infinite loop detected.\n" +
            "tip: if you want an update loop, add a " +
            "['wait', 0] to prevent a lockup, or use " +
            "the 'update' or 'render' hooks.");
    }
}

macro("while", makeloop(true));
macro("until", makeloop(false));
func("iota", function* (runner, [start, stop, step = 1]) {
    const l = [];
    for (var i = start; i < stop; i += step) l.push(i);
    return l;
});
macro("repeat", function* (runner, [name, range, ...body], task) {
    task.tc = true;
    return ["each", name, ["iota", ...range], ...body];
});
func("ami", function* (runner, [slot, target], _, actor) {
    const value = actor!.state[slot];
    if (target !== undefined) {
        return value === target;
    }
    return !!value;
});
func("my", function* (runner, [slot], _, actor) {
    return actor!.state[slot];
});
func("animC", function* (runner, [animName, restart], task, actor) {
    actor!.playAnim(animName, restart);
});
func("skinAnim", function* (runner, [animName, value], task, actor) {
    K.debug.log("started anim", animName);
    actor!.animator.skinAnim(animName, value);
});
func("anim", function* (runner, [animName], task, actor) {
    task.paused = true;
    actor!.playAnim(animName).then(() => task.paused = false);
    yield;
});
func("unanim", function* (runner, [animName], task, actor) {
    actor!.stopAnim(animName);
});
func("playsound", function* (runner, [soundName, global, volume, environmental], task, actor) {
    actor!.emitSound(soundName, volume, global, environmental);
});
func("playsound/w", function* (runner, [soundName, global, volume, environmental], task, actor) {
    task.paused = true;
    actor!.emitSound(soundName, volume, global, environmental, () => task.paused = false);
    yield;
});
func("modsound", function* (runner, [soundName, param, value], task, actor) {
    actor!.modSound(soundName, param, value);
});
func("smoothly", function* (runner, [id, value, alpha], task, actor) {
    return actor!.smoothing(id, value, alpha);
});
func("deltaPos", function* (runner, [], task, actor) {
    return actor!.deltaPos;
})
func("sayC", function* (runner, [text, force], task, actor) {
    actor!.say(text, force);
});
func("say", function* (runner, [text, force], task, actor) {
    task.paused = true;
    actor!.say(text, force).then(() => task.paused = false);
    yield;
});
func("the", function* (runner, [name], task, actor, env, context) {
    return context[name];
});
// TODO: global variables and stuff
func("set", function* (runner, args, task, actor, env) {
    var value;
    for (var i = 0; i < args.length; i += 2) {
        value = env[args[i]] = args[i + 1];
    }
    return value;
});
func("get", function* (runner, [name], task, actor, env) {
    return env[name];
});
func("here", function* (runner, [], task, actor) {
    return actor!.pos;
});
func("spawn", function* (runner, [kind, pos, room, data]) {
    return EntityManager.spawnEntityInRoom(pos, room ?? RoomManager.getCurrentRoom(), { ...data, kind, pos: null }).id;
});
func("die", function* (runner, [], task, actor) {
    EntityManager.destroyEntity(actor!);
});
func("loaded", function* (runner, [], task, actor) {
    return !!actor!.obj;
});
func("tp", function* (runner, [eid, room, pos]) {
    EntityManager.teleportEntityTo(EntityManager.getEntityByName(eid)!, room, pos);
});
func("mState", function* (runner, [state], task, actor) {
    if (state !== null) actor!.setMotionState(state);
    else actor!.endMotionState();
});
func("refuse", function* (runner, []) {
    throw new RefuseTake;
});
func("take", function* (runner, [itemid], task, actor) {
    var result = "";
    task.paused = true;
    actor!.inventory.tryAdd(EntityManager.getEntityByName(itemid)!).then(res => {
        result = res;
        task.paused = false;
    });
    yield;
    return result;
});
func("hold", function* (runner, [itemid], task, actor) {
    K.debug.log("called hold with", itemid);
    return actor!.inventory.displayObj(itemid !== null ? EntityManager.getEntityByName(itemid)! : null);
});
func("drop", function* (runner, [itemid], task, actor) {
    return actor!.inventory.drop(EntityManager.getEntityByName(itemid)!);
});
func("bePlayer", function* (runner, [], task, actor) {
    EntityManager.setPlayer(actor);
});
func("#", function* (runner, [v]) {
    return Math.hypot(v.x, v.y);
});
func("*", function* (runner, values) {
    return values.reduce((a, b) => a * b);
});
func("+", function* (runner, values) {
    return values.length > 1 ? values.reduce((a, b) => a + b) : Math.abs(values[0]);
});
func("-", function* (runner, values) {
    return values.length > 1 ? values[0] - values.slice(1).reduce((a, b) => a + b, 0) : -values[0];
});
func("/", function* (runner, values) {
    return values.length > 1 ? values[0] / values.slice(1).reduce((a, b) => a * b, 1) : 1 / values[0];
});
func("==", function* (runner, [a, b]) {
    return a == b;
});
func("not", function* (runner, [value]) {
    return !value;
});
const LOGICS = [
    0x55555555,
    0x11111111,
    0x01010101,
    0x00010001,
    0x00000001,
] as const;
macro("logic", function* (runner, [tab, ...items], task, actor, env, context, traceback) {
    var truthTab = Number(yield* runner.eval(tab, task, actor, env, context, traceback));
    for (var i = 0; i < LOGICS.length; i++) {
        const value = yield* runner.eval(items[i], task, actor, env, context, traceback);
        if (value) truthTab >>= i + 1;
        truthTab &= LOGICS[i]!;
        const remainingMask = truthTab ? ((1 << (31 - Math.clz32(truthTab))) - 1) : 0;
        if (truthTab === 0) {
            return false;
        }
        if (truthTab === (LOGICS[i]! & remainingMask)) {
            return true;
        }
    }
    return !!truthTab;
});
func("isVoid", function* (runner, [value]) {
    return value === undefined;
});
func("v+", function* (runner, values) {
    const res = K.vec2();
    for (var v of values) {
        K.Vec2.add(res, v, res);
    }
    return res;
});
func("vDist", function* (runner, [a, b]) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
});
func("vec2", function* (runner, [x, y]) {
    return K.vec2(x, y);
});
func("xys", function* (runner, [vec]) {
    return [vec.x, vec.y];
});
func("list", function* (runner, args) {
    return args;
});
func(".", function* (runner, [key, obj]) {
    return obj[key];
});
func("boneGet", function* (runner, [path], task, actor) {
    const p = objOrStateSplit(actor!.bones, actor!.state, path);
    return p[0][p[1]];
});
func("boneSet", function* (runner, [path, value], task, actor) {
    const p = objOrStateSplit(actor!.bones, actor!.state, path);
    return p[0][p[1]] = value;
});
func("holdingobj", function* (runner, [], task, actor) {
    return actor!.inventory.displayed?.id;
});
func("look", function* (runner, [direction], task, actor) {
    actor!.lookInDirection(typeof direction === "number" ? K.Vec2.fromAngle(direction) : direction);
});
func("lookAt", function* (runner, [name], task, actor) {
    actor!.target(name !== null ? EntityManager.getEntityByName(name)! : name);
});
func("hitting", function* (runner, [tag, bone], task, actor) {
    const bObj = bone ? actor!.bones[bone] : actor!.obj;
    return bObj?.getCollisions()?.some(c => tag ? c.target.is(tag) : true);
});
func("screenwidth", function* (runner, []) {
    return K.width();
});
func("screenheight", function* (runner, []) {
    return K.height();
});
func("getanalog", function* (runner, [bName]) {
    return InputManager.getAnalog(bName);
});
func("setGlobalLight", function* (runner, [color, intensity]) {
    if ((color ?? null) !== null) K.setGlobalLight({ color: K.rgb(color) });
    if (intensity !== undefined) K.setGlobalLight({ intensity });
});
func("lerp", function* (runner, [a, b, t]) {
    return K.lerp(a, b, t);
});
func("map", function* (runner, [x, a, b, p, q]) {
    return K.map(x, a, b, p, q);
});
func("mapc", function* (runner, [x, a, b, p, q]) {
    return K.mapc(x, a, b, p, q);
});
func("rand", function* (runner, [low, high]) {
    return K.rand(low, high);
});
func("randi", function* (runner, [low, high]) {
    return K.randi(low, high);
});
func("toNumber", function* (runner, [string]) {
    return Number(string);
});
func("expand", function* (runner, [code, data]) {
    return K.sub(code, data);
});
func("dt", function* (runner, []) {
    return K.dt();
});
