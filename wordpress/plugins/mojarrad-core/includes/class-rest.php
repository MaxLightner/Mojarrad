<?php
defined( 'ABSPATH' ) || exit;

/** Safe first endpoint: no private project operations until role matrix is tested. */
final class Mojarrad_REST {
    public static function register_routes() {
        register_rest_route( 'mojarrad/v1', '/me/projects', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array( __CLASS__, 'my_projects' ),
            'permission_callback' => function () { return is_user_logged_in(); },
        ) );
    }

    public static function my_projects( WP_REST_Request $request ): WP_REST_Response {
        $uid = get_current_user_id();
        if ( $uid <= 0 ) {
            return new WP_REST_Response( array( 'projects' => array() ), 401 );
        }
        $args = array(
            'post_type' => 'moj_project', 'post_status' => array( 'publish', 'private' ),
            'posts_per_page' => -1, 'orderby' => 'date', 'order' => 'DESC',
        );
        if ( ! Mojarrad_Access::is_global_reader( $uid ) ) {
            $ids = Mojarrad_Access::assigned_ids( $uid );
            if ( ! $ids ) { return new WP_REST_Response( array( 'projects' => array() ), 200 ); }
            $args['post__in'] = $ids;
        }
        $items = array();
        foreach ( get_posts( $args ) as $project ) {
            if ( ! Mojarrad_Access::can_read( $uid, (int) $project->ID ) ) { continue; }
            $items[] = array(
                'id' => (int) $project->ID,
                'slug' => $project->post_name,
                'title' => get_the_title( $project->ID ),
            );
        }
        return new WP_REST_Response( array( 'projects' => $items ), 200 );
    }
}
