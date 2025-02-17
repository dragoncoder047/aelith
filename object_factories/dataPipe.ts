import { Tag } from "kaplay";
import { pipeComp } from "../components/pipe";
import { K } from "../init";
import { defaults } from "./default";
import { mergeable } from "../components/mergeable";

export function dataPipe(solid = true, useBackground = true) {
    return [
        K.layer("background2"),
        K.sprite("pipe", { tiled: true }),
        pipeComp(solid, useBackground),
        ...defaults(),
        mergeable(),
        "pipe" as Tag,
        K.shader("dataPipe", () => ({
            u_time: K.time(),
        }))
    ]
}
