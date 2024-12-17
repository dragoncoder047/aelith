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
export function lore(lore: LoreComp["lore"] = { seen: false }): LoreComp {
    return {
        id: "lore",
        lore,
    }
}
