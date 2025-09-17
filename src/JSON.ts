
export type JSONPrimitive = number | string | boolean | null;
export type JSONArray = (JSONValue | undefined)[];
export interface JSONObject {
    [key: string]: JSONValue | undefined;
}
export type JSONValue = JSONPrimitive | JSONArray | JSONObject;
