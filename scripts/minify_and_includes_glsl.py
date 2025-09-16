import pathlib
import re
import sys

COMMENT_RE = re.compile(r"(?:\/\*[\s\S]*?\*\/)|(?:\/\/.*\n)")
SYMBOL_RE = re.compile(r"\s*([{}=*,+/><&|[\]()\\!?:;-])\s*")
GENERIC_RE = re.compile(r"(\w<\w+>)\s*(\w)")

INCLUDE_RE: re.Pattern[str] = re.compile(r"""#include +["']([.\\/\w-]+)["']""", re.MULTILINE)

# based on:
# https://github.com/vanruesc/esbuild-plugin-glsl/blob/main/src/minifyShader.ts


def minify_shader(src: str) -> str:
    src = src.replace("\r", "")
    # remove comments
    src = COMMENT_RE.sub("", src)
    bits: list[str] = []
    wrap = False
    sepBySymbol = False
    for line in src.splitlines():
        line = " ".join(line.split()).strip()
        if not line:
            continue
        if line.startswith("#"):
            if wrap:
                bits.append("\n")
            wrap = False
            bits.append(line)
            bits.append("\n")
        else:
            line = SYMBOL_RE.sub("$1", line)
            if not sepBySymbol and line[0].isspace():
                line = " " + line
            line = GENERIC_RE.sub("$1 $2", line)
            sepBySymbol = not line[-1].isspace()
            wrap = True
            bits.append(line)
    return "".join(bits)

# based on:
# https://github.com/vanruesc/esbuild-plugin-glsl/blob/main/src/loadShader.ts


def process_includes(src: str, me_path: pathlib.Path,
                     cache: dict[str, str] = {}) -> str:
    imports = dict[str, str] = {}
    for m in INCLUDE_RE.finditer(src):
        everything = m.group(0)
        filename = m.group(1)
        abs_filename = pathlib.Path(me_path, filename)
        real_path = abs_filename.resolve().as_uri()
        cached = cache.get(real_path)
        if cached is None:
            cached = process_includes(
                abs_filename.read_text(), abs_filename, cache)
            cache[real_path] = cached
        imports[everything] = cached
    for include in imports:
        src = src.replace(include, imports[include])
    return src


# that's literally it
src = sys.stdin.read()
path = sys.argv[2]  # 0 = python3, 1 = this script
print(minify_shader(process_includes(src, pathlib.Path(path))))
