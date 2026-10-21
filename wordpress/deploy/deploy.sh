#!/bin/bash
# Deploy only this project's code. Database, uploads and wp-config.php are untouched.
set -euo pipefail
umask 022
export PATH="/usr/local/cpanel/3rdparty/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
home_root="${NIKABANA_HOME:-/home/tutivari}"
home_root="$(realpath "$home_root")"
web="$home_root/public_html"
[[ -f "$web/wp-config.php" && -d "$web/wp-content" && ! -L "$web/wp-content" ]] || { echo "Invalid WordPress root"; exit 1; }
[[ "$(git -C "$repo" branch --show-current)" == wordpress ]] || { echo "Only wordpress can deploy"; exit 1; }
sha="$(git -C "$repo" rev-parse HEAD)"
state="$home_root/.nikabana-release"
if [[ -f "$state" && "$(cat "$state")" == "$sha" ]]; then echo "Already deployed $sha"; exit 0; fi
# Prevent deploying a rewritten branch or an accidental older checkout.
if [[ -f "$state" ]]; then git -C "$repo" merge-base --is-ancestor "$(cat "$state")" "$sha"; fi
theme="$repo/wordpress/themes/mojarrad"
plugin="$repo/wordpress/plugins/mojarrad-core"
[[ -f "$theme/style.css" && -f "$theme/functions.php" && -f "$plugin/mojarrad-core.php" ]]
[[ -z "$(find "$theme" "$plugin" -type l -print -quit)" ]] || { echo "Symlink in source"; exit 1; }
php_bin="${NIKABANA_PHP:-$(command -v php)}"
find "$theme" "$plugin" -name '*.php' -type f -print0 | while IFS= read -r -d '' file; do "$php_bin" -l "$file" >/dev/null; done
for kind in themes plugins; do
  [[ ! -L "$web/wp-content/$kind" ]]
  mkdir -p "$web/wp-content/$kind"
done
for pair in "themes/mojarrad" "plugins/mojarrad-core"; do
  target="$web/wp-content/$pair"
  [[ ! -L "$target" ]]
  mkdir -p "$target"
  [[ "$(realpath "$target")" == "$web/wp-content/$pair" ]] || exit 1
done
# Synchronization is restricted to our two code directories, without rsync or /dev/fd.
"$php_bin" "$repo/wordpress/deploy/sync.php" "$theme" "$web/wp-content/themes/mojarrad"
"$php_bin" "$repo/wordpress/deploy/sync.php" "$plugin" "$web/wp-content/plugins/mojarrad-core"
printf '%s\n' "$sha" > "$web/wp-content/themes/mojarrad/release.txt"
printf '%s\n' "$sha" > "$state"
echo "Deployed $sha at $(date -u +%FT%TZ)"
