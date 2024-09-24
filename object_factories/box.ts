import { CompList } from "kaplay";
import { boxComp } from "../components/box";
import { grabbable } from "../components/grabbable";
import { hoverOutline } from "../components/hoverOutline";
import { infFriction } from "../components/infFriction";
import { thudder } from "../components/thudder";
import { TILE_SIZE } from "../constants";
import K from "../init";
import { machine } from "./machine";

/**
 * Components for a moveable, grabbable box.
 */
export function box(): CompList<any> {
    return [
        K.sprite("box", { fill: false }),
        "box",
        K.body(),
        // make box a teeny bit smaller so that it fits down holes
        // and I don't have to stomp on it
        ...machine({ scale: (TILE_SIZE - 0.1) / TILE_SIZE }),
        hoverOutline(),
        K.tile({ isObstacle: true }),
        thudder(),
        grabbable(),
        K.layer("boxes"),
        infFriction(),
        boxComp()
    ];
}
