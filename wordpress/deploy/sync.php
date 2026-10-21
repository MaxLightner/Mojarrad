<?php
// CLI-only synchronization inside an explicitly validated project code directory.
if (PHP_SAPI !== 'cli' || $argc !== 3) { exit(1); }
$source = realpath($argv[1]);
$target = realpath($argv[2]);
if (!$source || !$target || !in_array(basename($target), array('mojarrad', 'mojarrad-core'), true)
    || !in_array(basename(dirname($target)), array('themes', 'plugins'), true)
    || basename(dirname(dirname($target))) !== 'wp-content') { exit(1); }
function entries(string $path): array {
    return array_values(array_diff(scandir($path), array('.', '..', 'release.txt', 'fixtures')));
}
function validate_tree(string $path): void {
    foreach (entries($path) as $name) {
        $file = $path . '/' . $name;
        if (is_link($file)) { throw new RuntimeException('Symlink refused: ' . $file); }
        if (is_dir($file)) { validate_tree($file); }
    }
}
function remove_code(string $path): void {
    if (is_dir($path)) {
        foreach (array_diff(scandir($path), array('.', '..')) as $name) { remove_code($path . '/' . $name); }
        if (!rmdir($path)) { throw new RuntimeException('Cannot remove directory'); }
    } elseif (!unlink($path)) { throw new RuntimeException('Cannot remove code file'); }
}
function sync_code(string $src, string $dst): void {
    foreach (entries($src) as $name) {
        $s = $src . '/' . $name; $d = $dst . '/' . $name;
        if (is_dir($s)) {
            if (is_file($d)) { remove_code($d); }
            if (!is_dir($d) && !mkdir($d, 0755)) { throw new RuntimeException('Cannot create directory'); }
            sync_code($s, $d);
        } else {
            if (is_dir($d)) { remove_code($d); }
            $tmp = $d . '.deploy-tmp';
            if (is_link($tmp) || !copy($s, $tmp) || !chmod($tmp, 0644) || !rename($tmp, $d)) {
                throw new RuntimeException('Cannot publish code file');
            }
        }
    }
    foreach (entries($dst) as $name) { if (!file_exists($src . '/' . $name)) { remove_code($dst . '/' . $name); } }
}
validate_tree($source);
validate_tree($target);
sync_code($source, $target);
