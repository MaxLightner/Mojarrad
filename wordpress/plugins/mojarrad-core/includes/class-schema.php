<?php
defined('ABSPATH') || exit;

/** Additive schema upgrades: no truncation or DROP when plugin is upgraded. */
final class Mojarrad_Schema {
    public const VERSION = '3';

    public static function install() {
        global $wpdb;
        require_once ABSPATH.'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        $access = $wpdb->prefix.'moj_project_access';
        $events = $wpdb->prefix.'moj_timeline_event';
        $comments = $wpdb->prefix.'moj_timeline_comment';
        $media = $wpdb->prefix.'moj_timeline_media';
        dbDelta("CREATE TABLE {$access} (
            project_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (project_id,user_id),
            KEY user_id (user_id)
        ) {$charset};");
        dbDelta("CREATE TABLE {$events} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            actor_id bigint(20) unsigned DEFAULT NULL,
            occurred_at datetime NOT NULL,
            category varchar(32) NOT NULL,
            kind varchar(32) NOT NULL DEFAULT 'point',
            stage_key varchar(64) DEFAULT NULL,
            stage_group varchar(32) DEFAULT NULL,
            is_report tinyint(1) NOT NULL DEFAULT 0,
            title text NOT NULL,
            description longtext NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime DEFAULT NULL,
            deleted_at datetime DEFAULT NULL,
            deleted_by bigint(20) unsigned DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY project_time (project_id,occurred_at),
            KEY category (category),
            KEY project_deleted (project_id,deleted_at)
        ) {$charset};");
        dbDelta("CREATE TABLE {$comments} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            event_id bigint(20) unsigned NOT NULL,
            author_id bigint(20) unsigned NOT NULL,
            body longtext NOT NULL,
            visibility varchar(24) NOT NULL DEFAULT 'management',
            needs_follow_up tinyint(1) NOT NULL DEFAULT 0,
            resolved_at datetime DEFAULT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY event_time (event_id,created_at),
            KEY project_id (project_id),
            KEY author_id (author_id)
        ) {$charset};");
        dbDelta("CREATE TABLE {$media} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            event_id bigint(20) unsigned NOT NULL,
            comment_id bigint(20) unsigned DEFAULT NULL,
            author_id bigint(20) unsigned NOT NULL,
            original_name varchar(240) NOT NULL,
            stored_name varchar(100) NOT NULL,
            mime varchar(80) NOT NULL,
            file_size bigint(20) unsigned NOT NULL,
            media_type varchar(16) NOT NULL,
            status varchar(16) NOT NULL DEFAULT 'pending',
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY stored_name (stored_name),
            KEY event_status (event_id,status),
            KEY project_id (project_id),
            KEY comment_id (comment_id)
        ) {$charset};");

        $office=$wpdb->prefix.'moj_office_record';
        $messages=$wpdb->prefix.'moj_reference_message';
        $archives=$wpdb->prefix.'moj_project_archive';
        $audit=$wpdb->prefix.'moj_audit_event';
        dbDelta("CREATE TABLE {$office} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            section varchar(24) NOT NULL,
            author_id bigint(20) unsigned NOT NULL,
            title varchar(240) NOT NULL,
            description longtext NOT NULL,
            metadata longtext NOT NULL,
            amount varchar(24) DEFAULT NULL,
            record_date date DEFAULT NULL,
            version int(11) unsigned NOT NULL DEFAULT 1,
            parent_id bigint(20) unsigned DEFAULT NULL,
            status varchar(24) NOT NULL DEFAULT 'active',
            stored_name varchar(100) DEFAULT NULL,
            original_name varchar(240) DEFAULT NULL,
            mime varchar(80) DEFAULT NULL,
            file_size bigint(20) unsigned DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime DEFAULT NULL,
            deleted_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY project_section (project_id,section),
            KEY section_date (section,record_date),
            KEY parent_id (parent_id),
            KEY stored_name (stored_name)
        ) {$charset};");
        dbDelta("CREATE TABLE {$messages} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            reference_id bigint(20) unsigned NOT NULL,
            project_id bigint(20) unsigned NOT NULL,
            author_id bigint(20) unsigned NOT NULL,
            body longtext NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY reference_time (reference_id,created_at),
            KEY project_id (project_id)
        ) {$charset};");
        dbDelta("CREATE TABLE {$archives} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            project_id bigint(20) unsigned NOT NULL,
            created_by bigint(20) unsigned NOT NULL,
            stored_name varchar(100) NOT NULL,
            file_sha256 char(64) NOT NULL,
            file_size bigint(20) unsigned NOT NULL,
            included_files int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY project_time (project_id,created_at)
        ) {$charset};");
        dbDelta("CREATE TABLE {$audit} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            actor_id bigint(20) unsigned NOT NULL,
            project_id bigint(20) unsigned NOT NULL,
            action varchar(80) NOT NULL,
            resource_type varchar(32) NOT NULL,
            resource_id bigint(20) unsigned NOT NULL,
            details longtext NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY project_time (project_id,created_at),
            KEY resource (resource_type,resource_id)
        ) {$charset};");
        update_option('mojarrad_schema_version',self::VERSION,false);
    }
}
