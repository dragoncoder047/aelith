import { Tag } from "kaplay";
import { pipeComp } from "../components/pipe";
import { K } from "../init";
import { defaults } from "./default";

export function dataPipe(solid = true, useBackground = true) {
    return [
        K.layer("background2"),
        K.sprite("pipe"),
        pipeComp(solid, useBackground),
        ...defaults(),
        "pipe" as Tag,
        K.shader("dataPipe", () => ({
            u_time: K.time(),
        }))
    ]
}
