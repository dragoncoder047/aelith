// NB: once Aelith is released, new enum values can only ever go at the bottom in order
// to prevent savestates from breaking, since they serialize the program as well as the
// stack.

enum ValueType {
    ANY,
    NULL,
    STRING,
    NUMBER,
    VEC2,
    COLOR,
    LIST,
}

enum Opcode {
    NOOP,
    PUSH_CONSTANT, // followed by index into constant table
    PUSH_NULLS, // followed by number of nulls
    PUSH_ENTITY_CONTEXT,
    LOOKUP_ENTITY,
}

export class ScriptHandler {

}
