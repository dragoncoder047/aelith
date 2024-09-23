/**
 * Component that links two game objects by messages
 * @param {string} tag ID of linked objects
 */
export function linked(tag) {
    var closure__tag = tag;
    return {
        id: "linked",
        get idTag() { return "__linkid_" + closure__tag; },
        get tag() { return closure__tag; },
        set tag(newTag) {
            this.unuse(this.idTag); // cSpell: ignore unuse
            closure__tag = newTag;
            this.use(this.idTag);
        },
        /**
         * @this {import("kaplay").GameObj<LinkComp>}
         */
        add() {
            this.use(this.idTag);
        },
        /**
         * @param {string} msg
         * @this {import("kaplay").GameObj<LinkComp>}
         */
        broadcast(msg) {
            this.query({
                hierarchy: "siblings",
                include: this.idTag,
            }).concat(this).forEach(sibling => {
                sibling.trigger("message", msg);
            });
        },
        /**
         * @param {(msg: string) => void} cb
         * @returns {import("kaplay").KEventController}
         * @this {import("kaplay").GameObj<LinkComp>}
         */
        onMessage(cb) {
            return this.on("message", cb);
        }
    };
}
