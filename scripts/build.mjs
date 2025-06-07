import * as esbuild from "esbuild";
import * as fs from "node:fs";
import packageJSON from "../package.json" with { type: "json" };

// sanity check
if (decompress(compress("a".repeat(100))) !== "a".repeat(100)) throw "bad";

const compressionRuntimeSrc = `/* Auto-generated file... */
export ${decompress}
`;

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
function exists(path) {
    return new Promise(res => fs.stat(path, fs.constants.F_OK, err => res(!err)));
}

/**
 * @param {string} contents
 * @param {string} path
 * @returns {string}
 */
function rawstring_compressed(contents, path) {
    const m = `/* Auto-generated file... */
import { decompress } from "$$DECOMPRESSOR_RUNTIME";
const ${nameify(path)}_crunch = ${JSON.stringify(compress(contents))}
const ${nameify(path)} = decompress(${nameify(path)}_crunch);
export default ${nameify(path)};
`;
    return m;
}

/**
 * @param {string} json
 * @param {string} path
 * @returns {string}
 */
function json_compressed(json, path) {
    const m = `/* Auto-generated file... */
import { decompress } from "$$DECOMPRESSOR_RUNTIME";
const ${nameify(path)}_crunch = ${JSON.stringify(compress(json))};
const ${nameify(path)} = JSON.parse(decompress(${nameify(path)}_crunch));
export default ${nameify(path)};
`;
    return m;
}

/**
 * @param {string} string
 * @returns {string}
 */
function nameify(string) {
    const suffix = string.substring(string.lastIndexOf("/"));
    return suffix.replace(/[^\w]/g, "_").replace(/^_+/, "");
}

// compression and decompression algorithms taken from https://github.com/psyked/LZW-js

/**
 * @param {string} contents
 * @returns {string}
 */
function compress(string) {
    var dict = {};
    var data = encodeURIComponent(string).split("");
    var out = [];
    var ch;
    var b = data[0];
    var c = 256;
    var i, l;
    for (i = 1, l = data.length; i < l; i++) {
        ch = data[i];
        if (dict[b + ch] != null) {
            b += ch;
        }
        else {
            out.push(b.length > 1 ? dict[b] : b.charCodeAt(0));
            dict[b + ch] = c;
            c++;
            b = ch;
        }
    }
    out.push(b.length > 1 ? dict[b] : b.charCodeAt(0));
    for (i = 0, l = out.length; i < l; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

/**
 * @param {string} compressed
 * @returns {string}
 */
function decompress(string) {
    var dict = {};
    var data = (string + "").split("");
    var ch = data[0];
    var w = ch;
    var out = [ch];
    var c = 256;
    var b;
    for (var i = 1; i < data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            b = data[i];
        }
        else {
            b = dict[currCode] ? dict[currCode] : (w + ch);
        }
        out.push(b);
        ch = b.charAt(0);
        dict[c] = w + ch;
        c++;
        w = b;
    }
    return decodeURIComponent(out.join(""));
}

// ---------------------------------------------------------------------------
// MARK: config and CLI


/** @type {esbuild.BuildOptions} */
const config = {
    bundle: true,
    sourcemap: true,
    minify: false,
    keepNames: true,
    metafile: true,
    platform: "browser",
    charset: "utf8",
    loader: {
        ".png": "dataurl",
        ".woff": "dataurl"
    },
    entryPoints: [packageJSON.main],
    format: "esm",
    target: "esnext",
    treeShaking: true,
    outfile: "build/debugger.js",
    plugins: [
        {
            name: "nonexistent_go_bye_bye",
            setup(build) {
                build.onResolve({ filter: /\.p$/ }, async args => {
                    if (!(await exists(args.path))) return { external: true };
                })
            },
        },
        {
            name: "compress_ext",
            setup(build) {
                build.onResolve({ filter: /^\$\$DECOMPRESSOR_RUNTIME$/ }, () => {
                    return {
                        path: "$$DECOMPRESSOR_RUNTIME",
                        namespace: "compress_ext",
                    }
                });
                build.onLoad({ filter: /^\$\$DECOMPRESSOR_RUNTIME/, namespace: "compress_ext" }, () => {
                    return { contents: compressionRuntimeSrc };
                })
                build.onLoad({ filter: /\.(txt|glsl)$/ }, args => {
                    return {
                        contents: rawstring_compressed(fs.readFileSync(args.path), args.path)
                    }
                });
                build.onLoad({ filter: /\.json$/ }, args => {
                    return {
                        contents: json_compressed(fs.readFileSync(args.path), args.path)
                    }
                });
            }
        },
        {
            name: "all_world_files",
            setup(build) {
                build.onStart(() => {
                    const all_files = fs.readdirSync("assets/level_maps/").filter(x => /\.txt$/.test(x));
                    const worlds = {};
                    for (var f of all_files) {
                        worlds[f.replace(/\.txt$/, "")] = fs.readFileSync("assets/level_maps/" + f, { encoding: "utf8" });
                    }
                    const ws = JSON.stringify(worlds);
                    fs.writeFileSync("assets/level_maps/ALL.json", ws);
                    console.error(`rebuilt levels/ALL.json`);
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
                    console.error(`rebuilt ${config.outfile} OK`);
                else
                    console.error(`failed to build ${config.outfile}`);
            });
        },
    });
    await esbuild.context(config).then(ctx => ctx.watch());
}
else {
    const result = await esbuild.build(config);
    if (result.metafile) fs.writeFileSync("build/meta.json", JSON.stringify(result.metafile))
}
