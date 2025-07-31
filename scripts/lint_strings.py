import yaml
import subprocess

LANGS = [
    "en",
    "es",
    # "de",
    # "ja",
]


def get_json(path: str):
    with open(path) as f:
        return yaml.load(f, Loader=yaml.FullLoader)


LANG_ENTRIES = {}

for lang in LANGS:
    LANG_ENTRIES[lang] = get_json(f"./src/assets/translations/{lang}.yaml")

PATHS_ALL: set[str] = set()
PATHS_BY_LANG = {}


def recursive_all(vars, byLang: set[str]):
    def recur(curPath: list[str], obj):
        p = ".".join(curPath)
        if isinstance(obj, str):
            PATHS_ALL.add(p)
            byLang.add(p)
        elif isinstance(obj, dict):
            for next in obj:
                recur(curPath + [next], obj[next])
        elif isinstance(obj, list):
            PATHS_ALL.add(f"{p}.length")
            byLang.add(f"{p}.length")
            for i in range(len(obj)):
                recur(curPath + [str(i)], obj[i])
    recur([], vars)


for lang in LANGS:
    PATHS_BY_LANG[lang] = set()
    recursive_all(LANG_ENTRIES[lang], PATHS_BY_LANG[lang])

for lang in LANGS:
    print(f"{lang}:")
    good = True
    for path in sorted(PATHS_ALL, reverse=True):
        if path not in PATHS_BY_LANG[lang]:
            print(f"  Missing translation {path}")
            good = False
    if good:
        print("  All good")

found_status = {p: subprocess.Popen(
    ["grep", "-Rq",
     "--include", "*.txt",
     "--include", "*.yaml",
     "--include", "*.ts", f"&msg.{p}"]).wait()
    for p in sorted(PATHS_ALL, reverse=True)}

for p, status in found_status.items():
    if status != 0:
        print(f"&msg.{p} is not used anywhere")
