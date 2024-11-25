import { Comp } from "kaplay";

export interface ControllableComp extends Comp {
    controls: {
        hint: string
        styles?: string[]
        hidden?: boolean
    }[]
}

export function controllable(controls: ControllableComp["controls"]): ControllableComp {
    return {
        id: "controllable",
        controls
    }
}
