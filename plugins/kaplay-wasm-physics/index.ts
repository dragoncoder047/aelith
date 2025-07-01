import type { AreaComp, GameObj, KAPLAYCtx, Shape } from "kaplay";
import { makeCollisionClass } from "./collision";
import physicsWasmBin from "./physics.wat";
import { patchComponent } from "./monkey";

async function initWASM(imports: Record<string, any>): Promise<PhysicsWasmExports> {
    const mod = await WebAssembly.compile(physicsWasmBin);
    const inst = await WebAssembly.instantiate(mod, imports);
    return inst.exports as PhysicsWasmExports;
}

interface PhysicsWasmExports extends WebAssembly.Exports {
    readonly scratchpad: WebAssembly.Memory;
    readonly TT_RECT: WebAssembly.Global<"i32">;
    readonly TT_LINE: WebAssembly.Global<"i32">;
    readonly TT_POINT: WebAssembly.Global<"i32">;
    readonly TT_CIRCLE: WebAssembly.Global<"i32">;
    readonly TT_ELLIPSE: WebAssembly.Global<"i32">;
    readonly TT_POLYGON: WebAssembly.Global<"i32">;
    gc(): void;
    setScratchpad(index: number, value: number): void;
    runCollision(): void;
    clear(): void
    addOrUpdate(id: number, type: number): void;
    appendPointToPolygon(id: number, x: number, y: number): void;
    remove(id: number): void;
}

function isPaused(obj: GameObj): boolean {
    if (obj.paused) return true;
    return obj.parent ? isPaused(obj.parent) : false;
}

export function kaplayPhysicsWasm(k: KAPLAYCtx): Partial<KAPLAYCtx> {
    var wasm: PhysicsWasmExports;
    const idToObjMap = new Map<number, GameObj<AreaComp>>();
    const Collision = makeCollisionClass(k);
    const dumpToScratchpad = (...numbers: number[]) => {
        for (var i = 0; i < numbers.length; i++)
            wasm.setScratchpad(i, numbers[i]!);
    };
    const sapAddOrUpdate = (obj: GameObj<AreaComp>) => {
        const id = obj.id;
        idToObjMap.set(id, obj);
        const shape = obj.worldArea();
        if (shape instanceof k.Rect) {
            dumpToScratchpad(shape.width, shape.height, shape.pos.x, shape.pos.y);
            wasm.addOrUpdate(id, wasm.TT_RECT.value);
        } else if (shape instanceof k.Line) {
            dumpToScratchpad(shape.p1.x, shape.p1.y, shape.p2.x, shape.p2.y);
            wasm.addOrUpdate(id, wasm.TT_LINE.value);
        } else if (shape instanceof k.Point) {
            dumpToScratchpad(shape.pt.x, shape.pt.y);
            wasm.addOrUpdate(id, wasm.TT_POINT.value);
        } else if (shape instanceof k.Circle) {
            dumpToScratchpad(shape.center.x, shape.center.y, shape.radius);
            wasm.addOrUpdate(id, wasm.TT_CIRCLE.value);
        } else if (shape instanceof k.Ellipse) {
            dumpToScratchpad(shape.angle, shape.radiusX, shape.radiusY, shape.center.x, shape.center.y);
            wasm.addOrUpdate(id, wasm.TT_ELLIPSE.value);
        } else if (shape instanceof k.Polygon) {
            wasm.addOrUpdate(id, wasm.TT_POLYGON.value);
            for (var pt of shape.pts)
                wasm.appendPointToPolygon(id, pt.x, pt.y);
        }
    };
    const sapRemove = (obj: GameObj<AreaComp>) => {
        idToObjMap.delete(obj.id);
        wasm.remove(obj.id);
    }
    const wasmAPIFuncs: WebAssembly.Imports = {
        j: {
            isObjActive(id: number) {
                const obj = idToObjMap.get(id)!;
                return !obj.exists() || isPaused(obj) ? 0 : 1;
            },
            checkCollisionIgnore(idA: number, idB: number) {
                const obj = idToObjMap.get(idA)!;
                const other = idToObjMap.get(idB)!;
                for (const tag of obj.collisionIgnore) if (other.is(tag)) return 1;
                for (const tag of other.collisionIgnore) if (obj.is(tag)) return 1;
                return 0;
            },
            handleCollision(idA: number, idB: number, normX: number, normY: number, distance: number) {
                const obj = idToObjMap.get(idA)!;
                const other = idToObjMap.get(idB)!;
                const col1 = new Collision(
                    obj,
                    other,
                    k.vec2(normX, normY),
                    distance,
                );
                obj.trigger("collideUpdate", other, col1);
                const col2 = col1.reverse();
                // resolution only has to happen once
                col2.resolved = col1.resolved;
                other.trigger("collideUpdate", obj, col2);
            }
        }
    };
    k.load((async () => {
        wasm = await initWASM(wasmAPIFuncs);
    })());
    k.system("collision", () => {
        wasm.runCollision();
    }, [k.LCEvents.AfterFixedUpdate]);
    return {
        area: patchComponent(k, "area", {
            add(this: GameObj<AreaComp>) {
                sapAddOrUpdate(this);
            },
            fixedUpdate(this: GameObj<AreaComp>) {
                sapAddOrUpdate(this);
            },
            destroy(this: GameObj<AreaComp>) {
                sapRemove(this);
            }
        }),
    }
}
