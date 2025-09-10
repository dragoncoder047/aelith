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

// why do I need this??? YAML supports merge keys
// but I cannot get esbuild-yaml to enable it!!
function transform(val) {
    if (typeof val !== "object") return val;
    if (Array.isArray(val)) return val.map(transform);
    const out = {};
    const names = Object.keys(val);
    for (var name of names) {
        if (name === "<<") Object.assign(out, transform(val[name]));
        else out[name] = transform(val[name]);
    }
    return out;
}

/** @type {esbuild.BuildOptions} */
const config = {
    bundle: true,
    sourcemap: true,
    minify: process.argv.includes("--release"),
    keepNames: false, // this uses a lot of memory, wtf?
    metafile: true,
    platform: "browser",
    charset: "utf8",
    loader: {
        ".png": "dataurl",
        ".woff": "dataurl",
        ".otf": "dataurl",
    },
    entryPoints: [packageJSON.main],
    format: "esm",
    target: "esnext",
    treeShaking: true,
    outfile: "build/aelith.js",
    plugins: [
        glslPlugin(),
        yamlPlugin({ transform }),
        {
            name: "nonexistent_go_bye_bye",
            setup(build) {
                build.onResolve({ filter: /\.p$/ }, async args => {
                    if (!(await exists(path.join(args.resolveDir, args.path)))) return { external: true };
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
