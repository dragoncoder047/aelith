import { K } from "../context";
import * as EntityManager from "../entity/EntityManager";
import { Form } from "./Form";
import { tracebackError, evaluateForm } from "./ScriptHandler";

export const FUNCTIONS: Form[] = [
    new Form("comment", true, function* () { }),
    new Form("uncomment", true, function* (args, task) {
        task.tc = true;
        return ["do", ...args];
    }),
    new Form("debug", false, function* (args, task, actor, env, context, traceback) {
        console.log(JSON.stringify({ args, task, actor, env, context, traceback }, null, 4));
    }),
    new Form("wait", false, function* ([t], task) {
        task.paused = true;
        K.wait(t, () => task.paused = false);
        yield;
    }),
    new Form("list", false, function* (args) {
        return args;
    }),
    new Form("be", false, function* (args, task, actor) {
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
    new Form("as", true, function* ([who, ...what], task, _, env, context, traceback) {
        const realActor = EntityManager.getEntityByName(who);
        if (!realActor) throw tracebackError(`no such actor named ${JSON.stringify(who)}`, traceback);
        return yield* evaluateForm(what, task, realActor, env, context, traceback);
    }),
    new Form("do", true, function* (forms, task, actor, env, context, traceback) {
        for (var i = 0; i < forms.length - 1; i++) {
            env.it = env.them = yield* evaluateForm(forms[i]!, task, actor, env, context, traceback);
        }
        task.tc = true;
        return forms.at(-1);
    }),
    new Form("when", true, function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, ["do", ...body]];
    }),
    new Form("unless", true, function* ([cond, ...body], task) {
        task.tc = true;
        return ["if", cond, undefined, ["do", ...body]];
    }),
    new Form("if", true, function* ([test, a, b], task, actor, env, context, traceback) {
        const cond = yield* evaluateForm(test, task, actor, env, context, traceback);
        task.tc = true;
        return cond ? a : b;
    }),
    new Form("switch", false, function* ([value, cases], task) {
        task.tc = true;
        return cases[value];
    }),
    new Form("each", true, function* ([name, listEx, ...body], task, actor, env, context, traceback) {
        const block = ["do", ...body];
        const list = yield* evaluateForm(listEx, task, actor, env, context, traceback);
        for (var item of list) {
            env[name] = item;
            yield* evaluateForm(block, task, actor, env, context, traceback);
        }
    }),
    new Form("while", true, function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["when", test, b, ["while", test, b]];
    }),
    new Form("until", true, function* ([test, ...body], task) {
        const b = ["do", ...body];
        task.tc = true;
        return ["unless", test, b, ["until", test, b]];
    }),
    new Form("iota", false, function* ([start, stop, step]) {
        const l = [];
        for (var i = start; i < stop; i += step ?? 1) l.push(i);
        return l;
    }),
    new Form("repeat", true, function* ([name, range, ...body], task) {
        task.tc = true;
        return ["each", name, ["iota", ...range], ...body];
    }),
    new Form("ami", false, function* ([slot, target], _, actor) {
        const value = actor.state[slot];
        if (target !== undefined) {
            return value === target;
        }
        return !!value;
    }),
    new Form("my", false, function* ([slot], _, actor) {
        return actor.state[slot];
    }),
    new Form("render", false, function* ([slot, newValue], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("anim", false, function* ([animName], task, actor) {
        actor.playAnim(animName);
    }),
    new Form("anim/w", false, function* ([animName], task, actor, env, context, traceback) {
        task.paused = true;
        actor.playAnim(animName).then(() => task.paused = false);
        yield;
    }),
    new Form("unanim", false, function* ([animName], task, actor) {
        actor.stopAnim(animName);
    }),
    new Form("playsound", false, function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("playsound/w", false, function* ([soundName, global], task, actor, env, context, traceback) {
        throw tracebackError("todo", traceback);
    }),
    new Form("say", false, function* ([text], task, actor) {
        task.paused = true;
        actor.say(text).then(() => task.paused = false);
        yield;
    }),
];
