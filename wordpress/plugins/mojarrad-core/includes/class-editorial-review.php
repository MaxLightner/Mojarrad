<?php
defined('ABSPATH') || exit;

/**
 * Password-authenticated, frontend-only approval for Nika Bana journal.
 * A review URL is navigation, not a bearer token. Only explicitly authorized
 * WordPress accounts can see drafts or change their publication status.
 */
final class Mojarrad_Editorial_Review {
    public const CAPABILITY = 'moj_approve_editorial';
    private static bool $deciding = false;

    public static function register(): void {
        add_action('edit_user_profile', array(__CLASS__, 'profile_field'));
        add_action('edit_user_profile_update', array(__CLASS__, 'save_profile_field'));
        add_action('admin_post_moj_editorial_decision', array(__CLASS__, 'handle_decision'));
        add_action('save_post_post', array(__CLASS__, 'invalidate_changed_approval'), 40, 3);
    }

    public static function can_approve(int $user_id = 0): bool {
        $user_id = $user_id ?: get_current_user_id();
        return $user_id > 0 && (user_can($user_id, 'manage_options') || user_can($user_id, self::CAPABILITY));
    }

    public static function is_managed($post): bool {
        $post = get_post($post);
        return $post instanceof WP_Post && $post->post_type === 'post'
            && ((string) get_post_meta($post->ID, '_moj_editorial_source_id', true) !== ''
                || (string) get_post_meta($post->ID, '_moj_editorial_managed', true) === '1'
                || (string) get_post_meta($post->ID, '_moj_editorial_review_required', true) === '1');
    }

    public static function review_url(int $post_id = 0): string {
        $base = home_url('/editorial/');
        return $post_id ? add_query_arg('article', $post_id, $base) : $base;
    }

    public static function requested_review_id(): int {
        return isset($_GET['article']) && is_scalar($_GET['article']) ? absint($_GET['article']) : 0;
    }

    public static function validated_login_redirect(string $requested, WP_User $user): string {
        if (!self::can_approve((int) $user->ID)) return '';
        $requested = wp_validate_redirect($requested, '');
        if (!$requested) return '';
        if (untrailingslashit((string) wp_parse_url($requested, PHP_URL_PATH))
            !== untrailingslashit((string) wp_parse_url(self::review_url(), PHP_URL_PATH))) return '';
        parse_str((string) wp_parse_url($requested, PHP_URL_QUERY), $params);
        $id = isset($params['article']) && is_scalar($params['article']) ? absint($params['article']) : 0;
        if ($id && !self::is_managed($id)) return '';
        return self::review_url($id);
    }

    public static function profile_field(WP_User $user): void {
        if (!current_user_can('manage_options') || !current_user_can('edit_user', $user->ID)) return;
        wp_nonce_field('moj_editorial_reviewer_' . $user->ID, 'moj_editorial_reviewer_nonce');
        echo '<h2>تأیید مقالات نیکابنا</h2><table class="form-table" role="presentation"><tr><th scope="row">مجوز انتشار</th><td><label>';
        echo '<input type="checkbox" name="moj_editorial_reviewer" value="1" ' . checked(user_can($user,'manage_options') || $user->has_cap(self::CAPABILITY), true, false) . '>';
        echo ' این شخص می‌تواند مقالات را در خود سایت بررسی و زمان‌بندی یا منتشر کند.</label>';
        echo '<p class="description">صرف نقش مهندس یا ناظر این مجوز را نمی‌دهد. فقط مدیر سیستم آن را برای حساب موردنظر فعال می‌کند.</p>';
        echo '</td></tr></table>';
    }

    public static function save_profile_field(int $user_id): void {
        if (!current_user_can('manage_options') || !current_user_can('edit_user', $user_id)) return;
        if (!isset($_POST['moj_editorial_reviewer_nonce']) || !is_string($_POST['moj_editorial_reviewer_nonce']) ||
            !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['moj_editorial_reviewer_nonce'])), 'moj_editorial_reviewer_' . $user_id)) return;
        $user = get_userdata($user_id);
        if (!$user || user_can($user, 'manage_options')) return;
        if (isset($_POST['moj_editorial_reviewer']) && $_POST['moj_editorial_reviewer'] === '1') $user->add_cap(self::CAPABILITY);
        else $user->remove_cap(self::CAPABILITY);
    }

    public static function reviewed_hash(WP_Post $post): string {
        return hash('sha256', $post->post_title . "\n" . $post->post_excerpt . "\n" . $post->post_content);
    }

    /** Changes to an approved, queued draft cancel its schedule and return it for review. */
    public static function invalidate_changed_approval(int $post_id, WP_Post $post, bool $update): void {
        if (!$update || self::$deciding || $post->post_status !== 'future' || !self::is_managed($post)) return;
        $approved_hash = (string) get_post_meta($post_id, '_moj_editorial_approved_hash', true);
        if (!$approved_hash || hash_equals($approved_hash, self::reviewed_hash($post))) return;
        self::$deciding = true;
        delete_post_meta($post_id, '_moj_editorial_approved_hash');
        update_post_meta($post_id, '_moj_editorial_review_required', '1');
        wp_update_post(array('ID' => $post_id, 'post_status' => 'pending'));
        self::$deciding = false;
    }

    public static function next_slot(): string {
        $tz = new DateTimeZone('Asia/Tehran');
        $now = new DateTimeImmutable('now', $tz);
        $days = (4 - (int) $now->format('N') + 7) % 7;
        $slot = $now->modify('+' . $days . ' days')->setTime(10, 0);
        if ($slot->getTimestamp() < time() + 3600) $slot = $slot->modify('+7 days');
        return $slot->format('Y-m-d\\TH:i');
    }

    private static function redirect_result(int $id, string $result): void {
        wp_safe_redirect(add_query_arg('result', sanitize_key($result), self::review_url($id)), 303);
        exit;
    }

    public static function handle_decision(): void {
        if (!is_user_logged_in()) auth_redirect();
        if (!self::can_approve()) wp_die('مجوز تأیید مقالات ندارید.', 'دسترسی غیرمجاز', array('response'=>403));
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') wp_die('روش درخواست نامعتبر است.', '', array('response'=>405));
        $id = isset($_POST['article']) && is_scalar($_POST['article']) ? absint($_POST['article']) : 0;
        $post = get_post($id);
        if (!$post || !self::is_managed($post) || !in_array($post->post_status, array('draft','pending','future'), true)) {
            wp_die('این مقاله در وضعیت قابل بررسی نیست.', 'درخواست نامعتبر', array('response'=>400));
        }
        check_admin_referer('moj_editorial_decision_' . $id, 'moj_editorial_nonce');
        $review_hash = isset($_POST['review_hash']) && is_string($_POST['review_hash'])
            ? sanitize_text_field(wp_unslash($_POST['review_hash'])) : '';
        if (!$review_hash || !hash_equals(self::reviewed_hash($post), $review_hash)) {
            self::redirect_result($id, 'stale');
        }
        $decision = isset($_POST['decision']) && is_string($_POST['decision'])
            ? sanitize_key(wp_unslash($_POST['decision'])) : '';
        if (!in_array($decision, array('schedule','publish','changes'), true)) self::redirect_result($id,'invalid');

        if ($decision === 'changes') {
            $note = isset($_POST['review_note']) && is_string($_POST['review_note'])
                ? sanitize_textarea_field(wp_unslash($_POST['review_note'])) : '';
            if (strlen(trim($note)) < 5) self::redirect_result($id,'note_required');
            self::$deciding = true;
            $updated = wp_update_post(array('ID' => $id, 'post_status' => 'draft'), true);
            self::$deciding = false;
            if (is_wp_error($updated)) self::redirect_result($id,'error');
            update_post_meta($id, '_moj_editorial_review_note', $note);
            update_post_meta($id, '_moj_editorial_review_required', '1');
            delete_post_meta($id, '_moj_editorial_approved_hash');
            self::append_log($id, 'changes', '');
            self::redirect_result($id,'returned');
        }

        $status = 'publish';
        $wp_local = current_time('mysql');
        $utc = current_time('mysql', true);
        $slot_label = '';
        if ($decision === 'schedule') {
            $raw = isset($_POST['publish_at']) && is_string($_POST['publish_at']) ? wp_unslash($_POST['publish_at']) : '';
            $tz = new DateTimeZone('Asia/Tehran');
            $slot = DateTimeImmutable::createFromFormat('!Y-m-d\\TH:i', $raw, $tz);
            if (!$slot || $slot->format('Y-m-d\\TH:i') !== $raw || $slot->getTimestamp() < time() + 300) {
                self::redirect_result($id,'bad_date');
            }
            $status = 'future';
            $slot_label = $slot->format('Y-m-d H:i');
            $wp_local = $slot->setTimezone(wp_timezone())->format('Y-m-d H:i:s');
            $utc = $slot->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
        }
        self::$deciding = true;
        $updated = wp_update_post(array('ID' => $id, 'post_status' => $status, 'post_date' => $wp_local,
            'post_date_gmt' => $utc, 'edit_date' => true), true);
        self::$deciding = false;
        if (is_wp_error($updated) || !$updated) self::redirect_result($id,'error');
        $saved = get_post($id);
        if (!$saved || $saved->post_status !== $status) {
            // Fail closed if a host/plugin unexpectedly changes a scheduled post to public.
            if ($status === 'future' && $saved && $saved->post_status === 'publish') {
                self::$deciding = true;
                wp_update_post(array('ID' => $id, 'post_status' => 'draft', 'edit_date' => true), true);
                self::$deciding = false;
            }
            self::redirect_result($id,'error');
        }
        update_post_meta($id, '_moj_editorial_managed', '1');
        update_post_meta($id, '_moj_editorial_review_required', '0');
        update_post_meta($id, '_moj_editorial_approved_hash', self::reviewed_hash($saved));
        update_post_meta($id, '_moj_editorial_approved_by', get_current_user_id());
        update_post_meta($id, '_moj_editorial_approved_at', current_time('mysql', true));
        delete_post_meta($id, '_moj_editorial_review_note');
        self::append_log($id, $decision, $slot_label);
        self::redirect_result($id,$status === 'future' ? 'scheduled' : 'published');
    }

    private static function append_log(int $id, string $action, string $schedule): void {
        $log = get_post_meta($id,'_moj_editorial_approval_log',true);
        if (!is_array($log)) $log = array();
        $log[] = array('action'=>$action, 'user'=>get_current_user_id(), 'at'=>current_time('mysql',true), 'slot_tehran'=>$schedule);
        update_post_meta($id,'_moj_editorial_approval_log',array_slice($log,-40));
    }
}
