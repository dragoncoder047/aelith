import { K } from "../../context";

export function installTabNavigation() {
    const objects = K.get("focusable");
    const navigate = (d: number) => {
        const newFocusIndex = (d + objects.length + objects.findIndex(o => o.is("focused"))) % objects.length;
        objects.forEach(o => o.untag("focused"));
        objects[newFocusIndex]!.tag("focused");
    }
    K.scene.onButtonPress("nav_down", () => {
        navigate(1);
    });
    K.scene.onButtonPress("nav_up", () => {
        navigate(-1);
    });
    K.scene.onButtonPress("nav_select", () => {
        K.get("focused")[0]?.action?.();
    });
    K.scene.onButtonPress("nav_left", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) obj.changeBy((obj.lo - obj.hi) * 0.1);
    });
    K.scene.onButtonPress("nav_right", () => {
        const obj = K.get("focused")[0];
        if (obj && obj.changeBy) obj.changeBy((obj.hi - obj.lo) * 0.1);
    });
    K.scene.onMouseMove(() => {
        objects.forEach(o => o.untag("focused"));
    });
}
