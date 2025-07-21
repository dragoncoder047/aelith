import yaml

LANGS = ["en", "es", "de", "ja"]


def get_json(path: str):
    with open(path) as f:
        return yaml.load(f, Loader=yaml.FullLoader)


LANG_ENTRIES = {}

for lang in LANGS:
    LANG_ENTRIES[lang] = get_json(f"./assets/translations/{lang}.yaml")

PATHS_ALL = set()
PATHS_BY_LANG = {}


def recursive_all(vars, byLang: set[str]):
    def recur(curPath, obj):
        if isinstance(obj, str):
            PATHS_ALL.add(".".join(curPath))
            byLang.add(".".join(curPath))
        elif isinstance(obj, dict):
            for next in obj:
                recur(curPath + [next], obj[next])
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
