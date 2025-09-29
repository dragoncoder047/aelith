import { K } from "../context";
import * as EntityManager from "../entity/EntityManager";
import { RefuseTake } from "../entity/Inventory";
import * as RoomManager from "../room/RoomManager";
import { Form } from "./Form";
import { evaluateForm, tracebackError } from "./ScriptHandler";

export const FUNCTIONS: Form[] = [
    new Form("comment", true, async function* () { }),
    new Form("uncomment", true, async function* (args, task) {
        task.tc = true;
        return ["do", ...args];
    }),
    new Form("debug", false, async function* (args, task, actor, env, context, traceback) {
        console.log(JSON.stringify({ args, task, actor, env, context, traceback }, null, 4));
    }),
    new Form("wait", false, async function* ([t]) {
        await K.wait(t);
    }),
    new Form("list", false, async function* (args) {
        return args;
    }),
    new Form("be", false, async function* (args, task, actor) {
        const [slot, value, silent] = args;
        const oldValue = actor.state[slot];
        actor.state[slot] = value;
        if (!silent) {
            const subTask = EntityManager.startHookOnEntity(actor, "stateChanged", { slot, oldValue });
            if (subTask) {
                task.paused = true;
                subTask.onFinish(() => task.paused = false);
                yield;
            }
        }
        return value;
    }),
    new Form("as", true, async function* ([who, ...what], task, _, env, context, traceback) {
        const realActor = EntityManager.getEntityByName(who);
        if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
        return yield* evaluateForm(what, task, realActor, env, context, traceback);
    }),
    new Form("do", true, async function* (forms, task, actor, env, context, traceback) {
        for (var i = 0; i < forms.length - 1; i++) {
            env.it = env.them = yield* evaluateForm(forms[i]!, task, actor, env, context, traceback);
        }
        task.tc = true;
        return forms.at(-1);
    }),
    new Form("when", true, async function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, ["do", ...body]];
    }),
    new Form("unless", true, async function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, undefined, ["do", ...body]];
    }),
    new Form("if", true, async function* ([test, a, b], task, actor, env, context, traceback) {
        const cond = yield* evaluateForm(test, task, actor, env, context, traceback);
        task.tc = true;
        return cond ? a : b;
    }),
    new Form("switch", false, async function* ([value, cases], task) {
        task.tc = true;
        return cases[value];
    }),
    new Form("each", true, async function* ([name, listEx, ...body], task, actor, env, context, traceback) {
        const block = ["do", ...body];
        const list = yield* evaluateForm(listEx, task, actor, env, context, traceback);
        for (var item of list) {
            env[name] = item;
            yield* evaluateForm(block, task, actor, env, context, traceback);
        }
    }),
    new Form("while", true, async function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["when", test, b, ["while", test, b]];
    }),
    new Form("until", true, async function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["unless", test, b, ["until", test, b]];
    }),
    new Form("iota", false, async function* ([start, stop, step]) {
        const l = [];
        for (var i = start; i < stop; i += step ?? 1) l.push(i);
        return l;
    }),
    new Form("repeat", true, async function* ([name, range, ...body], task) {
        task.tc = true;
        return ["each", name, ["iota", ...range], ...body];
    }),
    new Form("ami", false, async function* ([slot, target], _, actor) {
        const value = actor.state[slot];
        if (target !== undefined) {
            return value === target;
        }
        return !!value;
    }),
    new Form("my", false, async function* ([slot], _, actor) {
        return actor.state[slot];
    }),
    new Form("render", false, async function* ([slot, newValue], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("anim", false, async function* ([animName], task, actor) {
        actor.playAnim(animName);
    }),
    new Form("anim/w", false, async function* ([animName], task, actor, env, context, traceback) {
        task.paused = true;
        actor.playAnim(animName).then(() => task.paused = false);
        yield;
    }),
    new Form("unanim", false, async function* ([animName], task, actor) {
        actor.stopAnim(animName);
    }),
    new Form("playsound", false, async function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("playsound/w", false, async function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("say", false, async function* ([text], task, actor) {
        await actor.say(text);
    }),
    new Form("the", false, async function* ([name], task, actor, env, context) {
        return context[name];
    }),
    // TODO: global variables and stuff
    new Form("get", false, async function* ([name], task, actor, env) {
        return env[name];
    }),
    new Form("set", false, async function* ([name, value], task, actor, env) {
        return env[name] = value;
    }),
    new Form("here", false, async function* (args, task, actor) {
        return actor.pos;
    }),
    new Form("spawn", false, async function* ([kind, pos, room, data]) {
        return EntityManager.spawnEntityInRoom(pos, room ?? RoomManager.getCurrentRoom(), { ...data, kind, pos: null }).id;
    }),
    new Form("die", false, async function* (args, task, actor) {
        EntityManager.destroyEntity(actor);
    }),
    new Form("tp", false, async function* ([eid, room, pos]) {
        EntityManager.teleportEntityTo(EntityManager.getEntityByName(eid)!, room, pos);
    }),
    new Form("refuse", false, async function* () {
        throw new RefuseTake;
    }),
    new Form("take", false, async function* ([itemid], task, actor) {
        return await actor.inventory.tryAdd(EntityManager.getEntityByName(itemid)!);
    }),
    new Form("hold", false, async function* ([itemid], task, actor) {
        return actor.inventory.displayObj(EntityManager.getEntityByName(itemid)!);
    }),
    new Form("drop", false, async function* ([itemid], task, actor) {
        return actor.inventory.drop(EntityManager.getEntityByName(itemid)!);
    }),
];
