<?php
/** Idempotent, curated public portfolio migration. Does not touch unrelated posts. */
defined('ABSPATH') || exit;

final class Mojarrad_Portfolio {
    public const VERSION = '2026-11-01.2';

    public static function sync_once(): void {
        if (get_option('moj_portfolio_sync_version') === self::VERSION || !post_type_exists('moj_project')) {
            return;
        }
        $file = MOJARRAD_CORE_PATH . 'data/portfolio-projects.json';
        if (!is_readable($file)) { return; }
        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data) || ($data['version'] ?? '') !== self::VERSION ||
            !isset($data['projects']) || !is_array($data['projects']) || count($data['projects']) !== 15) {
            return; // Never delete demo data unless the new inventory is available.
        }
        $ok = true;
        foreach ($data['projects'] as $project) {
            if (!self::upsert($project)) { $ok = false; }
        }
        if (!$ok) { return; }
        // Delete only clearly identified old showcase fixtures, not user-created projects.
        self::remove_legacy_demo_projects();
        update_option('moj_portfolio_sync_version', self::VERSION, false);
    }

    private static function upsert(array $project): bool {
        $external_id = sanitize_text_field((string)($project['external_id'] ?? ''));
        $slug = sanitize_title((string)($project['slug'] ?? ''));
        $title = sanitize_text_field((string)($project['title'] ?? ''));
        if (!preg_match('/^nb-\d{4}$/', $external_id) || !$slug || !$title) { return false; }
        $existing = get_posts(array(
            'post_type'=>'moj_project','post_status'=>'any','numberposts'=>1,
            'meta_key'=>'_moj_portfolio_external_id','meta_value'=>$external_id,
            'fields'=>'ids','suppress_filters'=>true,
        ));
        $id = $existing ? (int)$existing[0] : 0;
        if (!$id) {
            $collision = get_page_by_path($slug, OBJECT, 'moj_project');
            if ($collision) { return false; } // Avoid overwriting an unrelated existing post.
            $inserted = wp_insert_post(array(
                'post_type'=>'moj_project','post_status'=>'publish',
                'post_title'=>$title,'post_name'=>$slug,
                'post_excerpt'=>'','post_content'=>'',
            ),true);
            if (is_wp_error($inserted) || !$inserted) { return false; }
            $id = (int) $inserted;
        } else {
            $post = get_post($id);
            if (!$post || $post->post_type !== 'moj_project') { return false; }
            if ($post->post_title !== $title || $post->post_status !== 'publish' || $post->post_name !== $slug) {
                wp_update_post(array('ID'=>$id,'post_title'=>$title,'post_name'=>$slug,'post_status'=>'publish'));
            }
        }
        update_post_meta($id, '_moj_portfolio_external_id', $external_id);
        update_post_meta($id, '_moj_portfolio_managed', '1');
        $fields = array(
            'location' => 'location',
            'kind' => 'kind',
            'land_area' => 'land_area_m2',
            'floors_above_ground' => 'floors_above_ground',
            'roof_count' => 'roof_count',
            'units' => 'unit_count',
            'unit_area' => 'unit_area_m2',
        );
        foreach ($fields as $meta => $input) {
            $value = $project[$input] ?? null;
            if ($value === null || $value === '') { continue; }
            update_post_meta($id, 'moj_'.$meta, sanitize_text_field((string)$value));
        }
        foreach (array('designer','supervisor') as $role) {
            $value = $project['credits'][$role] ?? '';
            if (is_string($value) && $value !== '') {
                update_post_meta($id, 'moj_'.$role, sanitize_text_field($value));
            }
        }
        // Only specifically approved, checked images may appear on the public site.
        // The staging archive also contains AI-reconstructed photos awaiting review.
        $cover = (string)($project['cover'] ?? '');
        if ($cover && preg_match('#^projects/nb-\d{4}/[\w-]+\.avif$#', $cover)) {
            update_post_meta($id, 'moj_portfolio_cover', $cover);
        }
        if (isset($project['gallery']) && is_array($project['gallery'])) {
            $gallery = array_values(array_filter($project['gallery'], static function($path) {
                return is_string($path) && preg_match('#^projects/nb-\d{4}/[\w-]+\.avif$#', $path);
            }));
            update_post_meta($id, 'moj_portfolio_gallery', wp_json_encode($gallery));
        }
        return true;
    }

    private static function remove_legacy_demo_projects(): void {
        $old_slugs = array('anvari-8','namjou-6','koohsangi-5','zeshk-villa-12',
            'zeshk-villa-14','kahou-villa','torghabe-anjiri-1','dahm-sharie-villa');
        $posts = get_posts(array(
            'post_type'=>'moj_project','post_status'=>array('publish','draft','pending','private','future','trash'),
            'numberposts'=>-1,'suppress_filters'=>true,
        ));
        foreach ($posts as $post) {
            $id = (int)$post->ID;
            if (get_post_meta($id, '_moj_portfolio_managed', true)) { continue; }
            $marked = get_post_meta($id, '_mojarrad_legacy_import', true);
            $demo_cover = get_post_meta($id, 'moj_demo_cover', true);
            $demo_gallery = get_post_meta($id, 'moj_demo_gallery', true);
            if ($marked || $demo_cover || $demo_gallery || in_array($post->post_name, $old_slugs, true)) {
                wp_delete_post($id, true);
            }
        }
    }

    public static function archive_query(WP_Query $q): void {
        if (is_admin() || !$q->is_main_query() || !$q->is_post_type_archive('moj_project')) { return; }
        $q->set('posts_per_page', -1);
        $q->set('post_status', 'publish');
        $q->set('meta_key', '_moj_portfolio_external_id');
        $q->set('orderby', 'meta_value');
        $q->set('order', 'ASC');
    }
}