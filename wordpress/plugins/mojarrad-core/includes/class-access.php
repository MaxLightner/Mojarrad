<?php
defined( 'ABSPATH' ) || exit;

/** Fail-closed project access; roles alone never assign a private project. */
final class Mojarrad_Access {
    public static function is_global_reader( int $user_id ): bool {
        if ( $user_id <= 0 ) { return false; }
        if ( user_can( $user_id, 'manage_moj_projects' ) ) { return true; }
        $user = get_userdata( $user_id );
        return $user && in_array( 'moj_executor', (array) $user->roles, true );
    }

    public static function assigned_ids( int $user_id ): array {
        if ( $user_id <= 0 ) { return array(); }
        global $wpdb;
        $table = $wpdb->prefix . 'moj_project_access';
        return array_map( 'intval', (array) $wpdb->get_col(
            $wpdb->prepare( "SELECT project_id FROM {$table} WHERE user_id = %d", $user_id )
        ) );
    }

    public static function can_read( int $user_id, int $project_id ): bool {
        if ( $user_id <= 0 || $project_id <= 0 || get_post_type( $project_id ) !== 'moj_project' ) { return false; }
        if ( self::is_global_reader( $user_id ) ) { return true; }
        global $wpdb;
        $table = $wpdb->prefix . 'moj_project_access';
        return (bool) $wpdb->get_var( $wpdb->prepare(
            "SELECT 1 FROM {$table} WHERE project_id = %d AND user_id = %d LIMIT 1",
            $project_id, $user_id
        ) );
    }
}
