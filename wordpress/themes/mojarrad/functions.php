<?php
defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function () {
    load_theme_textdomain( 'mojarrad', get_template_directory() . '/languages' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
    register_nav_menus( array( 'primary' => __( 'Main navigation', 'mojarrad' ) ) );
    add_image_size( 'mojarrad-card', 840, 520, true );
} );
add_action( 'wp_enqueue_scripts', function () {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'mojarrad-theme', get_stylesheet_uri(), array(), $version );
    wp_enqueue_script( 'mojarrad-ui', get_template_directory_uri() . '/assets/js/site.js', array(), $version, true );
    if ( is_page('office') ) {
        wp_enqueue_style('mojarrad-office',get_template_directory_uri().'/assets/css/office.css',array('mojarrad-theme'),$version);
        wp_enqueue_script('mojarrad-office',get_template_directory_uri().'/assets/js/office.js',array(),$version,true);
        $project=isset($_GET['project'])?absint($_GET['project']):0;
        $uid=get_current_user_id();
        $caps=class_exists('Mojarrad_Office_Access')?Mojarrad_Office_Access::capabilities($uid,$project):array();
        $selected=isset($_GET['section'])?sanitize_key(wp_unslash($_GET['section'])):'';
        $section=isset($caps[$selected])?$selected:array_key_first($caps);
        wp_add_inline_script('mojarrad-office','window.mojOffice='.wp_json_encode(array(
            'rest'=>esc_url_raw(rest_url('mojarrad/v1/')),
            'nonce'=>wp_create_nonce('wp_rest'),'project'=>$project,
            'section'=>$section,'permissions'=>$caps,
        ),JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');
    }
    if ( is_page('timeline') ) {
        wp_enqueue_style('mojarrad-timeline',get_template_directory_uri().'/assets/css/timeline.css',array('mojarrad-theme'),$version);
        wp_enqueue_script('mojarrad-timeline',get_template_directory_uri().'/assets/js/timeline.js',array(),$version,true);
        wp_add_inline_script('mojarrad-timeline','window.mojTimeline='.wp_json_encode(array(
            'rest'=>esc_url_raw(rest_url('mojarrad/v1/')),
            'nonce'=>wp_create_nonce('wp_rest'),
            'project'=>isset($_GET['project'])?absint($_GET['project']):0,
        ),JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');
    }
    if ( is_front_page() && is_file( get_template_directory() . '/assets/js/hero3d.js' ) ) {
        wp_enqueue_script( 'mojarrad-three-hero', get_template_directory_uri() . '/assets/js/hero3d.js', array(), $version, true );
    }
} );

function mojarrad_asset( string $path ): string {
    return get_template_directory_uri() . '/assets/' . ltrim( $path, '/' );
}
function mojarrad_link( string $key ): string {
    if ( 'projects' === $key || 'news' === $key || 'officials' === $key ) {
        $post_type = 'projects' === $key ? 'moj_project' : ( 'news' === $key ? 'moj_news' : 'moj_official' );
        if ( post_type_exists( $post_type ) ) {
            return (string) get_post_type_archive_link( $post_type );
        }
    }
    $page = get_page_by_path( $key );
    return $page ? get_permalink( $page ) : home_url( '/' . $key . '/' );
}
function mojarrad_meta( string $key, int $id = 0 ): string {
    return (string) get_post_meta( $id ?: get_the_ID(), 'moj_' . $key, true );
}
function mojarrad_project_cover( int $id = 0, string $size = 'mojarrad-card' ) {
    $id = $id ?: get_the_ID();
    if ( has_post_thumbnail( $id ) ) {
        echo get_the_post_thumbnail( $id, $size, array( 'loading' => 'lazy' ) );
    } elseif ( mojarrad_meta( 'demo_cover', $id ) ) {
        echo '<img loading="lazy" src="' . esc_url( mojarrad_asset( 'images/' . basename( mojarrad_meta( 'demo_cover', $id ) ) ) ) . '" alt="" />';
    } else {
        echo '<img loading="lazy" src="' . esc_url( mojarrad_asset( 'images/cons-n-1.jpg' ) ) . '" alt="" />';
    }
}
function mojarrad_project_status( int $id = 0 ): string {
    $terms = get_the_terms( $id ?: get_the_ID(), 'moj_project_status' );
    if ( $terms && ! is_wp_error( $terms ) ) { return (string) $terms[0]->slug; }
    return 'other';
}
function mojarrad_render_project_card( int $id = 0 ) {
    $id = $id ?: get_the_ID();
    $is_sale = '1' === mojarrad_meta( 'for_sale', $id );
    ?>
    <article class="card-lux project-card">
        <a href="<?php echo esc_url( get_permalink( $id ) ); ?>" class="card-image">
          <?php mojarrad_project_cover( $id ); ?>
          <span class="image-shade"></span>
          <?php if ( $is_sale ) : ?><span class="badge-gold">در فروش</span><?php endif; ?>
          <strong class="image-title"><?php echo esc_html( get_the_title( $id ) ); ?></strong>
        </a>
        <div class="card-body">
          <span class="meta-line"><?php echo esc_html( mojarrad_meta( 'location', $id ) ); ?></span>
          <span class="meta-line"><?php echo esc_html( mojarrad_meta( 'status', $id ) ); ?></span>
          <?php if ( $is_sale && mojarrad_meta( 'sale_price', $id ) ) : ?>
            <span class="sale-price"><?php echo esc_html( mojarrad_meta( 'sale_price', $id ) ); ?></span>
          <?php endif; ?>
        </div>
    </article>
    <?php
}
function mojarrad_render_editorial_card() {
    ?>
    <article class="card-lux editorial-card">
        <a class="card-image" href="<?php the_permalink(); ?>">
            <?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'mojarrad-card', array( 'loading' => 'lazy' ) ); } elseif ( mojarrad_meta('demo_image') ) { echo '<img loading="lazy" src="' . esc_url( mojarrad_asset('images/' . ltrim(mojarrad_meta('demo_image'),'/')) ) . '" alt="" />'; } ?>
        </a>
        <div class="card-body">
          <span class="meta-line"><?php echo esc_html( get_the_date( 'Y/m/d' ) ); ?></span>
          <h3><a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a></h3>
          <p class="muted"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 23 ) ); ?></p>
        </div>
    </article>
    <?php
}
function mojarrad_fallback_menu() {
    $items = array(
        'projects' => 'پروژه‌ها', 'sale' => 'فروش', 'news' => 'اخبار',
        'blog' => 'وبلاگ', 'officials' => 'مسئولین',
        'about' => 'درباره ما', 'consulting' => 'مشاوره', 'collaborate' => 'همکاری',
    );
    echo '<ul class="nav-list">';
    foreach ( $items as $key => $label ) {
        echo '<li><a href="' . esc_url( mojarrad_link( $key ) ) . '">' . esc_html( $label ) . '</a></li>';
    }
    echo '</ul>';
}
function mojarrad_form_status() {
    $status = isset( $_GET['lead_status'] ) && is_string( $_GET['lead_status'] ) ? sanitize_key( wp_unslash( $_GET['lead_status'] ) ) : '';
    $messages = array(
        'ok' => 'درخواست شما ثبت شد.',
        'invalid' => 'اطلاعات فرم معتبر نیست؛ موارد الزامی را بررسی کنید.',
        'limit' => 'تعداد درخواست‌های ارسالی زیاد است؛ بعداً دوباره تلاش کنید.',
        'error' => 'ثبت درخواست با خطا مواجه شد.',
    );
    if ( isset( $messages[$status] ) ) {
        echo '<p class="notice" role="status">' . esc_html( $messages[$status] ) . '</p>';
    }
}
