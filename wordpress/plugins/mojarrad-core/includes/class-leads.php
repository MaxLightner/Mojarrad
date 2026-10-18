<?php
defined( 'ABSPATH' ) || exit;

/**
 * Public lead capture with nonce, honeypot, simple IP throttling and private data.
 * No direct public read API is registered.
 */
final class Mojarrad_Leads {
    public static function handle() {
        if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
            wp_die( esc_html__( 'درخواست نامعتبر', 'mojarrad-core' ), '', array( 'response' => 405 ) );
        }
        $type = isset( $_POST['moj_type'] ) && is_string( $_POST['moj_type'] ) ? sanitize_key( wp_unslash( $_POST['moj_type'] ) ) : '';
        $targets = array(
            'consulting' => '/consulting/',
            'supplier' => '/collaborate/',
            'contractor' => '/collaborate/',
            'sale' => '/sale/',
        );
        if ( ! isset( $targets[$type] ) ) { wp_die( 'Invalid lead type', '', array( 'response' => 400 ) ); }
        $target = home_url( $targets[$type] );

        $nonce = isset( $_POST['moj_nonce'] ) && is_string( $_POST['moj_nonce'] )
            ? sanitize_text_field( wp_unslash( $_POST['moj_nonce'] ) ) : '';
        if ( ! wp_verify_nonce( $nonce, 'mojarrad_lead_' . $type ) ) {
            wp_die( esc_html__( 'اعتبار فرم پایان یافته است. صفحه را تازه کنید.', 'mojarrad-core' ), '', array( 'response' => 403 ) );
        }
        if ( ! empty( $_POST['moj_site_url'] ) ) { self::redirect( $target, 'ok' ); }

        $ip = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
        $rate_key = 'mojlead_' . substr( hash_hmac( 'sha256', $ip, wp_salt( 'nonce' ) ), 0, 32 );
        $attempts = (int) get_transient( $rate_key );
        if ( $attempts >= 5 ) { self::redirect( $target, 'limit' ); }
        set_transient( $rate_key, $attempts + 1, HOUR_IN_SECONDS );

        $name = isset( $_POST['moj_name'] ) && is_string( $_POST['moj_name'] ) ? sanitize_text_field( wp_unslash( $_POST['moj_name'] ) ) : '';
        $phone = isset( $_POST['moj_phone'] ) && is_string( $_POST['moj_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['moj_phone'] ) ) : '';
        $company = isset( $_POST['moj_company'] ) && is_string( $_POST['moj_company'] ) ? sanitize_text_field( wp_unslash( $_POST['moj_company'] ) ) : '';
        $field = isset( $_POST['moj_field'] ) && is_string( $_POST['moj_field'] ) ? sanitize_text_field( wp_unslash( $_POST['moj_field'] ) ) : '';
        $message = isset( $_POST['moj_message'] ) && is_string( $_POST['moj_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['moj_message'] ) ) : '';
        if ( '' === trim( $name ) || strlen( $name ) > 240 || ! preg_match( '/^[0-9۰-۹٠-٩+\s()-]{8,20}$/u', $phone ) ||
             strlen( $message ) > 6000 || strlen( $company ) > 240 || strlen( $field ) > 300 ||
             ( in_array( $type, array( 'supplier', 'contractor' ), true ) && ! trim( $field ) )
        ) { self::redirect( $target, 'invalid' ); }

        $post_id = wp_insert_post( array(
            'post_type' => 'moj_lead', 'post_status' => 'private',
            'post_title' => $name . ' — ' . $type,
        ), true );
        if ( is_wp_error( $post_id ) || ! $post_id ) { self::redirect( $target, 'error' ); }

        foreach ( array(
            'moj_lead_type' => $type, 'moj_lead_name' => $name, 'moj_lead_phone' => $phone,
            'moj_lead_company' => $company, 'moj_lead_field' => $field, 'moj_lead_message' => $message,
        ) as $key => $value ) {
            update_post_meta( $post_id, $key, $value );
        }
        self::redirect( $target, 'ok' );
    }

    public static function details_box() {
        add_meta_box( 'moj_lead_details', 'جزئیات درخواست خصوصی', function ( WP_Post $post ) {
            foreach ( array(
                'moj_lead_type' => 'نوع', 'moj_lead_name' => 'نام',
                'moj_lead_phone' => 'شماره تماس', 'moj_lead_company' => 'شرکت',
                'moj_lead_field' => 'حوزه فعالیت', 'moj_lead_message' => 'پیام',
            ) as $key => $label ) {
                echo '<p><strong>' . esc_html( $label ) . ':</strong> ' .
                    nl2br( esc_html( (string) get_post_meta( $post->ID, $key, true ) ) ) . '</p>';
            }
        }, 'moj_lead', 'normal', 'high' );
    }

    private static function redirect( string $target, string $status ) {
        wp_safe_redirect( add_query_arg( 'lead_status', $status, $target ), 303 );
        exit;
    }
}
