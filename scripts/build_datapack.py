# import yaml
import json
import pathlib

here = pathlib.Path(__file__).parent
there = pathlib.Path(here, "../build/aelith.json")

there.write_text(json.dumps([0] * 10000, separators=(',', ':')))
