<?php
defined( 'ABSPATH' ) || exit;

/** Versioned, additive foundation. Activation never truncates data. */
final class Mojarrad_Schema {
    public const VERSION = '1';

    public static function install() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $collate = $wpdb->get_charset_collate();
        $access = $wpdb->prefix . 'moj_project_access';
        $events = $wpdb->prefix . 'moj_timeline_event';
        $sql_access = "CREATE TABLE {$access} (
            project_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (project_id,user_id),
            KEY user_id (user_id)
        ) {$collate};";
        $sql_events = "CREATE TABLE {$events} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            actor_id bigint(20) unsigned DEFAULT NULL,
            occurred_at datetime NOT NULL,
            category varchar(32) NOT NULL,
            kind varchar(32) NOT NULL DEFAULT 'point',
            stage_key varchar(64) DEFAULT NULL,
            is_report tinyint(1) NOT NULL DEFAULT 0,
            title text NOT NULL,
            description longtext NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY project_time (project_id,occurred_at),
            KEY category (category)
        ) {$collate};";
        dbDelta( $sql_access );
        dbDelta( $sql_events );
        update_option( 'mojarrad_schema_version', self::VERSION, false );
    }
}
