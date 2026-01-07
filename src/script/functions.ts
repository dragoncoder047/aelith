import { K } from "../context";
import * as InputManager from "../controls/InputManager";
import { splitV } from "../entity/Animator";
import * as EntityManager from "../entity/EntityManager";
import { RefuseTake } from "../entity/Inventory";
import * as RoomManager from "../room/RoomManager";
import { Form, FormFunc } from "./Form";
import { evaluateForm, tracebackError } from "./ScriptHandler";

function macro(name: string, body: FormFunc): Form {
    return new Form(name, true, body);
}

function func(name: string, body: FormFunc): Form {
    return new Form(name, false, body);
}

export const FUNCTIONS: Form[] = [
    macro("dont", function* () { }),
    macro("don't", function* () { }),
    func("log", function* (args) {
        K.debug.log(args);
    }),
    func("debug", function* (args, task, actor, env, context, traceback) {
        console.log(JSON.stringify({ args, task, actor, env, context, traceback }, null, 4));
    }),
    func("wait", function* ([time], task) {
        task.paused = true;
        K.wait(time, () => task.paused = false);
        yield;
    }),
    func("be", function* ([slot, value, silent], task, actor) {
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
    }),
    macro("as", function* ([who, ...what], task, actor, env, context, traceback) {
        const realActor = EntityManager.getEntityByName(yield* evaluateForm(who, task, actor, env, context, traceback));
        if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
        return yield* evaluateForm(what, task, realActor, env, context, traceback);
    }),
    macro("do", function* (forms, task, actor, env, context, traceback) {
        for (var i = 0; i < forms.length - 1; i++) {
            env.it = env.them = yield* evaluateForm(forms[i]!, task, actor, env, context, traceback);
        }
        task.tc = true;
        return forms.at(-1);
    }),
    macro("when", function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, ["do", ...body]];
    }),
    macro("unless", function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, undefined, ["do", ...body]];
    }),
    macro("if", function* ([test, a, b], task, actor, env, context, traceback) {
        const cond = yield* evaluateForm(test, task, actor, env, context, traceback);
        task.tc = true;
        return cond ? a : b;
    }),
    func("switch", function* ([value, cases], task) {
        task.tc = true;
        return cases[value];
    }),
    macro("each", function* ([name, listEx, ...body], task, actor, env, context, traceback) {
        const block = ["do", ...body];
        const list = yield* evaluateForm(listEx, task, actor, env, context, traceback);
        for (var item of list) {
            env[name] = item;
            yield* evaluateForm(block, task, actor, env, context, traceback);
        }
    }),
    macro("while", function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["when", test, b, ["while", test, b]];
    }),
    macro("until", function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["unless", test, b, ["until", test, b]];
    }),
    func("iota", function* ([start, stop, step]) {
        const l = [];
        for (var i = start; i < stop; i += step ?? 1) l.push(i);
        return l;
    }),
    macro("repeat", function* ([name, range, ...body], task) {
        task.tc = true;
        return ["each", name, ["iota", ...range], ...body];
    }),
    func("ami", function* ([slot, target], _, actor) {
        const value = actor!.state[slot];
        if (target !== undefined) {
            return value === target;
        }
        return !!value;
    }),
    func("my", function* ([slot], _, actor) {
        return actor!.state[slot];
    }),
    func("render", function* ([slot, newValue], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("anim", function* ([animName, restart], task, actor) {
        actor!.playAnim(animName, restart);
    }),
    func("skinAnim", function* ([animName, value], task, actor) {
        K.debug.log("started anim", animName);
        actor!.animator.skinAnim(animName, value);
    }),
    func("anim/w", function* ([animName], task, actor, env, context, traceback) {
        task.paused = true;
        actor!.playAnim(animName).then(() => task.paused = false);
        yield;
    }),
    func("unanim", function* ([animName], task, actor) {
        actor!.stopAnim(animName);
    }),
    func("playsound", function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("playsound/w", function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("say", function* ([text], task, actor) {
        actor!.say(text);
    }),
    func("say/w", function* ([text], task, actor) {
        task.paused = true;
        actor!.say(text).then(() => task.paused = false);
        yield;
    }),
    func("the", function* ([name], task, actor, env, context) {
        return context[name];
    }),
    // TODO: global variables and stuff
    func("get", function* ([name], task, actor, env) {
        return env[name];
    }),
    func("set", function* ([name, value], task, actor, env) {
        return env[name] = value;
    }),
    func("here", function* (args, task, actor) {
        return actor!.pos;
    }),
    func("spawn", function* ([kind, pos, room, data]) {
        return EntityManager.spawnEntityInRoom(pos, room ?? RoomManager.getCurrentRoom(), { ...data, kind, pos: null }).id;
    }),
    func("die", function* (args, task, actor) {
        EntityManager.destroyEntity(actor!);
    }),
    func("tp", function* ([eid, room, pos]) {
        EntityManager.teleportEntityTo(EntityManager.getEntityByName(eid)!, room, pos);
    }),
    func("mState", function* ([state], task, actor) {
        if (state !== null) actor!.setMotionState(state);
        else actor!.endMotionState();
    }),
    func("refuse", function* () {
        throw new RefuseTake;
    }),
    func("take", function* ([itemid], task, actor) {
        var result = "";
        task.paused = true;
        actor!.inventory.tryAdd(EntityManager.getEntityByName(itemid)!).then(res => {
            result = res;
            task.paused = false;
        });
        yield;
        return result;
    }),
    func("hold", function* ([itemid], task, actor) {
        return actor!.inventory.displayObj(itemid !== null ? EntityManager.getEntityByName(itemid)! : null);
    }),
    func("drop", function* ([itemid], task, actor) {
        return actor!.inventory.drop(EntityManager.getEntityByName(itemid)!);
    }),
    func("bePlayer", function* (args, task, actor) {
        EntityManager.setPlayer(actor);
    }),
    func("#", function* ([{ x, y }]) {
        return Math.hypot(x, y);
    }),
    func("*", function* (values) {
        return values.reduce((a, b) => a * b);
    }),
    func("+", function* (values) {
        return values.length > 1 ? values.reduce((a, b) => a + b) : Math.abs(values[0]);
    }),
    func("/", function* (values) {
        return values.length > 1 ? values[0] / values.slice(1).reduce((a, b) => a * b) : 1 / values[0];
    }),
    func("not", function* ([value]) {
        return !value;
    }),
    func("isVoid", function* ([value]) {
        return value === undefined;
    }),
    func("v+", function* (values) {
        const res = K.vec2();
        for (var v of values) {
            K.Vec2.add(res, v, res);
        }
        return res;
    }),
    func("vec2", function* ([x, y]) {
        return K.vec2(x, y);
    }),
    func("xys", function* ([vec]) {
        return [vec.x, vec.y];
    }),
    func("list", function* (args) {
        return args;
    }),
    func("nth", function* ([index, list]) {
        return list[index];
    }),
    func("boneGet", function* ([path], task, actor) {
        const p = splitV(actor!.bones, path);
        return p[0][p[1]];
    }),
    func("boneSet", function* ([path, value], task, actor) {
        const p = splitV(actor!.bones, path);
        return p[0][p[1]] = value;
    }),
    func("worldPos", function* ([bone, pos], task, actor) {
        return (actor!.bones[bone] ?? actor!.obj!).worldPos = pos;
    }),
    func("screenwidth", function* () {
        return K.width();
    }),
    func("screenheight", function* () {
        return K.height();
    }),
    func("getanalog", function* ([bName]) {
        return InputManager.getAnalog(bName);
    }),
    func("lerp", function* ([a, b, t]) {
        return K.lerp(a, b, t);
    }),
    func("randi", function* ([low, high]) {
        return K.randi(low, high);
    }),
    func("toNumber", function* ([string]) {
        return Number(string);
    }),
    func("expand", function* ([code, data]) {
        return K.sub(code, data);
    }),
];

// TODO: make this the native thing instead of generated
export const FUNCTIONS_MAP = Object.fromEntries(FUNCTIONS.map(f => [f.name, f]));
