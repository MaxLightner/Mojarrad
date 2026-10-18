<?php
defined('ABSPATH') || exit;
$type = isset($args['type']) ? sanitize_key($args['type']) : 'consulting';
if (!in_array($type,array('consulting','supplier','contractor','sale'),true)) return;
mojarrad_form_status();
?>
<form class="card-lux form-card form-grid" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
  <input type="hidden" name="action" value="mojarrad_lead">
  <input type="hidden" name="moj_type" value="<?php echo esc_attr($type); ?>">
  <?php wp_nonce_field('mojarrad_lead_'.$type,'moj_nonce'); ?>
  <label>نام و نام خانوادگی *<input name="moj_name" type="text" required maxlength="240" autocomplete="name"></label>
  <label>شماره تماس *<input name="moj_phone" type="tel" required maxlength="20" autocomplete="tel" inputmode="tel"></label>
  <?php if('consulting'!==$type): ?><label>شرکت / مجموعه<input name="moj_company" type="text" maxlength="240"></label><?php endif; ?>
  <label>حوزه فعالیت / موضوع<?php echo in_array($type,array('supplier','contractor'),true)?' *':''; ?>
    <input name="moj_field" type="text" maxlength="300" <?php echo in_array($type,array('supplier','contractor'),true)?'required':''; ?>></label>
  <label class="full">توضیحات<textarea name="moj_message" rows="5" maxlength="6000"></textarea></label>
  <label class="hidden-trap" aria-hidden="true" tabindex="-1">وب‌سایت<input type="text" name="moj_site_url" tabindex="-1" autocomplete="off"></label>
  <button type="submit" class="btn-gold">ثبت درخواست</button>
</form>
