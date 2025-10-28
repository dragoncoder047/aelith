import argparse
import base64
import json
import pathlib
import typing

import yaml
from minify_and_includes_glsl import minify_shader, process_includes

here = pathlib.Path(__file__).parent
output = here / "../build/aelith.json"
input = here / "../data/index.yaml"

main_parser = argparse.ArgumentParser()
main_parser.add_argument("--minify", action="store_true")
minify: bool = main_parser.parse_args().minify


class Loader(yaml.FullLoader):
    _root: pathlib.Path

    def __init__(self, stream: typing.IO) -> None:
        try:
            self._root = pathlib.Path(stream.name).parent
        except AttributeError:
            self._root = pathlib.Path.cwd()

        super().__init__(stream)


def flatten(loader: Loader, node: yaml.Node) -> list[typing.Any]:
    lists = loader.construct_sequence(node, True)
    return [item for sublist in lists for item in sublist]


def include(loader: Loader, node: yaml.Node) -> typing.Any:
    file = (loader._root / loader.construct_scalar(node)).resolve()
    ext = file.suffix

    if ext in (".yaml", ".yml"):
        return yaml.load(file.open(), Loader)
    elif ext in (".json", ):
        return json.load(file.open)
    elif ext in (".glsl", ".frag", ".vert"):
        text = process_includes(file.read_text(), file)
        if minify:
            text = minify_shader(text)
        return text
    elif ext in (".png", ".mp3"):
        return f"data:{({".png": "image/png",
                         ".mp3": "audio/mp3"}[ext])};base64,{
            base64.b64encode(file.read_bytes()).decode()}"
    elif ext in (".wav", ".ogg", ".woff", ".otf"):
        return base64.b64encode(file.read_bytes()).decode()
    else:
        return file.read_text()


yaml.add_constructor("!include", include, Loader)
yaml.add_constructor("!flatten", flatten, Loader)

# main stuff

if output.exists():
    output.unlink()
datapack = yaml.load(input.open(), Loader)
if minify:
    json.dump(datapack, output.open("w"),
              separators=(",", ":"), allow_nan=False)
else:
    json.dump(datapack, output.open("w"), indent=4, allow_nan=False)
