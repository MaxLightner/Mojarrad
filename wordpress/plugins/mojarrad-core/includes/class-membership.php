<?php
defined('ABSPATH') || exit;

/** Admin-only management of explicit client access to public project records. */
final class Mojarrad_Membership {
    public static function register_box() {
        add_meta_box(
            'moj_project_members',
            'دسترسی اعضای پروژه',
            array(__CLASS__,'render_box'),
            'moj_project','side','default'
        );
    }
    public static function render_box(WP_Post $project) {
        if(!current_user_can('manage_moj_projects')) {
            echo '<p>برای تعیین اعضای پروژه دسترسی ندارید.</p>';
            return;
        }
        wp_nonce_field('moj_members_'.$project->ID,'moj_members_nonce');
        $allowed=array('moj_owner','moj_supervisor','moj_engineer','moj_foreman','moj_contractor');
        $users=get_users(array('role__in'=>$allowed,'orderby'=>'display_name','order'=>'ASC','number'=>250));
        $assigned=Mojarrad_Access::assigned_users($project->ID);
        echo '<p>فقط کاربرانی که اینجا انتخاب شوند می‌توانند پروژه را در «پنل من» ببینند. مدیر و مجری به همه پروژه‌ها دسترسی دارند.</p>';
        if(!$users) echo '<p>ابتدا از بخش کاربران، یک مالک، ناظر یا همکار ایجاد کنید.</p>';
        $login_link=add_query_arg('project',$project->ID,home_url('/login/'));
        echo '<p><strong>لینک ورود پروژه برای QR</strong><input class="widefat" type="text" dir="ltr" readonly value="'.esc_attr($login_link).'" onclick="this.select()"></p>';
        echo '<p class="description">این آدرس را می‌توان داخل QR قرار داد. اسکن فقط صفحه ورود را باز می‌کند؛ نام کاربری و رمز لازم است و دسترسی پروژه در سرور کنترل می‌شود. رمز عبور یا کلید ورود را در QR قرار ندهید.</p>';
        foreach($users as $user) {
            $role=Mojarrad_Access::role_for($user);
            echo '<label style="display:block;padding:5px 0"><input type="checkbox" name="moj_assigned_users[]" value="' . esc_attr((string)$user->ID) . '" ' .
              checked(in_array((int)$user->ID,$assigned,true),true,false) . '> ' .
              esc_html($user->display_name) . ' <small>(' . esc_html(Mojarrad_Access::role_label($role)) . ')</small></label>';
        }
        echo '<p class="description">ذخیره پروژه، تغییرات عضویت را اعمال می‌کند. نقش‌های کاربران از قسمت «کاربران» مدیریت می‌شود.</p>';
    }
    public static function save_project_members(int $post_id) {
        if(!current_user_can('manage_moj_projects') || !current_user_can('edit_post',$post_id)) return;
        if(!isset($_POST['moj_members_nonce']) || !is_string($_POST['moj_members_nonce']) ||
           !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['moj_members_nonce'])),'moj_members_'.$post_id)) return;
        if((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id)) return;

        $raw=isset($_POST['moj_assigned_users']) && is_array($_POST['moj_assigned_users']) ?
            wp_unslash($_POST['moj_assigned_users']) : array();
        $allowed=array('moj_owner','moj_supervisor','moj_engineer','moj_foreman','moj_contractor');
        $target=array();
        foreach($raw as $item) {
            $id=absint($item);
            $user=get_userdata($id);
            if($id && $user && in_array(Mojarrad_Access::role_for($user),$allowed,true)) $target[$id]=$id;
        }
        Mojarrad_Access::set_project_users($post_id,array_values($target));
    }
}
