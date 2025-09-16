import argparse
import base64
import itertools
import json
import pathlib
import typing

import yaml
from minify_and_includes_glsl import minify_shader, process_includes

here = pathlib.Path(__file__).parent
output = pathlib.Path(here, "../build/aelith.json")
input = pathlib.Path(here, "../data/index.yaml")

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


def construct_flattened(loader: Loader, node: yaml.Node) -> list[typing.Any]:
    lists = loader.construct_sequence(node)
    return list(itertools.chain.from_iterable(lists))


def construct_include(loader: Loader, node: yaml.Node) -> typing.Any:
    """Include file referenced at node."""

    file = pathlib.Path(
        loader._root, loader.construct_scalar(node)).resolve()
    extension = file.suffix

    if extension in (".yaml", ".yml"):
        return yaml.load(file.open(), Loader)
    elif extension in (".json", ):
        return json.load(file.open)
    elif extension in (".glsl", ".frag", ".vert"):
        text = process_includes(file.read_text(), file)
        if minify:
            text = minify_shader(text)
        return text
    elif extension in (".png", ".woff", ".otf"):
        return f"data:{({
            ".png": "image/png",
            ".woff": "font/woff",
            ".otf": "font/otf"}[extension])};base64,{
            base64.b64encode(file.read_bytes()).decode()}"
    else:
        return file.read_text()


yaml.add_constructor("!include", construct_include, Loader)
yaml.add_constructor("!flatten", construct_flattened, Loader)

# main stuff

datapack = yaml.load(input.open(), Loader)
if minify:
    json.dump(datapack, output.open("w"), separators=(",", ":"))
else:
    json.dump(datapack, output.open("w"), indent=4)
