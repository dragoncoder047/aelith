import { Tag } from "kaplay";
import { grabber as grabberComp } from "../components/grabber";
import { pointTowards } from "../components/pointTowards";
import { FRICTION, RESTITUTION } from "../constants";
import { K } from "../init";
import { machine } from "./machine";

export function grabber() {
    return [
        K.sprite("grabber"),
        ...machine({ scale: 0.5 }),
        K.body({ damping: 2, gravityScale: 0 }),
        grabberComp(),
        K.anchor("bot"),
        pointTowards(null),
        "dont-highlight" as Tag,
    ]
}
