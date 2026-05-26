declare module '@michaelhomer/jqjs' {
    export type JQFilter = {
        (input: any): Generator<any, void, unknown>;
        filter: unknown; // AST
        trace(input: any): any;
    };
    const jq: {
        compile(jq: string): JQFilter;
        (jq: string, input?: any): Generator<any, void, unknown> | JQFilter;
        prettyPrint(obj: any): string;
    };
    export default jq;
}
