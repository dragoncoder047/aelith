import * as esbuild from "esbuild";

/** @type {esbuild.BuildOptions} */
const config = {
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: "browser",
    loader: {
        ".png": "dataurl",
        ".glsl": "text",
        ".txt": "text"
    },
    entryPoints: ["main.ts"],
    format: "esm",
    target: "es6",
    treeShaking: true,
    outfile: "build/kont.js",
};

var watch = false;
if (process.argv.indexOf("-w") !== -1) watch = true;

if (watch) {
    const ctx = await esbuild.context({
        ...config,
        plugins: [
            {
                name: "logger",
                setup(build) {
                    build.onEnd(() => {
                        console.log(`[${new Date().toISOString()}] rebuilt ${config.outfile} success!`);
                    });
                },
            },
        ],
    });
    await ctx.watch();
}
else await esbuild.build(config);
