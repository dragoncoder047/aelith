import { LocationTrace } from "./errors";

export enum ThingType {
    // base types
    nil,
    symbol,
    number,
    string,
    block,
    function_call,
    custom,
}

export enum SymbolType {
    nameLike,
    operatorLike,
    whitespaceLike,
}

export enum BlockType {
    round,
    square,
    curly,
    toplevel,
    string,
}

export class Thing {
    constructor(
        /** type */
        public readonly t: ThingType,
        /** subtype */
        public readonly t2: number | null,
        /** children */
        public readonly c: readonly Thing[],
        /** value */
        public readonly v: any,
        /** source prefix */
        public readonly sp: string,
        /** source suffix */
        public readonly ss: string,
        /** source location */
        public readonly l: LocationTrace) { }
    get fs(): string {
        return this.sp + this.c.map(c => c.fs).join("") + this.ss;
    }
}
