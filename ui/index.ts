import { K } from "../init";

export const UI = K.add([K.fixed(), K.pos(), K.layer("ui")]);

// these are functions so they happen after import time
import("./perf");
import("./inventory");
import("./timer");
import("./playerManpage");
