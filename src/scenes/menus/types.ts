import { Scene } from "../SceneManager";

export interface Menu {
    title: string;
    options: MenuItem[];
    refresh?(): void;
}

export type MenuItem =
    | SubmenuMenuItem
    | BackMenuItem
    | ButtonMenuItem
    | TextMenuItem
    | SettingMenuItem
    | NoBackSentinel;

interface MenuItemCommon {
    text: string;
    type: MenuItemType;
}

export enum MenuItemType {
    SUBMENU,
    BACK,
    BUTTON,
    TEXT,
    SETTING
}

export interface SubmenuMenuItem extends MenuItemCommon {
    type: MenuItemType.SUBMENU;
    next: string;
}

export interface BackMenuItem extends MenuItemCommon {
    type: MenuItemType.BACK;
}

export interface ButtonMenuItem extends MenuItemCommon {
    type: MenuItemType.BUTTON;
    help: string;
    action(): void | Promise<void>;
}

export interface TextMenuItem extends MenuItemCommon {
    type: MenuItemType.TEXT,
}

export interface SettingMenuItem extends MenuItemCommon {
    type: MenuItemType.SETTING;
    setting: string;
    help: string;
    altDisplay?: boolean;
    optionTextMap?: Record<string, string>;
    formatValue?(x: number): string;
}

export interface NoBackSentinel {
    type?: undefined;
    nb: true;
}
