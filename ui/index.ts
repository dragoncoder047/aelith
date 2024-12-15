import { K } from "../init";

export const UI = K.add([K.fixed(), K.layer("ui")]);

// these are functions so they happen after import time
import("./stats");
import("./inventory");
import("./timer");
import("./playerManpage");
