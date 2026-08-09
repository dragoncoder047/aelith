import * as fs from "node:fs";
import * as path from "node:path";
import packageJSON from "../package.json" with { type: "json" };
import glsl from "esbuild-plugin-glsl";

// ---------------------------------------------------------------------------
// MARK: config and CLI

const minify = process.argv.includes("--minify");

await Bun.build({
    sourcemap: true,
    minify,
    loader: {
        ".png": "dataurl",
        ".woff": "dataurl",
        ".otf": "dataurl",
        ".mp3": "dataurl",
    },
    entrypoints: [packageJSON.main],
    format: "esm",
    target: "browser",
    treeShaking: true,
    outfile: "build/aelith.js",
    plugins: [
        glsl({
            minify,
        }) as any as Bun.PluginBuilder,
        {
            name: "nonexistent_go_bye_bye",
            setup(build) {
                build.onResolve({ filter: /\.p$/ }, async args => {
                    if (!fs.existsSync(path.join(args.resolveDir, args.path))) return { path: args.path, external: true };
                });
            },
        },
        // {
        //     name: "all_world_files",
        //     setup(build) {
        //         build.onResolve({ filter: /\*.txt$/ }, args => {
        //             return {
        //                 path: "aaa",
        //                 namespace: "aaa",
        //                 pluginData: {
        //                     absPath: path.join(path.dirname(args.importer), args.path)
        //                 }
        //             }
        //         });
        //         build.onLoad({ filter: /./, namespace: "aaa" }, args => {
        //             const dir = path.dirname(args.pluginData.absPath);
        //             const files = fs.readdirSync(dir).filter(x => /\.txt$/.test(x));
        //             const worlds = {};
        //             for (var f of files) {
        //                 worlds[f.replace(/\.txt$/, "")] = fs.readFileSync(path.join(dir, f), { encoding: "utf8" });
        //             }
        //             return {
        //                 contents: JSON.stringify(worlds),
        //                 loader: "json",
        //                 watchDirs: [dir],
        //                 watchFiles: files
        //             }
        //         });
        //     }
        // }
    ]
});
