import { Comp } from "kaplay"

export interface LoreComp extends Comp {
    lore: {
        body?: string
        secName?: string
        section?: string
    },
    loreViewed: boolean
}
export function lore(lore: LoreComp["lore"]): LoreComp {
    return {
        id: "lore",
        lore,
        loreViewed: false
    }
}
