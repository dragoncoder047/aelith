import glob
import os

levels = glob.glob("assets/level_maps/*.txt")

for f in levels:
    n = os.path.basename(f)
    with open(f) as fp:
        txt = fp.read()
    if "(introduction)d" not in txt:
        print(f"Level {n} has no intro")
    if "(name)d" not in txt:
        print(f"Level {n} has no name")
