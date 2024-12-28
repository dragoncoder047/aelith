import { Comp, GameObj, KEventController } from "kaplay";

export interface LinkComp extends Comp {
    readonly idTag: string,
    linkGroup: string,
    broadcast(msg: string): void,
    onMessage(cb: (msg: string) => void): KEventController,
}

/**
 * Component that links two game objects by messages
 * @param tag ID of linked objects
 */
export function linked(tag: string): LinkComp {
    var _grp = tag;
    return {
        id: "linked",
        get idTag() { return "__linkid_" + _grp; },
        get linkGroup() { return _grp; },
        set linkGroup(newTag) {
            (this as unknown as GameObj).untag(this.idTag);
            _grp = newTag;
            (this as unknown as GameObj).tag(this.idTag);
        },
        add(this: GameObj) {
            this.tag(this.idTag);
        },
        broadcast(this: GameObj, msg: string) {
            this.query({
                hierarchy: "siblings",
                include: this.idTag,
            }).concat(this).forEach(sibling => {
                sibling.trigger("message", msg);
            });
        },
        onMessage(this: GameObj, cb: (msg: string) => void): KEventController {
            return this.on("message", cb);
        }
    };
}
