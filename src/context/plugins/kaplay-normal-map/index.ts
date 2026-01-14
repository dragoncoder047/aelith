import { Asset, KAPLAYCtx } from "kaplay";
import normalShaderSrc from "./normal_convolve.glsl";

// cSpell: ignore Sobel

type NMGenAlgo =
    | "sobel3x3";

export interface KAPLAYNormalMapGenPlugin {
    setNormalMap(forSprite: string, normalMapSprite?: string): void;
    generateNormalMapFor(sprite: string, algorithm?: NMGenAlgo, normalMapSprite?: string): Asset<void>;
    getNormalMapSprite(forSprite: string): string | undefined;
};

export function kaplayNormalMapGen(K: KAPLAYCtx & KAPLAYNormalMapGenPlugin): KAPLAYNormalMapGenPlugin {

    // sobel3x3

    // const SOBEL = [
    //     [-1, 0, 1],
    //     [-2, 0, 2],
    //     [-1, 0, 1],
    // ];

    // const KERNEL_X = SOBEL.flat(1);
    // const KERNEL_Y = transpose(SOBEL).flat(1);
    // const KERNEL_SIZE = SOBEL.length;
    // const KERNEL_OFFSET = (KERNEL_SIZE - 1) / 2;
    // const KERNEL_LEN = KERNEL_SIZE ** 2;
    // const KERNEL_MIDDLE = (KERNEL_SIZE + 1) * KERNEL_OFFSET;

    // const normalShaderSrcWithDefines = `
    // #define KERNEL_SIZE ${KERNEL_SIZE}
    // #define KERNEL_LEN ${KERNEL_LEN}
    // #define KERNEL_MIDDLE ${KERNEL_MIDDLE}
    // #define KERNEL_OFFSET ${KERNEL_OFFSET}
    // ${normalShaderSrc}`;

    const sobel3x3x = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobel3x3y = [1, 2, 1, 0, 0, 0, -1, -2, -1];
    const sobelShaderSrc = `
#define KERNEL_SIZE 3
#define KERNEL_LEN 9
#define KERNEL_OFFSET 1
#define KERNEL_MIDDLE 4
${normalShaderSrc}
`;

    const sobel3x3shaderName = "__sobel3x3";
    K.loadShader(sobel3x3shaderName, null, sobelShaderSrc);

    const normalMapMap = new Map<string, string>();

    const ALGORITHMS: Record<NMGenAlgo, ((srcSprite: string, targetName: string) => Promise<void>)> = {
        async sobel3x3(spriteName, nmName) {
            const data = await K._k.assets.sprites.waitFor(spriteName, K._k.globalOpt.loadTimeout ?? 3000);
            const frames = data.frames;
            const canvas = K.makeCanvas(Math.round(data.width), Math.round(data.height));
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
                        shader: sobel3x3shaderName,
                        fixed: true,
                        uniform: {
                            u_texel_size: K.vec2(q.w / data.width, q.h / data.height),
                            u_strength: 10,
                            u_kernel_x: sobel3x3x,
                            u_kernel_y: sobel3x3y,
                            u_quad_tl: K.vec2(q.x, q.y),
                            u_quad_wh: K.vec2(q.w, q.h),
                        }
                    });
                });
                urls.push(canvas.toDataURL());
            }
            K._k.gfx.width = ow;
            K._k.gfx.height = oh;
            await K.loadSprite(nmName, urls);
            K.setNormalMap(spriteName, nmName);
            console.log("normal map for", spriteName, "is", urls);
        }
    };
    return {
        setNormalMap(forSprite, normalMapSprite = forSprite + "-nm") {
            console.log("loaded normal map for", forSprite);
            normalMapMap.set(forSprite, normalMapSprite);
        },
        generateNormalMapFor(sprite, algorithm = "sobel3x3", normalMapSprite = sprite + "-nm") {
            const algo = ALGORITHMS[algorithm];
            if (!algo) throw new Error("unknown normal map generation algorithm " + algorithm);
            return K.load(algo(sprite, normalMapSprite));
        },
        getNormalMapSprite(forSprite) {
            return normalMapMap.get(forSprite);
        },
    }
}
