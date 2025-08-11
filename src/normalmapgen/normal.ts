import { K } from "../init";
import normalShaderSrc from "./normal_convolve.glsl";


// cSpell: ignore Sobel
// Must be a square matrix or the math breaks

// TODO:
//  * make them all 9x9 (fill rest with zeros)
//  * add parameter to the loadNormal to choose the kernel

// const SOBEL = [
//     [-1, -2, -3, -4, 0, 4, 3, 2, 1],
//     [-2, -3, -4, -5, 0, 5, 4, 3, 2],
//     [-3, -4, -5, -6, 0, 6, 5, 4, 3],
//     [-4, -5, -6, -7, 0, 7, 6, 5, 4],
//     [-5, -6, -7, -8, 0, 8, 7, 6, 5],
//     [-4, -5, -6, -7, 0, 7, 6, 5, 4],
//     [-3, -4, -5, -6, 0, 6, 5, 4, 3],
//     [-2, -3, -4, -5, 0, 5, 4, 3, 2],
//     [-1, -2, -3, -4, 0, 4, 3, 2, 1]
// ];

const SOBEL = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
];

const KERNEL_X = SOBEL.flat(1);
const KERNEL_Y = transpose(SOBEL).flat(1);
const KERNEL_SIZE = SOBEL.length;
const KERNEL_OFFSET = (KERNEL_SIZE - 1) / 2;
const KERNEL_LEN = KERNEL_SIZE ** 2;
const KERNEL_MIDDLE = (KERNEL_SIZE + 1) * KERNEL_OFFSET;

const normalShaderSrcWithDefines = `
#define KERNEL_SIZE ${KERNEL_SIZE}
#define KERNEL_LEN ${KERNEL_LEN}
#define KERNEL_MIDDLE ${KERNEL_MIDDLE}
#define KERNEL_OFFSET ${KERNEL_OFFSET}
${normalShaderSrc}`;

K.loadShader("normalMapMake", undefined, normalShaderSrcWithDefines);

export async function loadNormals(spriteName: string, nmName = spriteName + "-nm") {
    const data = await K._k.assets.sprites.waitFor(spriteName, K._k.globalOpt.loadTimeout ?? 3000);
    const frames = data.frames;
    const canvas = K.makeCanvas(data.width, data.height);
    const urls: string[] = [];
    const ow = K._k.gfx.width;
    const oh = K._k.gfx.height;
    K._k.gfx.width = data.width;
    K._k.gfx.height = data.height;
    for (var i = 0; i < frames.length; i++) {
        const q = frames[i]!;
        canvas.draw(() => {
            canvas.clear();
            K.drawSprite({
                sprite: spriteName,
                frame: i,
                width: data.width,
                height: data.height,
                anchor: "topleft",
                shader: "normalMapMake",
                fixed: true,
                uniform: {
                    u_texel_size: K.vec2(q.w / data.width, q.h / data.height),
                    u_strength: 10,
                    u_kernel_x: KERNEL_X,
                    u_kernel_y: KERNEL_Y,
                    u_quad_tl: K.vec2(q.x, q.y),
                    u_quad_wh: K.vec2(q.w, q.h),
                }
            });
        });
        urls.push(canvas.toDataURL());
    }
    K._k.gfx.width = ow;
    K._k.gfx.height = oh;
    console.log("normal maps for", spriteName, "are", urls);
    await K.loadSprite(nmName, urls);
    canvas.free();
}

function transpose<T>(a: T[][]): T[][] {
    return a[0]!.map((_, i) => a.map(r => r[i]!));
}
