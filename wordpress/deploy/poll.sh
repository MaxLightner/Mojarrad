#!/bin/bash
set -euo pipefail
umask 077
export PATH="/usr/local/cpanel/3rdparty/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
exec 9>/home/tutivari/.nikabana-deploy.lock
flock -n 9 || exit 0
[[ "$(git -C "$repo" branch --show-current)" == wordpress ]]
[[ -z "$(git -C "$repo" status --porcelain)" ]]
export GIT_TERMINAL_PROMPT=0
git -C "$repo" fetch --quiet origin wordpress
git -C "$repo" merge --ff-only --quiet origin/wordpress
/bin/bash "$repo/wordpress/deploy/deploy.sh"
