import { K } from "../context";
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
    macro("comment", async function* () { }),
    macro("uncomment", async function* (args, task) {
        task.tc = true;
        return ["do", ...args];
    }),
    func("log", async function* (args) {
        K.debug.log(args);
    }),
    func("debug", async function* (args, task, actor, env, context, traceback) {
        console.log(JSON.stringify({ args, task, actor, env, context, traceback }, null, 4));
    }),
    func("wait", async function* ([t]) {
        await K.wait(t);
    }),
    func("list", async function* (args) {
        return args;
    }),
    func("be", async function* ([slot, value, silent], task, actor) {
        const oldValue = actor.state[slot];
        actor.state[slot] = value;
        if (!silent) {
            const subTask = actor.startHook("stateChanged", { slot, oldValue, value });
            if (subTask) {
                task.paused = true;
                subTask.onFinish(() => task.paused = false);
                yield;
            }
        }
        return value;
    }),
    macro("as", async function* ([who, ...what], task, actor, env, context, traceback) {
        const realActor = EntityManager.getEntityByName(yield* evaluateForm(who, task, actor, env, context, traceback));
        if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
        return yield* evaluateForm(what, task, realActor, env, context, traceback);
    }),
    macro("do", async function* (forms, task, actor, env, context, traceback) {
        for (var i = 0; i < forms.length - 1; i++) {
            env.it = env.them = yield* evaluateForm(forms[i]!, task, actor, env, context, traceback);
        }
        task.tc = true;
        return forms.at(-1);
    }),
    macro("when", async function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, ["do", ...body]];
    }),
    macro("unless", async function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, undefined, ["do", ...body]];
    }),
    macro("if", async function* ([test, a, b], task, actor, env, context, traceback) {
        const cond = yield* evaluateForm(test, task, actor, env, context, traceback);
        task.tc = true;
        return cond ? a : b;
    }),
    func("switch", async function* ([value, cases], task) {
        task.tc = true;
        return cases[value];
    }),
    macro("each", async function* ([name, listEx, ...body], task, actor, env, context, traceback) {
        const block = ["do", ...body];
        const list = yield* evaluateForm(listEx, task, actor, env, context, traceback);
        for (var item of list) {
            env[name] = item;
            yield* evaluateForm(block, task, actor, env, context, traceback);
        }
    }),
    macro("while", async function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["when", test, b, ["while", test, b]];
    }),
    macro("until", async function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["unless", test, b, ["until", test, b]];
    }),
    func("iota", async function* ([start, stop, step]) {
        const l = [];
        for (var i = start; i < stop; i += step ?? 1) l.push(i);
        return l;
    }),
    macro("repeat", async function* ([name, range, ...body], task) {
        task.tc = true;
        return ["each", name, ["iota", ...range], ...body];
    }),
    func("ami", async function* ([slot, target], _, actor) {
        const value = actor.state[slot];
        if (target !== undefined) {
            return value === target;
        }
        return !!value;
    }),
    func("my", async function* ([slot], _, actor) {
        return actor.state[slot];
    }),
    func("render", async function* ([slot, newValue], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("anim", async function* ([animName, restart], task, actor) {
        actor.playAnim(animName, restart);
    }),
    func("skinAnim", async function* ([animName, value], task, actor) {
        K.debug.log("started anim", animName);
        actor.animator.skinAnim(animName, value);
    }),
    func("anim/w", async function* ([animName], task, actor, env, context, traceback) {
        task.paused = true;
        actor.playAnim(animName).then(() => task.paused = false);
        yield;
    }),
    func("unanim", async function* ([animName], task, actor) {
        actor.stopAnim(animName);
    }),
    func("playsound", async function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("playsound/w", async function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    func("say", async function* ([text], task, actor) {
        actor.say(text);
    }),
    func("say/w", async function* ([text], task, actor) {
        await actor.say(text);
    }),
    func("the", async function* ([name], task, actor, env, context) {
        return context[name];
    }),
    // TODO: global variables and stuff
    func("get", async function* ([name], task, actor, env) {
        return env[name];
    }),
    func("set", async function* ([name, value], task, actor, env) {
        return env[name] = value;
    }),
    func("here", async function* (args, task, actor) {
        return actor.pos;
    }),
    func("spawn", async function* ([kind, pos, room, data]) {
        return EntityManager.spawnEntityInRoom(pos, room ?? RoomManager.getCurrentRoom(), { ...data, kind, pos: null }).id;
    }),
    func("die", async function* (args, task, actor) {
        EntityManager.destroyEntity(actor);
    }),
    func("tp", async function* ([eid, room, pos]) {
        EntityManager.teleportEntityTo(EntityManager.getEntityByName(eid)!, room, pos);
    }),
    func("mState", async function* ([state], task, actor) {
        if (state !== null) actor.setMotionState(state);
        else actor.endMotionState();
    }),
    func("refuse", async function* () {
        throw new RefuseTake;
    }),
    func("take", async function* ([itemid], task, actor) {
        return await actor.inventory.tryAdd(EntityManager.getEntityByName(itemid)!);
    }),
    func("hold", async function* ([itemid], task, actor) {
        return actor.inventory.displayObj(EntityManager.getEntityByName(itemid)!);
    }),
    func("drop", async function* ([itemid], task, actor) {
        return actor.inventory.drop(EntityManager.getEntityByName(itemid)!);
    }),
    func("setPlayer", async function* (args, task, actor) {
        EntityManager.setPlayer(actor);
    }),
    func("#", async function* ([{ x, y }]) {
        return Math.hypot(x, y);
    }),
    func("*", async function* (values) {
        return values.reduce((a, b) => a * b);
    }),
    func("not", async function* ([value]) {
        return !value;
    }),
    func("isVoid", async function* ([value]) {
        return value === undefined;
    }),
    func("v+", async function* (values) {
        const res = K.vec2();
        for (var v of values) {
            K.Vec2.add(res, v, res);
        }
        return res;
    }),
];

export const FUNCTIONS_MAP = Object.fromEntries(FUNCTIONS.map(f => [f.name, f]));
