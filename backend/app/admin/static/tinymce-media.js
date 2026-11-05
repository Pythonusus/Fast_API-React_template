// Loaded after TinyMCE. form.js calls $.fn.tinymce on DOM ready, which is
// still in the future when this file runs, so wrapping the plugin here adds
// a file picker to options that JSON cannot carry (functions).
(function () {
  if (!window.jQuery || !jQuery.fn.tinymce) return;

  var original = jQuery.fn.tinymce;
  jQuery.fn.tinymce = function (options) {
    options = options || {};
    var uploadUrl = options.images_upload_url;
    if (uploadUrl && !options.file_picker_callback) {
      options.file_picker_types = "image media";
      options.file_picker_callback = function (callback, _value, meta) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept =
          meta.filetype === "image"
            ? "image/jpeg,image/png,image/gif,image/webp"
            : "video/mp4,video/webm,video/ogg,audio/mpeg,audio/ogg,audio/wav,audio/webm";
        input.onchange = function () {
          var file = input.files && input.files[0];
          if (!file) return;
          var body = new FormData();
          body.append("file", file);
          fetch(uploadUrl, {
            method: "POST",
            body: body,
            credentials: "same-origin",
          })
            .then(function (response) {
              if (!response.ok) throw new Error("upload failed");
              return response.json();
            })
            .then(function (data) {
              callback(data.location, { title: file.name });
            })
            .catch(function () {
              window.alert("Не удалось загрузить файл");
            });
        };
        input.click();
      };
    }
    return original.call(this, options);
  };
})();
