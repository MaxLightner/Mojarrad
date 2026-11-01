<?php
/** Single-page project gallery: content stays in individual WordPress records. */
get_header();
$projects = array();
while ( have_posts() ) {
    the_post();
    $id = get_the_ID();
    $kind = mojarrad_meta( 'kind', $id );
    $category = $kind === 'باغ' ? 'garden' : 'building';
    $cover = has_post_thumbnail( $id ) ? (string) get_the_post_thumbnail_url( $id, 'full' ) : '';
    if ( ! $cover ) {
        $relative = mojarrad_meta( 'portfolio_cover', $id );
        if ( $relative && preg_match( '#^projects/nb-\d{4}/[\w-]+\.avif$#', $relative ) &&
             is_file( get_template_directory() . '/assets/' . $relative ) ) {
            $cover = mojarrad_asset( $relative );
        }
    }
    $placeholder = mojarrad_asset( 'images/project-placeholder.svg' );
    $images = $cover ? array( $cover ) : array();
    foreach ( array_filter( array_map( 'absint', explode( ',', (string) get_post_meta( $id, 'moj_gallery_ids', true ) ) ) ) as $media_id ) {
        $url = wp_get_attachment_image_url( $media_id, 'full' );
        if ( $url ) { $images[] = $url; }
    }
    $imported = json_decode( (string) get_post_meta( $id, 'moj_portfolio_gallery', true ), true );
    if ( is_array( $imported ) ) {
        foreach ( $imported as $relative ) {
            if ( is_string( $relative ) && preg_match( '#^projects/nb-\d{4}/[\w-]+\.avif$#', $relative ) &&
                 is_file( get_template_directory() . '/assets/' . $relative ) ) {
                $images[] = mojarrad_asset( $relative );
            }
        }
    }
    $images = array_values( array_unique( $images ) );
    if ( ! $images ) { $images = array( $placeholder ); }
    $facts = array();
    $fields = array(
        'location' => 'موقعیت', 'kind' => 'نوع پروژه', 'land_area' => 'مساحت زمین',
        'floors_above_ground' => 'طبقات روی همکف', 'roof_count' => 'تعداد سقف',
        'units' => 'تعداد واحد', 'unit_area' => 'متراژ هر واحد',
        'area' => 'زیربنا', 'year' => 'سال', 'owner' => 'کارفرما',
        'designer' => 'طراح', 'supervisor' => 'ناظر'
    );
    foreach ( $fields as $field => $label ) {
        $value = trim( mojarrad_meta( $field, $id ) );
        if ( $value !== '' ) {
            if ( in_array( $field, array( 'land_area', 'unit_area', 'area' ), true ) && is_numeric( $value ) ) {
                $value .= ' مترمربع';
            }
            $facts[] = array( 'label' => $label, 'value' => $value );
        }
    }
    $lat_text = trim( mojarrad_meta( 'latitude', $id ) );
    $lng_text = trim( mojarrad_meta( 'longitude', $id ) );
    $has_coordinates = is_numeric( $lat_text ) && is_numeric( $lng_text ) &&
        (float) $lat_text >= -90 && (float) $lat_text <= 90 &&
        (float) $lng_text >= -180 && (float) $lng_text <= 180;
    $projects[] = array(
        'slug' => get_post_field( 'post_name', $id ), 'title' => get_the_title( $id ),
        'kind' => $kind, 'category' => $category,
        'location' => mojarrad_meta( 'location', $id ),
        'cover' => $cover ?: $placeholder, 'placeholder' => ! $cover,
        'images' => $images, 'facts' => $facts,
        'description' => trim( wp_strip_all_tags( get_post_field( 'post_content', $id ) ) ),
        'latitude' => $has_coordinates ? (float) $lat_text : null,
        'longitude' => $has_coordinates ? (float) $lng_text : null
    );
}
wp_reset_postdata();
$building_count = count( array_filter( $projects, static function ( $p ) { return $p['category'] === 'building'; } ) );
$garden_count = count( $projects ) - $building_count;
?>
<div id="moj-portfolio" class="moj-portfolio" data-placeholder="<?php echo esc_url( mojarrad_asset( 'images/project-placeholder.svg' ) ); ?>">
  <section class="container portfolio-intro" aria-labelledby="portfolio-title">
    <div><span class="portfolio-overline">NIKA BANA / SELECTED PROJECTS</span>
      <h1 id="portfolio-title">پروژه‌های <em>نیکابنا</em> <small><?php echo esc_html( count( $projects ) ); ?></small></h1></div>
    <p>مروری تصویری بر ساختمان‌ها و باغ‌های مجموعه</p>
  </section>
  <section class="container portfolio-collection" aria-label="گالری پروژه‌ها">
    <div class="portfolio-toolbar">
      <div class="portfolio-filters" role="group" aria-label="دسته‌بندی پروژه‌ها">
        <button class="portfolio-filter is-active" data-filter="all" type="button" aria-pressed="true">همه <span><?php echo esc_html( count( $projects ) ); ?></span></button>
        <button class="portfolio-filter" data-filter="building" type="button" aria-pressed="false">ساختمانی <span><?php echo esc_html( $building_count ); ?></span></button>
        <button class="portfolio-filter" data-filter="garden" type="button" aria-pressed="false">باغ‌ها <span><?php echo esc_html( $garden_count ); ?></span></button>
      </div>
      <span class="portfolio-toolbar-hint">برای مشاهده جزئیات روی تصویر کلیک کنید ↖</span>
    </div>
    <?php if ( $projects ) : ?>
      <div class="portfolio-mosaic" id="portfolio-mosaic">
      <?php foreach ( $projects as $index => $project ) : ?>
        <button type="button" class="portfolio-tile<?php echo $project['placeholder'] ? ' is-placeholder' : ''; ?>"
          data-project-index="<?php echo esc_attr( $index ); ?>" data-category="<?php echo esc_attr( $project['category'] ); ?>"
          aria-label="مشاهده <?php echo esc_attr( $project['title'] ); ?>">
          <img loading="lazy" decoding="async" src="<?php echo esc_url( $project['cover'] ); ?>"
            alt="<?php echo esc_attr( $project['placeholder'] ? 'تصویر جایگزین پروژه' : $project['title'] ); ?>">
          <span class="portfolio-tile-shade" aria-hidden="true"></span>
          <span class="portfolio-tile-info"><small><?php echo esc_html( $project['kind'] ?: 'پروژه' ); ?></small>
            <strong><?php echo esc_html( $project['title'] ); ?></strong>
            <span><?php echo esc_html( $project['location'] ); ?></span></span>
          <span class="portfolio-tile-corner" aria-hidden="true">↖</span>
        </button>
      <?php endforeach; ?>
      </div>
      <p id="portfolio-no-results" class="portfolio-no-results" hidden>در این دسته پروژه‌ای وجود ندارد.</p>
    <?php else : ?><p class="portfolio-no-results">گالری پروژه‌ها در حال تکمیل است.</p><?php endif; ?>
  </section>
  <section class="container portfolio-map-section" aria-labelledby="portfolio-map-title">
    <div class="portfolio-map-heading"><div><span class="portfolio-overline">PROJECT LOCATIONS</span><h2 id="portfolio-map-title">ردپای پروژه‌ها <em>روی نقشه</em></h2></div>
      <p>مشهد و پیرامون؛ با انتخاب نشانگر، تصاویر و مشخصات پروژه باز می‌شود.</p></div>
    <div class="portfolio-map-shell"><div id="portfolio-map" class="portfolio-map" role="region" aria-label="نقشه تعاملی پروژه‌ها"></div>
      <div id="portfolio-map-notice" class="portfolio-map-notice" role="status">در حال آماده‌سازی نقشه…</div></div>
    <p class="portfolio-map-footnote">برای جلوگیری از نمایش نشانی نادرست، فقط پروژه‌هایی که مختصاتشان ثبت شده روی نقشه نشان داده می‌شوند.</p>
  </section>
  <section class="container portfolio-closing"><span>پروژه بعدی شما می‌تواند اینجا باشد.</span><a href="<?php echo esc_url( mojarrad_link( 'consulting' ) ); ?>">گفت‌وگو درباره همکاری ↖</a></section>
</div>
<div class="portfolio-lightbox" id="portfolio-lightbox" role="dialog" aria-modal="true" aria-labelledby="portfolio-dialog-title" aria-hidden="true" hidden>
  <div class="portfolio-dialog-backdrop" data-close-dialog></div>
  <div class="portfolio-dialog" tabindex="-1">
    <header class="portfolio-dialog-header"><div><span class="portfolio-overline">NIKA BANA / PROJECT</span><h2 id="portfolio-dialog-title"></h2></div>
      <button class="portfolio-icon-btn portfolio-close" type="button" data-close-dialog aria-label="بستن">×</button></header>
    <div class="portfolio-dialog-content">
      <div class="portfolio-dialog-media">
        <div class="portfolio-stage"><img id="portfolio-stage-image" alt="">
          <button id="portfolio-next" class="portfolio-stage-arrow portfolio-stage-next" type="button" aria-label="عکس بعدی">‹</button>
          <button id="portfolio-prev" class="portfolio-stage-arrow portfolio-stage-prev" type="button" aria-label="عکس قبلی">›</button>
          <span id="portfolio-image-count" class="portfolio-stage-count"></span></div>
        <div id="portfolio-thumbs" class="portfolio-thumbs" role="group" aria-label="تصاویر پروژه"></div>
      </div>
      <aside class="portfolio-info-panel" id="portfolio-info-panel" aria-label="مشخصات و پیمایش پروژه‌ها">
        <div class="portfolio-dialog-details">
          <div class="portfolio-info-heading"><span class="portfolio-overline">PROJECT INFORMATION</span><h3>شناسنامه پروژه</h3></div>
          <dl id="portfolio-facts" class="portfolio-facts"></dl>
          <p id="portfolio-description" hidden></p>
        </div>
        <button id="portfolio-details-toggle" class="portfolio-details-toggle" type="button" aria-controls="portfolio-facts" aria-expanded="false"><span id="portfolio-details-toggle-label">نمایش همه مشخصات</span><span class="portfolio-details-chevron" aria-hidden="true">⌄</span></button>
        <div class="portfolio-dialog-footer"><button id="portfolio-project-prev" class="portfolio-text-btn" type="button">پروژه قبلی →</button><button id="portfolio-project-next" class="portfolio-text-btn" type="button">پروژه بعدی ←</button></div>
      </aside>
    </div>
  </div>
</div>
<script id="portfolio-project-data" type="application/json"><?php echo wp_json_encode( $projects, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?></script>
<?php get_footer(); ?>
