#!/bin/bash
set -euo pipefail
source_repo="$(git rev-parse --show-toplevel)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --local --branch wordpress "$source_repo" "$tmp/repo"
export NIKABANA_HOME="$tmp/home"
mkdir -p "$NIKABANA_HOME/public_html/wp-content/"{uploads,themes/mojarrad,plugins/other}
printf keep > "$NIKABANA_HOME/public_html/wp-config.php"
printf keep > "$NIKABANA_HOME/public_html/wp-content/uploads/keep.jpg"
printf keep > "$NIKABANA_HOME/public_html/wp-content/plugins/other/keep.php"
printf stale > "$NIKABANA_HOME/public_html/wp-content/themes/mojarrad/stale.txt"
bash "$tmp/repo/wordpress/deploy/deploy.sh"
[[ "$(cat "$NIKABANA_HOME/public_html/wp-content/uploads/keep.jpg")" == keep ]]
[[ "$(cat "$NIKABANA_HOME/public_html/wp-config.php")" == keep ]]
[[ -f "$NIKABANA_HOME/public_html/wp-content/plugins/other/keep.php" ]]
[[ ! -f "$NIKABANA_HOME/public_html/wp-content/themes/mojarrad/stale.txt" ]]
[[ "$(cat "$NIKABANA_HOME/.nikabana-release")" == "$(git -C "$tmp/repo" rev-parse HEAD)" ]]
bash "$tmp/repo/wordpress/deploy/deploy.sh"
git -C "$tmp/repo" checkout -q -b wrong-branch
if bash "$tmp/repo/wordpress/deploy/deploy.sh"; then echo "Wrong branch was accepted"; exit 1; fi
git -C "$tmp/repo" checkout -q wordpress
# A PHP error must stop before copying code.
rm "$NIKABANA_HOME/.nikabana-release"
printf '<?php syntax error!' > "$tmp/repo/wordpress/themes/mojarrad/broken.php"
if bash "$tmp/repo/wordpress/deploy/deploy.sh"; then echo "Invalid PHP accepted"; exit 1; fi
[[ ! -f "$NIKABANA_HOME/public_html/wp-content/themes/mojarrad/broken.php" ]]
echo "Deployment boundary checks passed"
