import { GameObj, PosComp } from "kaplay";
import { K } from "../../context";
import * as GameManager from "../../GameManager";
import { RangeSetting, SelectMultipleSetting, SelectSetting, SettingKind, Settings } from "../../settings";
import { DEF_STYLES, STYLES } from "../../TextStyles";
import { below, layoutAnchor, PAD, scroller, ScrollerComp, tooltip, top, uiButton, uiPog, uiSlider } from "../../ui";
import { Scene } from "../SceneManager";
import { Menu, MenuItem, MenuItemType, SettingMenuItem } from "./types";


export function buildMenu(menu: Menu, set: Record<string, Menu>, settings: Settings): GameObj<ScrollerComp> {
    menu.refresh?.();
    const topAnchor = K.add([K.pos(), layoutAnchor(top)]);
    const bw = K.width() / 5;
    const w = 4 * bw;
    const topText = K.add([
        K.pos(),
        K.anchor("center"),
        {
            draw(this: GameObj) {
                K.drawRect({
                    ...this,
                    color: K.BLACK,
                    pos: K.Vec2.ZERO,
                    width: w,
                    height: this.height + PAD * 2,
                });
            }
        },
        K.text("", { styles: STYLES, transform: DEF_STYLES, size: 24, align: "center", font: GameManager.getDefaultValue("font"), }),
        K.dynamicText(menu.title),
        below(topAnchor, PAD),
        K.z(1),
    ]);
    const scrollAnchor = K.add([
        K.pos(),
        below(topText, 0),
        "scroller",
    ]);
    var prev = scrollAnchor;
    for (var i = 0; i < menu.options.length; i++) {
        prev = makeMenuItem(w, bw, prev, menu.options[i]!, set, settings, i === 0);
    }
    const last = K.add([
        K.pos(),
        below(prev, PAD),
    ]);
    scrollAnchor.use(scroller(last));
    return scrollAnchor as any;
}

function makeMenuItem(w: number, bw: number, prev: GameObj<PosComp>, item: MenuItem, set: Record<string, Menu>, settings: Settings, first: boolean) {
    var obj: GameObj<PosComp>;
    switch (item.type) {
        case MenuItemType.SUBMENU:
            obj = K.add(uiButton(bw, 1.5, item.text, null, () => {
                K.play(GameManager.getUIKey("sounds", "open"));
                const menu = set[item.next];
                if (menu === undefined) {
                    throw new Error(`Menu ${item.next} doesn't exist`);
                }
                K.pushScene(Scene.MENU, menu, set, settings);
            }));
            obj.use(below(prev, PAD));
            break;
        case MenuItemType.BACK:
            obj = K.add(uiButton(bw, 1.5, item.text, "nav_back", () => {
                K.play(GameManager.getUIKey("sounds", "back"));
                K.popScene();
            }));
            obj.use(below(prev, PAD));
            break;
        case MenuItemType.BUTTON:
            obj = K.add(uiButton(bw, 1.5, item.text, null, () => {
                K.play(GameManager.getUIKey("sounds", "action"));
                item.action();
            }));
            obj.use(below(prev, PAD));
            obj.use(tooltip(item.help));
            break;
        case MenuItemType.TEXT:
            obj = K.add([
                K.pos(),
                K.anchor("center"),
                K.text("", {
                    styles: STYLES,
                    transform: DEF_STYLES,
                    size: 12,
                    align: "left",
                    width: w,
                    font: GameManager.getDefaultValue("font")
                }),
                K.dynamicText(item.text),
            ]);
            obj.use(below(prev, PAD));
            break;
        case MenuItemType.SETTING:
            obj = makeSetting(w, prev, item, set, settings, first);
            break;
    }
    return obj;
}

function makeSetting(tw: number, prev: GameObj<PosComp>, item: SettingMenuItem, set: Record<string, Menu>, settings: Settings, first: boolean) {
    const s = settings.settings[item.setting]!;
    const alt = item.altDisplay;
    var obj: GameObj<PosComp>;
    var options: Record<string, string>;
    const addStuff = (showHelp: boolean, pad = PAD) => {
        obj.use(below(prev, pad));
        if (showHelp) obj.use(tooltip(item.help));
    }
    const addGroup = () => {
        obj = K.add([
            K.pos(),
            K.anchor("center"),
            K.area(),
            K.text("", { styles: STYLES, transform: DEF_STYLES, size: 12, align: "left", width: tw, font: GameManager.getDefaultValue("font") }),
            K.dynamicText(item.text),
        ]);
        addStuff(true);
        prev = obj;
    }
    switch (s.kind) {
        case SettingKind.BOOLEAN:
            obj = K.add(uiPog(tw, 1.5, item.text, GameManager.getUIKey("sprites", alt ? "checkbox" : "switch"), () => s.value, () => {
                s.value = !s.value;
                K.play(GameManager.getUIKey("sounds", "select"))
            }))
            addStuff(true, first ? PAD : PAD / 5);
            break;
        case SettingKind.RANGE:
            obj = K.add(uiSlider(tw, 1.5, item.text, (s as RangeSetting).min, (s as RangeSetting).max, (s as RangeSetting).step, () => s.value, v => s.value = v, item.formatValue ?? (x => x.toFixed(2))));
            addStuff(true, first ? PAD : PAD / 5);
            break;
        case SettingKind.SELECT:
            options = item.optionTextMap!;
            addGroup();
            for (const option of (s as SelectSetting<any>).options) {
                obj = K.add(uiPog(tw, 1.5, options[option]!, GameManager.getUIKey("sprites", "radio"), () => s.value === option, () => {
                    s.value = option;
                    K.play(GameManager.getUIKey("sounds", "select"))
                }));
                addStuff(false, first ? PAD : PAD / 5);
                prev = obj;
            }
            break;
        case SettingKind.MULTISELECT:
            options = item.optionTextMap!;
            addGroup();
            for (const option of (s as SelectMultipleSetting<any>).options) {
                obj = K.add(uiPog(tw, 1.5, options[option]!, GameManager.getUIKey("sprites", "checkbox"), () => s.value.includes(option), () => {
                    if (s.value.includes(option))
                        s.value.splice(s.value.indexOf(option), 1);
                    else
                        s.value.push(option);
                    K.play(GameManager.getUIKey("sounds", "select"))
                }));
                addStuff(false, first ? PAD : PAD / 5);
                prev = obj;
            }
            break;
    }
    return obj!;
}
