import { KEventController } from "kaplay";
import { K } from "../../src/context";

export enum SettingKind {
    /** primary: switch, alternate: checkbox */
    BOOLEAN,
    /** slider */
    RANGE,
    /** radios */
    SELECT,
    /** checkboxes */
    MULTISELECT
}

export abstract class Setting<T> {
    abstract kind: SettingKind;
    constructor(private _value: T) { }
    private _change = new K.KEvent;
    get value(): T {
        return this._value;
    }
    set value(newT: T) {
        this._value = newT;
        this._change.trigger(newT);
    }
    onChange(cb: (x: T) => void): KEventController {
        return this._change.add(cb);
    }
}

export class BooleanSetting extends Setting<boolean> {
    readonly kind = SettingKind.BOOLEAN;
    constructor(value: boolean) { super(value) }
}

export class RangeSetting extends Setting<number> {
    readonly kind = SettingKind.RANGE;
    constructor(value: number,
        public min: number,
        public max: number,
        public step?: number) { super(value) }
}

export class SelectSetting<T extends string> extends Setting<T> {
    readonly kind = SettingKind.SELECT;
    constructor(value: T,
        public options: T[]) { super(value) };
}

export class SelectMultipleSetting<T extends string> extends Setting<T[]> {
    readonly kind = SettingKind.MULTISELECT;
    constructor(value: T[],
        public options: T[]) { super(value) }
}

export class Settings {
    settings: Record<string, Setting<any>> = {};
    constructor(public name: string) { }
    getValue<T extends Setting<any>>(id: string): T["value"] | undefined {
        return this.settings[id]?.value;
    }
    private checkExist(name: string) {
        if (this.settings[name]) throw new Error(`setting ${name} already exists`);
    }
    addBoolean(name: string, value: boolean) {
        this.checkExist(name);
        return this.settings[name] = new BooleanSetting(value);
    }
    addRange(name: string, value: number, min: number, max: number, step?: number) {
        this.checkExist(name);
        return this.settings[name] = new RangeSetting(value, min, max, step);
    }
    addSelect<T extends string>(name: string, value: T, options: T[]) {
        this.checkExist(name);
        return this.settings[name] = new SelectSetting(value, options);
    }
    addMultiSelect<T extends string>(name: string, value: T[], options: T[]) {
        this.checkExist(name);
        return this.settings[name] = new SelectMultipleSetting(value, options);
    }
}
