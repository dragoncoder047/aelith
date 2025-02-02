import * as esbuild from "esbuild";
import * as fs from "node:fs";
import packageJSON from "./package.json" with { type: "json" };

/** @type {esbuild.BuildOptions} */
const config = {
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: "browser",
    loader: {
        ".png": "dataurl",
        ".glsl": "text",
        ".txt": "text",
        ".woff": "dataurl"
    },
    entryPoints: [packageJSON.main],
    format: "esm",
    target: "esnext",
    treeShaking: true,
    outfile: "build/debugger.js",
};

var watch = false;
if (process.argv.includes("-w")) watch = true;

if (watch) {
    const ctx = await esbuild.context({
        ...config,
        plugins: [
            {
                name: "logger",
                setup(build) {
                    build.onEnd(result => {
                        if (result.errors.length == 0)
                            console.error(`[${new Date().toISOString()}] rebuilt ${config.outfile} success!`);
                        else
                            console.error(`[${new Date().toISOString()}] failed to build ${config.outfile}!`)
                    });
                },
            },
            {
                name: "nonexistent_go_bye_bye",
                setup(build) {
                    build.onResolve({ filter: /\.p$/ }, async args => {
                        if (!(await exists(args.path))) return { external: true };
                    })
                },
            }
        ],
    });
    await ctx.watch();
}
else await esbuild.build(config);

function exists(path) {
    return new Promise(res => fs.stat(path, fs.constants.F_OK, err => res(!err)));
}
