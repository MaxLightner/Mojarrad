</main>
<footer class="site-footer glass">
  <div class="container footer-inner">
    <div>
      <div class="footer-brand">
        <span class="brand-symbol" aria-hidden="true"></span>
        <span class="brand-wordmark"><strong>نیکابنا</strong><small lang="en">NIKABANA</small></span>
      </div>
      <p class="muted">ساخت با دقت، اعتماد با شفافیت — از طراحی تا پایان‌کار، همراه شما</p>
    </div>
    <nav class="footer-nav" aria-label="ناوبری فوتر">
      <?php foreach ( array( 'about'=>'درباره ما','projects'=>'پروژه‌ها','sale'=>'فروش','news'=>'اخبار','blog'=>'وبلاگ','officials'=>'مسئولین','consulting'=>'مشاوره','collaborate'=>'همکاری' ) as $key=>$label ) : ?>
        <a href="<?php echo esc_url( mojarrad_link( $key ) ); ?>"><?php echo esc_html( $label ); ?></a>
      <?php endforeach; ?>
    </nav>
    <div class="contact-info"><span>مشهد، ایران</span><a dir="ltr" href="tel:+989152061541">0915 206 1541</a><span>info@nikabana.ir</span></div>
  </div>
  <div class="container footer-copy">© <?php echo esc_html( date_i18n( 'Y' ) ); ?> نیکابنا</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
