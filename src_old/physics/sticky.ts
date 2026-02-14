import { Comp } from "kaplay";

export interface StickyComp extends Comp {
    jump: number;
    slide: number;
}

export function sticky(jump = 1, slide = 1): StickyComp {
    return {
        id: "sticky",
        require: ["area", "body"],
        jump, slide
    }
}
