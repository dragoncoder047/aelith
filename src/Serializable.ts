import { JSONObject } from "./JSON";

export interface Serializable {
    toJSON(): JSONObject;
}
