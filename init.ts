import { CONTROLS } from "./controls";
import { SCALE } from "./constants";
import kaplay from "kaplay";
import { KAPLAYCtx } from "kaplay";

export const K: KAPLAYCtx<typeof CONTROLS> = kaplay({
    crisp: true,
    global: false,
    scale: SCALE,
    background: "#000000",
    buttons: CONTROLS
});
