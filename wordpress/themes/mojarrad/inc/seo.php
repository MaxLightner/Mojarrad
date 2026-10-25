<?php
/**
 * Public search metadata for Nika Bana.
 * WordPress owns canonical tags for singular content and the XML sitemap.
 */
defined( 'ABSPATH' ) || exit;

function mojarrad_seo_private_route(): bool {
    return is_page( array( 'login', 'editorial', 'dashboard', 'timeline', 'office', 'sample-page', 'برگه-نمونه' ) )
        || is_search()
        || is_author();
}

/** Member-only tools and low-value search/author listings must not be indexed. */
add_filter( 'wp_robots', function ( array $robots ): array {
    if ( mojarrad_seo_private_route() ) {
        unset( $robots['index'] );
        $robots['noindex'] = true;
    }
    return $robots;
}, 20 );

/** Keep public sitemap pages separate from the member area. */
add_filter( 'wp_sitemaps_posts_query_args', function ( array $args, string $post_type ): array {
    if ( 'page' !== $post_type ) {
        return $args;
    }
    $excluded = isset( $args['post__not_in'] ) ? (array) $args['post__not_in'] : array();
    foreach ( array( 'login', 'editorial', 'dashboard', 'timeline', 'office', 'sample-page', 'برگه-نمونه' ) as $slug ) {
        $page = get_page_by_path( $slug );
        if ( $page instanceof WP_Post ) {
            $excluded[] = (int) $page->ID;
        }
    }
    // On some legacy installs the sample-page slug is stored URL-encoded,
    // so get_page_by_path() alone does not resolve the published page.
    foreach ( get_pages( array( 'post_status' => 'publish', 'hierarchical' => false ) ) as $candidate ) {
        if ( in_array( rawurldecode( (string) $candidate->post_name ), array( 'sample-page', 'برگه-نمونه' ), true ) ) {
            $excluded[] = (int) $candidate->ID;
        }
    }
    $args['post__not_in'] = array_values( array_unique( array_map( 'absint', $excluded ) ) );
    return $args;
}, 10, 2 );

/** Avoid exposing WordPress author-profile URLs through the core sitemap. */
add_filter( 'wp_sitemaps_add_provider', function ( $provider, string $name ) {
    return 'users' === $name ? false : $provider;
}, 10, 2 );

function mojarrad_seo_plugin_active(): bool {
    return defined( 'WPSEO_VERSION' )
        || defined( 'RANK_MATH_VERSION' )
        || defined( 'AIOSEO_VERSION' )
        || defined( 'SEOPRESS_VERSION' )
        || defined( 'THE_SEO_FRAMEWORK_VERSION' );
}

function mojarrad_seo_summary( string $value ): string {
    $plain = trim( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( strip_shortcodes( $value ) ) ) );
    return $plain ? wp_html_excerpt( $plain, 165, '…' ) : '';
}

function mojarrad_seo_description(): string {
    if ( is_front_page() ) {
        return 'گروه ساختمانی نیکا بنا به مدیریت مهندس حسین مجرد در مشهد؛ معرفی پروژه‌های معماری و ساختمانی، خدمات اجرا و مشاوره ساخت و سرمایه‌گذاری.';
    }
    if ( is_post_type_archive( 'moj_project' ) ) {
        return 'نمونه پروژه‌های معماری و ساختمانی گروه نیکا بنا در مشهد؛ اطلاعات، تصاویر و جزئیات طراحی و اجرای پروژه‌های تکمیل‌شده و در دست اقدام.';
    }
    if ( is_post_type_archive( 'moj_news' ) ) {
        return 'اخبار و یادداشت‌های گروه ساختمانی نیکا بنا درباره روند ساخت، معماری، مصالح و مسائل اجرایی پروژه‌های ساختمانی.';
    }
    if ( is_post_type_archive( 'moj_official' ) ) {
        return 'آشنایی با مدیریت، اعضا و مسئولیت‌های حرفه‌ای گروه ساختمانی نیکا بنا.';
    }

    $pages = array(
        'about'       => 'آشنایی با گروه ساختمانی نیکا بنا، مهندس حسین مجرد و رویکرد مجموعه در مدیریت، طراحی و اجرای ساختمان در مشهد.',
        'blog'        => 'دیدگاه نیکابنا درباره اقتصاد ساخت، مدیریت پروژه، روابط کارگاهی و مسئله‌های واقعی صنعت ساختمان در مشهد و ایران.',
        'sale'        => 'معرفی املاک و فرصت‌های فروش و سرمایه‌گذاری منتشرشده توسط گروه ساختمانی نیکا بنا.',
        'consulting'  => 'درخواست مشاوره طراحی، اجرا، برآورد و مدیریت پروژه ساختمانی با گروه ساختمانی نیکا بنا در مشهد.',
        'collaborate' => 'فرصت همکاری پیمانکاران، مهندسان و متخصصان صنعت ساختمان با گروه ساختمانی نیکا بنا.',
    );
    foreach ( $pages as $slug => $description ) {
        if ( is_page( $slug ) ) {
            return $description;
        }
    }

    $object = get_queried_object();
    if ( $object instanceof WP_Post ) {
        if ( 'post' === $object->post_type ) {
            $editorial_description = (string) get_post_meta( $object->ID, '_moj_seo_description', true );
            if ( $editorial_description ) return mojarrad_seo_summary( $editorial_description );
        }
        $summary = $object->post_excerpt ?: $object->post_content;
        if ( 'moj_project' === $object->post_type ) {
            $location = trim( (string) get_post_meta( $object->ID, 'moj_location', true ) );
            $subtitle = trim( (string) get_post_meta( $object->ID, 'moj_subtitle', true ) );
            $summary = get_the_title( $object ) . ( $location ? ' در ' . $location : '' )
                . '؛ ' . ( $subtitle ?: $summary );
        }
        $description = mojarrad_seo_summary( (string) $summary );
        if ( $description ) {
            return $description;
        }
    }
    if ( $object instanceof WP_Term ) {
        $description = mojarrad_seo_summary( (string) term_description( $object->term_id ) );
        if ( $description ) {
            return $description;
        }
    }
    return 'نیکا بنا؛ طراحی، ساخت و اجرای پروژه‌های ساختمانی و معماری در مشهد.';
}

add_filter( 'document_title_parts', function ( array $parts ): array {
    if ( mojarrad_seo_plugin_active() || mojarrad_seo_private_route() ) {
        return $parts;
    }
    if ( is_front_page() ) {
        $parts['title'] = 'نیکا بنا | طراحی و اجرای ساختمان در مشهد';
        unset( $parts['site'], $parts['tagline'] );
        return $parts;
    }
    if ( is_post_type_archive( 'moj_project' ) ) {
        $parts['title'] = 'پروژه‌های ساختمانی و معماری';
    } elseif ( is_post_type_archive( 'moj_news' ) ) {
        $parts['title'] = 'اخبار و یادداشت‌های ساختمانی';
    } elseif ( is_page( 'blog' ) ) {
        $parts['title'] = 'دیدگاه نیکابنا | اقتصاد و مسئله‌های ساخت‌وساز';
    } elseif ( is_singular( 'post' ) ) {
        $editorial_title = trim( (string) get_post_meta( get_queried_object_id(), '_moj_seo_title', true ) );
        if ( $editorial_title ) {
            $parts['title'] = $editorial_title;
            unset( $parts['site'], $parts['tagline'] );
            return $parts;
        }
    } elseif ( is_singular( 'moj_project' ) ) {
        $id = get_queried_object_id();
        $location = trim( (string) get_post_meta( $id, 'moj_location', true ) );
        if ( $location ) {
            $parts['title'] = get_the_title( $id ) . ' | ' . $location;
        }
    }
    $parts['site'] = 'نیکا بنا';
    return $parts;
}, 20 );

function mojarrad_seo_social_image(): string {
    if ( is_singular() ) {
        $id = get_queried_object_id();
        $featured = get_the_post_thumbnail_url( $id, 'large' );
        if ( $featured ) {
            return $featured;
        }
        $editorial_cover = (string) get_post_meta( $id, '_moj_editorial_cover', true );
        if ( $editorial_cover && get_post_type( $id ) === 'post' ) {
            return mojarrad_asset( 'images/' . basename( $editorial_cover ) );
        }
        $demo = (string) get_post_meta( $id, 'moj_demo_cover', true );
        if ( $demo && 'moj_project' === get_post_type( $id ) ) {
            return mojarrad_asset( 'images/' . basename( $demo ) );
        }
    }
    return mojarrad_asset( 'images/cons-n-1.jpg' );
}

function mojarrad_seo_archive_canonical(): string {
    if ( is_front_page() ) {
        return home_url( '/' );
    }
    if ( is_post_type_archive() ) {
        $link = get_post_type_archive_link( get_query_var( 'post_type' ) );
    } elseif ( is_category() ) {
        $link = get_category_link( get_queried_object_id() );
    } elseif ( is_tax() ) {
        $link = get_term_link( get_queried_object() );
    } else {
        return '';
    }
    if ( is_wp_error( $link ) || ! $link ) {
        return '';
    }
    return is_paged() ? get_pagenum_link( max( 1, (int) get_query_var( 'paged' ) ) ) : $link;
}

add_action( 'wp_head', function () {
    if ( is_admin() || is_feed() || is_404() || mojarrad_seo_private_route() || mojarrad_seo_plugin_active() ) {
        return;
    }
    $description = mojarrad_seo_description();
    $canonical = mojarrad_seo_archive_canonical();
    $url = is_singular() ? get_permalink( get_queried_object_id() ) : ( $canonical ?: home_url( '/' ) );
    $title = wp_get_document_title();
    $image = mojarrad_seo_social_image();

    echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
    if ( $canonical ) {
        echo '<link rel="canonical" href="' . esc_url( $canonical ) . '">' . "\n";
    }
    echo '<meta property="og:locale" content="fa_IR">' . "\n";
    echo '<meta property="og:type" content="' . ( is_singular( array( 'post', 'moj_news' ) ) ? 'article' : 'website' ) . '">' . "\n";
    echo '<meta property="og:site_name" content="نیکا بنا">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
    echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";

    $organization = array(
        '@type' => 'Organization',
        '@id'   => home_url( '/#organization' ),
        'name'  => 'گروه ساختمانی نیکا بنا',
        'url'   => home_url( '/' ),
        'logo'  => mojarrad_asset( 'logo.svg' ),
    );
    if ( is_front_page() ) {
        $schema = array(
            '@context' => 'https://schema.org',
            '@graph'   => array(
                $organization,
                array(
                    '@type'       => 'WebSite',
                    '@id'         => home_url( '/#website' ),
                    'url'         => home_url( '/' ),
                    'name'        => 'نیکا بنا',
                    'inLanguage'  => 'fa-IR',
                    'publisher'   => array( '@id' => $organization['@id'] ),
                ),
            ),
        );
    } elseif ( is_singular( array( 'post', 'moj_news' ) ) ) {
        $id = get_queried_object_id();
        $article = array(
            '@context'          => 'https://schema.org',
            '@type'             => is_singular( 'moj_news' ) ? 'NewsArticle' : 'BlogPosting',
            'headline'          => get_the_title( $id ),
            'description'       => $description,
            'mainEntityOfPage'  => get_permalink( $id ),
            'datePublished'     => get_post_time( 'c', true, $id ),
            'dateModified'      => get_post_modified_time( 'c', true, $id ),
            'inLanguage'        => 'fa-IR',
            'author'            => is_singular( 'post' )
                ? array(
                    '@type' => ((string) get_post_meta( $id, '_moj_editorial_byline', true ) === 'تحریریه نیکابنا') ? 'Organization' : 'Person',
                    'name'  => (string) get_post_meta( $id, '_moj_editorial_byline', true ) ?: get_the_author_meta( 'display_name', get_post_field( 'post_author', $id ) ),
                )
                : array( '@id' => $organization['@id'] ),
            'publisher'         => $organization,
        );
        if ( has_post_thumbnail( $id ) ) {
            $article['image'] = get_the_post_thumbnail_url( $id, 'full' );
        } elseif ( is_singular( 'post' ) && get_post_meta( $id, '_moj_editorial_cover', true ) ) {
            $article['image'] = mojarrad_asset( 'images/' . basename( (string) get_post_meta( $id, '_moj_editorial_cover', true ) ) );
        }
        $schema = $article;
    } else {
        return;
    }
    echo '<script type="application/ld+json">'
        . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
        . '</script>' . "\n";
}, 25 );
