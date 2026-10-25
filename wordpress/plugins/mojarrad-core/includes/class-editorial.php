<?php
defined('ABSPATH') || exit;

/**
 * Editorial draft inbox and safe audit of legacy blog content.
 *
 * WordPress is the source of truth after import: this code must never
 * overwrite a draft edited by a human reviewer.
 */
final class Mojarrad_Editorial {
    private const FIRST_DRAFT_OPTION = 'mojarrad_editorial_seed_001';

    public static function register(): void {
        add_action('init', array(__CLASS__, 'ensure_first_draft'), 35);
        add_action('add_meta_boxes_post', array(__CLASS__, 'register_post_box'));
        add_action('save_post_post', array(__CLASS__, 'save_post_box'), 20, 2);
        add_filter('views_edit-post', array(__CLASS__, 'legacy_view'));
        add_action('pre_get_posts', array(__CLASS__, 'filter_legacy_list'));
        add_action('admin_notices', array(__CLASS__, 'legacy_notice'));
    }

    /** Seed exactly one unpublished article; never publish or alter existing posts. */
    public static function ensure_first_draft(): void {
        if (get_option(self::FIRST_DRAFT_OPTION)) return;
        $slug = 'sakhtan-ya-sabr';
        $existing = get_page_by_path($slug, OBJECT, 'post');
        if ($existing instanceof WP_Post) {
            update_option(self::FIRST_DRAFT_OPTION, (int) $existing->ID, false);
            return;
        }
        $source = MOJARRAD_CORE_PATH . 'editorial/001-sakhtan-ya-sabr.html';
        if (!is_readable($source)) return;
        $html = file_get_contents($source);
        if (!is_string($html) || strlen($html) < 3000) return;
        $admins = get_users(array('role' => 'administrator', 'number' => 1, 'fields' => 'ID'));
        if (!$admins) return;

        $post_id = wp_insert_post(array(
            'post_type' => 'post',
            'post_status' => 'draft',
            'post_name' => $slug,
            'post_title' => 'ساختن یا صبر کردن؟ تصمیم دشوار آغاز پروژه ساختمانی در اقتصاد بی‌ثبات',
            'post_excerpt' => 'افزایش هزینه‌ها تنها مسئله سازنده نیست؛ زمان، نقدینگی و توان ادامه پروژه گاهی مهم‌تر از برآورد اولیه‌اند. آیا امروز باید ساخت یا صبر کرد؟',
            'post_content' => wp_kses_post($html),
            'post_author' => (int) $admins[0],
            'comment_status' => 'closed',
        ), true);
        if (is_wp_error($post_id) || !$post_id) return;

        update_post_meta($post_id, '_moj_seo_title', 'شروع پروژه ساختمانی در تورم ۱۴۰۵؛ ساختن یا صبر کردن؟ | نیکابنا');
        update_post_meta($post_id, '_moj_seo_description', 'در شرایط افزایش هزینه ساخت و ابهام بازار مسکن، شروع پروژه بهتر است یا تعویق آن؟ مسئله را از زاویه نقدینگی، ریسک توقف و تصمیم‌های کارگاهی بررسی می‌کنیم.');
        update_post_meta($post_id, '_moj_editorial_byline', 'تحریریه نیکابنا');
        update_post_meta($post_id, '_moj_editorial_cover', 'editorial-economy.svg');
        update_post_meta($post_id, '_moj_editorial_researched_at', '۱۴۰۵/۰۸/۰۳');
        if (!empty($_POST['moj_editorial_review_required'])) {
            update_post_meta($post_id, '_moj_editorial_managed', '1');
            update_post_meta($post_id, '_moj_editorial_review_required', '1');
        }
        update_post_meta($post_id, '_moj_editorial_featured', '1');
        update_post_meta($post_id, '_moj_editorial_source_id', 'nikabana-journal-001');
        update_post_meta($post_id, '_moj_editorial_review_required', '1');

        $term = term_exists('اقتصاد ساخت', 'category');
        if (!$term) $term = wp_insert_term('اقتصاد ساخت', 'category');
        if (!is_wp_error($term) && $term) {
            $term_id = is_array($term) ? (int) $term['term_id'] : (int) $term;
            wp_set_post_categories($post_id, array($term_id), false);
        }
        update_option(self::FIRST_DRAFT_OPTION, (int) $post_id, false);
    }

    public static function register_post_box(): void {
        add_meta_box('moj_editorial_meta', 'اطلاعات سردبیری و سئو نیکابنا',
            array(__CLASS__, 'render_post_box'), 'post', 'normal', 'high');
    }

    public static function render_post_box(WP_Post $post): void {
        if (!current_user_can('edit_post', $post->ID)) return;
        wp_nonce_field('moj_editorial_' . $post->ID, 'moj_editorial_nonce');
        $fields = array(
            '_moj_seo_title' => array('عنوان سئو', 'text', 90),
            '_moj_seo_description' => array('توضیح متا', 'textarea', 180),
            '_moj_editorial_byline' => array('نام نویسنده برای نمایش عمومی', 'text', 90),
            '_moj_editorial_researched_at' => array('تاریخ بررسی منابع', 'text', 24),
        );
        echo '<p>مقاله تأییدنشده را منتشر نکنید. تأیید نهایی در خود سایت توسط شخص مجاز انجام می‌شود.</p>';
        if (class_exists('Mojarrad_Editorial_Review') && Mojarrad_Editorial_Review::is_managed($post)) {
            $review_link = Mojarrad_Editorial_Review::review_url($post->ID);
            echo '<p><strong>لینک خصوصی برای ارسال به مهندس:</strong><br><input readonly type="text" class="widefat" dir="ltr" value="' . esc_attr($review_link) . '">';
            echo '<a target="_blank" rel="noopener noreferrer" href="' . esc_url($review_link) . '">باز کردن پیش‌نمایش در سایت</a></p>';
        }
        foreach ($fields as $key => $spec) {
            $value = (string) get_post_meta($post->ID, $key, true);
            echo '<p><label for="' . esc_attr($key) . '"><strong>' . esc_html($spec[0]) . '</strong></label><br>';
            if ($spec[1] === 'textarea') {
                echo '<textarea id="' . esc_attr($key) . '" name="' . esc_attr($key)
                    . '" class="widefat" rows="3" maxlength="' . esc_attr($spec[2]) . '">'
                    . esc_textarea($value) . '</textarea>';
            } else {
                echo '<input type="text" id="' . esc_attr($key) . '" name="' . esc_attr($key)
                    . '" class="widefat" maxlength="' . esc_attr($spec[2]) . '" dir="auto" value="'
                    . esc_attr($value) . '">';
            }
            echo '</p>';
        }
        echo '<p><label><input type="checkbox" name="moj_editorial_review_required" value="1" '
            . checked((string) get_post_meta($post->ID, '_moj_editorial_review_required', true), '1', false)
            . '> ارسال این مقاله به صف بررسی خصوصی مهندس</label></p>';
        echo '<p><label><input type="checkbox" name="moj_editorial_featured" value="1" '
            . checked((string) get_post_meta($post->ID, '_moj_editorial_featured', true), '1', false)
            . '> مطلب منتخب صفحه بلاگ (در صورت چند انتخاب، جدیدترین منتشرشده نمایش داده می‌شود)</label></p>';
    }

    public static function save_post_box(int $post_id, WP_Post $post): void {
        if ($post->post_type !== 'post' || wp_is_post_revision($post_id) ||
            (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) ||
            !current_user_can('edit_post', $post_id)) return;
        if (!isset($_POST['moj_editorial_nonce']) || !is_string($_POST['moj_editorial_nonce'])
            || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['moj_editorial_nonce'])), 'moj_editorial_' . $post_id)) return;

        foreach (array('_moj_seo_title' => 90, '_moj_seo_description' => 180,
                       '_moj_editorial_byline' => 90, '_moj_editorial_researched_at' => 24) as $key => $max) {
            if (!isset($_POST[$key]) || !is_string($_POST[$key])) continue;
            $value = sanitize_text_field(wp_unslash($_POST[$key]));
            $value = function_exists('mb_substr') ? mb_substr($value, 0, $max) : $value;
            if ($value === '') delete_post_meta($post_id, $key);
            else update_post_meta($post_id, $key, $value);
        }
        update_post_meta($post_id, '_moj_editorial_featured',
            !empty($_POST['moj_editorial_featured']) ? '1' : '0');
    }

    /** Read-only identification; moving samples to draft remains a deliberate editor action. */
    public static function legacy_view(array $views): array {
        if (!current_user_can('edit_others_posts')) return $views;
        $url = add_query_arg('moj_legacy_only', '1', admin_url('edit.php'));
        $views['moj_legacy_only'] = '<a href="' . esc_url($url) . '">ورودی‌های قدیمی نیکابنا (نیازمند بازبینی)</a>';
        return $views;
    }

    public static function filter_legacy_list(WP_Query $query): void {
        if (!is_admin() || !$query->is_main_query() || !current_user_can('edit_others_posts')) return;
        if (!isset($_GET['moj_legacy_only']) || !is_string($_GET['moj_legacy_only']) || sanitize_text_field(wp_unslash($_GET['moj_legacy_only'])) !== '1') return;
        $post_type = $query->get('post_type');
        if ($post_type && $post_type !== 'post') return;
        $query->set('meta_query', array(array('key' => '_mojarrad_legacy_import', 'compare' => 'EXISTS')));
    }

    public static function legacy_notice(): void {
        if (!current_user_can('edit_others_posts')) return;
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen || $screen->id !== 'edit-post' ||
            !isset($_GET['moj_legacy_only']) || !is_string($_GET['moj_legacy_only']) || sanitize_text_field(wp_unslash($_GET['moj_legacy_only'])) !== '1') return;
        echo '<div class="notice notice-warning"><p>این فهرست فقط مقالات واردشده از نسخه قبلی را نشان می‌دهد. پس از تأیید محتوا و بررسی بازدید/لینک‌های ورودی، موارد غیرقابل استفاده را با ویرایش دسته‌جمعی به «پیش‌نویس» منتقل کنید. حذف مستقیم یا تغییر پروژه‌ها و اخبار انجام نمی‌شود.</p></div>';
    }
}
