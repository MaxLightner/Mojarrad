<?php
defined('ABSPATH') || exit;

/**
 * NIKABANA accounts are provisioned by a WordPress administrator only.
 * QR links carry project navigation, never passwords or authentication tokens.
 */
final class Mojarrad_User_Admin {
    public static function register(): void {
        // Keep the public registration screen closed even if the WP setting is changed.
        add_filter('pre_option_users_can_register', '__return_zero');
        add_action('edit_user_profile', array(__CLASS__, 'username_field'));
        add_action('edit_user_profile_update', array(__CLASS__, 'save_username'));
        add_action('admin_notices', array(__CLASS__, 'notice'));
        add_filter('login_redirect', array(__CLASS__, 'login_redirect'), 20, 3);
    }

    public static function username_field(WP_User $user): void {
        if (!current_user_can('manage_options') || !current_user_can('edit_user', $user->ID)) return;
        // Renaming one's active administrative login is unnecessarily risky.
        if ((int) $user->ID === get_current_user_id()) return;
        ?>
        <h2>حساب نیکابنا</h2>
        <table class="form-table" role="presentation">
            <tr>
                <th><label for="moj_new_username">نام کاربری ورود</label></th>
                <td>
                    <input type="text" id="moj_new_username" name="moj_new_username"
                           class="regular-text" dir="ltr" autocomplete="off"
                           value="<?php echo esc_attr($user->user_login); ?>" />
                    <?php wp_nonce_field('moj_username_' . $user->ID, 'moj_username_nonce'); ?>
                    <p class="description">برای تغییر نام کاربری، مقدار جدید را ذخیره کنید. ۳ تا ۳۲ کاراکتر لاتین، عدد، نقطه، خط تیره یا زیرخط؛ شروع با حرف. با تغییر، نشست‌های قبلی این کاربر بسته می‌شوند. رمز عبور را از بخش «مدیریت حساب» همین صفحه تعیین کنید.</p>
                </td>
            </tr>
        </table>
        <?php
    }

    public static function save_username(int $user_id): void {
        if (!current_user_can('manage_options') || !current_user_can('edit_user', $user_id)
            || get_current_user_id() === $user_id) return;
        if (!isset($_POST['moj_username_nonce'], $_POST['moj_new_username'])
            || !is_string($_POST['moj_username_nonce'])
            || !is_string($_POST['moj_new_username'])
            || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['moj_username_nonce'])), 'moj_username_' . $user_id)) return;

        $user = get_userdata($user_id);
        if (!$user) return;
        $raw = trim(wp_unslash($_POST['moj_new_username']));
        if ($raw === $user->user_login) return;
        $new = strtolower($raw);
        if (!preg_match('/^[a-z][a-z0-9._-]{2,31}$/D', $new)) {
            self::set_notice('نام کاربری نامعتبر است؛ از حروف انگلیسی و قالب مشخص‌شده استفاده کنید.', 'error');
            return;
        }
        $existing = username_exists($new);
        if ($existing && (int) $existing !== $user_id) {
            self::set_notice('این نام کاربری قبلاً استفاده شده است.', 'error');
            return;
        }
        global $wpdb;
        $changed = $wpdb->update($wpdb->users, array('user_login' => $new), array('ID' => $user_id), array('%s'), array('%d'));
        if ($changed !== 1) {
            self::set_notice('ذخیره نام کاربری انجام نشد؛ دوباره بررسی کنید.', 'error');
            return;
        }
        clean_user_cache($user_id);
        if (class_exists('WP_Session_Tokens')) {
            WP_Session_Tokens::get_instance($user_id)->destroy_all();
        }
        update_user_meta($user_id, '_moj_username_changed_at', current_time('mysql', true));
        update_user_meta($user_id, '_moj_username_changed_by', get_current_user_id());
        self::set_notice('نام کاربری تغییر کرد؛ کاربر باید دوباره با نام جدید و رمز عبور خود وارد شود.', 'success');
    }

    private static function set_notice(string $message, string $type): void {
        set_transient('moj_user_notice_' . get_current_user_id(), array('message' => $message, 'type' => $type), 60);
    }

    public static function notice(): void {
        if (!current_user_can('manage_options')) return;
        $key = 'moj_user_notice_' . get_current_user_id();
        $notice = get_transient($key);
        if ($notice) {
            delete_transient($key);
            echo '<div class="notice notice-' . esc_attr($notice['type']) . ' is-dismissible"><p>' . esc_html($notice['message']) . '</p></div>';
        }
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if ($screen && $screen->id === 'users') {
            echo '<div class="notice notice-info"><p>حساب‌های نیکابنا فقط توسط مدیر از «کاربران ← افزودن» ساخته می‌شوند. نقش را در زمان ایجاد تعیین کنید؛ تغییر نام کاربری در صفحه ویرایش همان کاربر امکان‌پذیر است. ثبت‌نام عمومی غیرفعال است.</p></div>';
        }
    }

    /** Only a valid member may be redirected to a project after logging in. */
    public static function login_redirect(string $redirect, string $requested, $user): string {
        if (!$user instanceof WP_User || user_can($user, 'manage_moj_projects')) return $redirect;
        $dashboard = home_url('/dashboard/');
        $requested = wp_validate_redirect($requested, '');
        if (!$requested) return $dashboard;
        $path = wp_parse_url($requested, PHP_URL_PATH);
        $timeline_path = wp_parse_url(home_url('/timeline/'), PHP_URL_PATH);
        if (untrailingslashit((string) $path) !== untrailingslashit((string) $timeline_path)) return $dashboard;
        parse_str((string) wp_parse_url($requested, PHP_URL_QUERY), $query);
        $project_id = isset($query['project']) && is_scalar($query['project']) ? absint($query['project']) : 0;
        if ($project_id && Mojarrad_Access::can_read((int) $user->ID, $project_id)) {
            return add_query_arg('project', $project_id, home_url('/timeline/'));
        }
        return $dashboard;
    }
}
