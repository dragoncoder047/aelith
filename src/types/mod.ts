import { ButtonBinding } from "kaplay";
import { K } from "../context";
import * as lifeweb from "lifeweb";

type AutoprefixedTranslationKey = string;
type AutoprefixedResourceID = string;
type ModIdentifier = string;

export interface Mod {
    /** The id of the mod, prefixed before all of its resources automatically. */
    id: string,
    /** The user-facing name of the mod, can be a translation key. */
    name: string,
    /** true if the mod is only a common library and shouldn't show in the mod list */
    isLibrary?: boolean;
    /** Description to show in the mod menu/search page, can be a translation key. */
    description: string,
    /** Resource ID of the sprite that is the mod's icon. */
    icon?: AutoprefixedResourceID,
    /** metadata about the mod itself - source code, documentation, etc */
    project?: ProjectInfo;
    /** information about the people who built the mod */
    author?: AuthorInfo[];
    /** lists which mods this requires (will be auto-downloaded if available), and which ones it is known to conflict with. */
    deps: Dependencies,
    /** list of jq expressions that will be applied in sequence to the game JSON. */
    patches: string[];
    /** custom data the patches can reference as `.DATA`. */
    data: any;
    /** mod resources - resource IDs are available as `.RES` to patches */
    resources: Record<AutoprefixedResourceID, ModResource>;
    /** Mod-specific config options */
    config: ModConfig;
}

interface Dependencies {
    required: DependencyGroup;
    suggested?: DependencyGroup;
    breaks?: DependencyGroup;
}

interface DependencyGroup { [id: ModIdentifier]: string };

interface AuthorInfo {
    name: string;
    roles: ("author" | "artist" | "composer" | "foley" | "translator" | "contributor")[];
    email?: string;
    webpage?: string;
    discord?: [username: string, id: string];
    [method: string]: string | string[] | undefined;
}

interface ProjectInfo {
    docs?: string;
    repository: string;
}

type ExtractLoadNames<T> = {
    [K in keyof T]: K extends `load${infer Name}` ? Name extends "" | "Root" | "Progress" | "JSON" ? never : Name : never
}[keyof T]

type KAPLAYResourceKind = ExtractLoadNames<typeof K>

interface ModResource {
    type: KAPLAYResourceKind;
    src: string | string[] | object | object[];
}

export type ModConfig = Record<AutoprefixedResourceID, ModConfigOption>;

/** name, description, and category are translation keys within mod (autoprefixed) */
interface BaseModConfigOption {
    name: AutoprefixedTranslationKey;
    description?: AutoprefixedTranslationKey;
    category?: AutoprefixedTranslationKey;
    requiresRestart?: boolean;
    hidden?: boolean;
}

export type ModConfigOption =
    | BooleanOption
    | NumberOption
    | StringOption
    | SelectOption
    | MultiSelectOption
    | ListOption
    | ColorOption
    | KeybindOption

export interface BooleanOption extends BaseModConfigOption {
    type: "boolean";
    default: boolean;
    /** default = switch */
    display?: "switch" | "check";
}

export interface NumberOption extends BaseModConfigOption {
    type: "number"
    default: number;
    min?: number;
    max?: number;
    step?: number;
    /** prefer slider only on things where the exact value isn't critical */
    display: "box" | "slider";
}

export interface StringOption extends BaseModConfigOption {
    type: "string";
    default: string;
    maxLength?: number;
    placeholder?: string;
    display?: "single_line" | "multi_line" | "password";
}

export interface SelectOption extends BaseModConfigOption {
    type: "select";
    default: string;
    options: { value: string; label: AutoprefixedTranslationKey }[];
    /** default = radio */
    display?: "dropdown" | "radio";
}

export interface MultiSelectOption extends BaseModConfigOption {
    type: "multiselect"
    default: string[];
    options: { value: string; label: AutoprefixedTranslationKey }[];
    /** default = checkboxes */
    display?: "checkboxes" | "dropdown";
    minSelected?: number;
    maxSelected?: number;
}

export interface ListOption extends BaseModConfigOption {
    type: "list";
    default: string[];
    /**
     * TODO: extend this to include "resource", "entity_type", "tile_type", etc
     */
    itemType: "string" | "number";
    allowDuplicates?: boolean;
    maxItems?: number;
}

export interface ColorOption extends BaseModConfigOption {
    type: "color";
    /** Always stored in HEX format RGBA; KAPLAY works with this internally using {@link Color} objects */
    default: string;
}

export interface KeybindOption extends BaseModConfigOption {
    type: "keybind";
    default: ButtonBinding;
}