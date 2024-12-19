import { Comp } from "kaplay"

export interface LoreComp extends Comp {
    lore: {
        body?: string
        secName?: string
        section?: string
        header?: string
        seen: boolean
    },
}
export function lore(lore: Omit<LoreComp["lore"], "seen"> = {}): LoreComp {
    return {
        id: "lore",
        lore: Object.assign({ seen: false }, lore),
    }
}
