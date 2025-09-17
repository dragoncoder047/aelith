import { EntityPrototypeData } from "../DataPackFormat";

var entityPrototypes: Record<string, EntityPrototypeData> = {};

export function setEntityLibrary(lib: Record<string, EntityPrototypeData>) {
    entityPrototypes = lib;
}
