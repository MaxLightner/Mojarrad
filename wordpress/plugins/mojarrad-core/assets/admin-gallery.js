(function ($) {
  "use strict";
  $(function () {
    var $button = $("#moj-gallery-select");
    var $input = $("#moj_gallery_ids");
    if (!$button.length || !$input.length || !window.wp || !wp.media) return;
    $button.on("click", function () {
      var frame = wp.media({
        title: "تصاویر عمومی پروژه",
        button: { text: "ثبت در گالری" },
        library: { type: "image" },
        multiple: true
      });
      frame.on("open", function () {
        var ids = String($input.val() || "").split(",").map(Number).filter(Boolean);
        var selection = frame.state().get("selection");
        ids.forEach(function (id) {
          var attachment = wp.media.attachment(id);
          attachment.fetch();
          selection.add(attachment);
        });
      });
      frame.on("select", function () {
        var ids = frame.state().get("selection").map(function (item) { return item.id; });
        $input.val(ids.join(","));
      });
      frame.open();
    });
  });
})(jQuery);
