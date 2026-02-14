import { JSONObject } from "../src/utils/JSON";

export interface Serializable {
    toJSON(): JSONObject;
}
