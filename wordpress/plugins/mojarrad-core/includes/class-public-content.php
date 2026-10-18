<?php
defined( 'ABSPATH' ) || exit;

/** WordPress-native editor fields, stored as sanitized post metadata. */
final class Mojarrad_Public_Content {
    public const PROJECT_FIELDS = array(
        'subtitle' => 'زیرعنوان',
        'location' => 'موقعیت',
        'area' => 'زیربنا',
        'year' => 'سال',
        'status' => 'توضیح وضعیت',
        'start_date' => 'تاریخ شروع',
        'end_date' => 'تاریخ پایان',
        'sale_price' => 'قیمت فروش',
        'sale_description' => 'توضیح فروش',
    );
    public static function project_box() {
        add_meta_box( 'moj_project_detail', 'جزئیات پروژه', array( __CLASS__, 'render_project' ), 'moj_project', 'normal', 'high' );
    }
    public static function official_box() {
        add_meta_box( 'moj_official_detail', 'اطلاعات مسئول', array( __CLASS__, 'render_official' ), 'moj_official', 'normal', 'high' );
    }
    private static function field( string $key, string $label, $value, string $type = 'text' ) {
        echo '<p><label for="' . esc_attr( $key ) . '"><strong>' . esc_html( $label ) . '</strong></label>';
        if ( 'textarea' === $type ) {
            echo '<textarea class="widefat" rows="3" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '">' . esc_textarea( $value ) . '</textarea></p>';
        } else {
            echo '<input class="widefat" type="' . esc_attr( $type ) . '" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '"></p>';
        }
    }
    public static function render_project( WP_Post $post ) {
        wp_nonce_field( 'mojarrad_project_fields', 'mojarrad_project_nonce' );
        foreach ( self::PROJECT_FIELDS as $key => $label ) {
            self::field(
                'moj_' . $key, $label, get_post_meta( $post->ID, 'moj_' . $key, true ),
                in_array( $key, array( 'sale_description' ), true ) ? 'textarea' : 'text'
            );
        }
        self::field( 'moj_progress', 'درصد پیشرفت (۰ تا ۱۰۰)', (int) get_post_meta( $post->ID, 'moj_progress', true ), 'number' );
        $checked = (bool) get_post_meta( $post->ID, 'moj_for_sale', true );
        echo '<p><label><input type="checkbox" name="moj_for_sale" value="1" ' . checked( $checked, true, false ) . '> این پروژه برای فروش است</label></p>';
        $ids = (string) get_post_meta( $post->ID, 'moj_gallery_ids', true );
        self::field( 'moj_gallery_ids', 'شناسه تصاویر گالری (انتخاب از کتابخانه رسانه)', $ids );
        echo '<button type="button" class="button" id="moj-gallery-select">انتخاب تصاویر گالری</button>';
        echo '<p class="description">تصویر اصلی را از بخش «تصویر شاخص» تنظیم کنید. تنها تصاویر عمومی پروژه را در رسانه وردپرس قرار دهید.</p>';
    }
    public static function render_official( WP_Post $post ) {
        wp_nonce_field( 'mojarrad_official_fields', 'mojarrad_official_nonce' );
        self::field( 'moj_official_role', 'سمت', get_post_meta( $post->ID, 'moj_official_role', true ) );
        $group = get_post_meta( $post->ID, 'moj_official_group', true );
        echo '<p><label for="moj_official_group">گروه</label><select id="moj_official_group" name="moj_official_group" class="widefat">';
        foreach ( array( 'company' => 'مدیران گروه', 'municipal' => 'نهادهای شهری', 'provincial' => 'نهادهای استانی' ) as $key => $label ) {
            echo '<option value="' . esc_attr( $key ) . '" ' . selected( $group, $key, false ) . '>' . esc_html( $label ) . '</option>';
        }
        echo '</select></p>';
    }
    public static function save_project( int $post_id ) {
        if ( ! isset( $_POST['mojarrad_project_nonce'] ) ||
            ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['mojarrad_project_nonce'] ) ), 'mojarrad_project_fields' ) ||
            ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ||
            wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id )
        ) { return; }
        foreach ( self::PROJECT_FIELDS as $key => $label ) {
            $field = 'moj_' . $key;
            $value = isset( $_POST[$field] ) && is_string( $_POST[$field] ) ? wp_unslash( $_POST[$field] ) : '';
            update_post_meta( $post_id, $field, 'sale_description' === $key ? sanitize_textarea_field( $value ) : sanitize_text_field( $value ) );
        }
        $progress = isset( $_POST['moj_progress'] ) ? absint( $_POST['moj_progress'] ) : 0;
        update_post_meta( $post_id, 'moj_progress', min( 100, $progress ) );
        update_post_meta( $post_id, 'moj_for_sale', isset( $_POST['moj_for_sale'] ) ? '1' : '0' );
        $raw = isset( $_POST['moj_gallery_ids'] ) && is_string( $_POST['moj_gallery_ids'] ) ? wp_unslash( $_POST['moj_gallery_ids'] ) : '';
        $ids = array_filter( array_map( 'absint', explode( ',', $raw ) ) );
        $ids = array_values( array_unique( array_filter( $ids, function( $id ) { return wp_attachment_is_image( $id ); } ) ) );
        update_post_meta( $post_id, 'moj_gallery_ids', implode( ',', $ids ) );
    }
    public static function save_official( int $post_id ) {
        if ( ! isset( $_POST['mojarrad_official_nonce'] ) ||
            ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['mojarrad_official_nonce'] ) ), 'mojarrad_official_fields' ) ||
            ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) ||
            wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id )
        ) { return; }
        $role = isset( $_POST['moj_official_role'] ) && is_string( $_POST['moj_official_role'] ) ? sanitize_text_field( wp_unslash( $_POST['moj_official_role'] ) ) : '';
        $group = isset( $_POST['moj_official_group'] ) && is_string( $_POST['moj_official_group'] ) ? sanitize_key( wp_unslash( $_POST['moj_official_group'] ) ) : 'company';
        update_post_meta( $post_id, 'moj_official_role', $role );
        update_post_meta( $post_id, 'moj_official_group', in_array( $group, array( 'company', 'municipal', 'provincial' ), true ) ? $group : 'company' );
    }
    public static function enqueue_admin( string $hook ) {
        if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) { return; }
        $screen = get_current_screen();
        if ( ! $screen || 'moj_project' !== $screen->post_type ) { return; }
        wp_enqueue_media();
        wp_enqueue_script(
            'mojarrad-admin-gallery',
            plugins_url( '../assets/admin-gallery.js', __FILE__ ),
            array( 'jquery' ), MOJARRAD_CORE_VERSION, true
        );
    }
}
