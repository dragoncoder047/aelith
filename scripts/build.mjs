import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import packageJSON from "../package.json" with { type: "json" };
import yamlPlugin from "esbuild-yaml";
import glslPlugin from "esbuild-plugin-glsl";

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
function exists(path) {
    return new Promise(res => fs.stat(path, fs.constants.F_OK, err => res(!err)));
}

// ---------------------------------------------------------------------------
// MARK: config and CLI


/** @type {esbuild.BuildOptions} */
const config = {
    bundle: true,
    sourcemap: true,
    minify: false,
    keepNames: false, // this uses a lot of memory, wtf?
    metafile: true,
    platform: "browser",
    charset: "utf8",
    loader: {
        ".png": "dataurl",
        ".woff": "dataurl",
    },
    entryPoints: [packageJSON.main],
    format: "esm",
    target: "esnext",
    treeShaking: true,
    outfile: "build/debugger.js",
    plugins: [
        glslPlugin(),
        yamlPlugin({
            json: true,
            version: "1.1",
            merge: true
        }),
        {
            name: "nonexistent_go_bye_bye",
            setup(build) {
                build.onResolve({ filter: /\.p$/ }, async args => {
                    if (!(await exists(args.path))) return { external: true };
                })
            },
        },
        {
            name: "all_world_files",
            setup(build) {
                build.onResolve({ filter: /\*.txt$/ }, args => {
                    return {
                        path: "aaa",
                        namespace: "aaa",
                        pluginData: {
                            absPath: path.join(path.dirname(args.importer), args.path)
                        }
                    }
                });
                build.onLoad({ filter: /./, namespace: "aaa" }, args => {
                    const dir = path.dirname(args.pluginData.absPath);
                    const files = fs.readdirSync(dir).filter(x => /\.txt$/.test(x));
                    const worlds = {};
                    for (var f of files) {
                        worlds[f.replace(/\.txt$/, "")] = fs.readFileSync(path.join(dir, f), { encoding: "utf8" });
                    }
                    return {
                        contents: JSON.stringify(worlds),
                        loader: "json",
                        watchDirs: [dir],
                        watchFiles: files
                    }
                });
            }
        }
    ]
};

if (process.argv.includes("-w")) {
    config.plugins.push({
        name: "logger",
        setup(build) {
            build.onEnd(result => {
                if (result.errors.length == 0)
                    console.error(`[${new Date().toLocaleTimeString()}] rebuilt ${config.outfile} OK`);
                else
                    console.error(`[${new Date().toLocaleTimeString()}] failed to build ${config.outfile}`);
            });
        },
    });
    await esbuild.context(config).then(ctx => ctx.watch());
}
else {
    const result = await esbuild.build(config);
    if (result.metafile) fs.writeFileSync("build/meta.json", JSON.stringify(result.metafile))
}
