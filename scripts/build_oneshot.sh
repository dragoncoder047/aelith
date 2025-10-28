#!/bin/sh
set -euo pipefail
cmd() {
    echo $@
    $@
}
cmd pnpm run build:clean
cmd pnpm run build:data $@
cmd pnpm run build:js $@
