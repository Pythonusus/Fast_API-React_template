// Post gallery + cover editor for PostMediaField.
// Files upload immediately; the form submits only ids (hidden inputs).
// Gallery tiles can be dragged into the TinyMCE body to embed S3 media.
(function () {
  "use strict";

  var MEDIA_MIME = "application/x-post-media";
  var galleryItems = function () {
    return [];
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function button(text, className, onClick) {
    var node = el("button", "btn btn-sm " + className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function escapeAttr(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /** HTML fragment inserted into TinyMCE for one gallery file. */
  function mediaHtml(media) {
    var src = escapeAttr(media.url);
    var name = escapeAttr(media.filename || "");
    if (media.kind === "image") {
      return '<p><img src="' + src + '" alt="' + name + '" /></p>';
    }
    if (media.kind === "video") {
      return (
        '<p><video src="' +
        src +
        '" controls playsinline preload="metadata"></video></p>'
      );
    }
    return (
      '<p><audio src="' +
      src +
      '" data-filename="' +
      name +
      '" controls preload="metadata"></audio></p>'
    );
  }

  function openGalleryDialog(editor) {
    var items = galleryItems();
    editor.windowManager.open({
      title: "Галерея",
      size: "medium",
      body: {
        type: "panel",
        items: [
          {
            type: "htmlpanel",
            html: '<div class="post-gallery-picker"></div>',
          },
        ],
      },
      buttons: [{ type: "cancel", text: "Закрыть" }],
    });
    var picker = document.querySelector(".tox-dialog .post-gallery-picker");
    if (!picker) return;
    if (items.length === 0) {
      picker.append(
        el(
          "p",
          "post-gallery-picker-empty",
          "Сначала загрузите файл в галерею.",
        ),
      );
      return;
    }
    for (const media of items) {
      var pick = el("button", "post-gallery-pick");
      pick.type = "button";
      if (media.kind === "image") {
        var img = el("img");
        img.src = media.url;
        img.alt = "";
        pick.append(img);
      } else if (media.kind === "video") {
        var videoPick = el("video");
        videoPick.src = media.url;
        videoPick.muted = true;
        videoPick.preload = "metadata";
        var wrap = el("span", "post-gallery-pick-media");
        wrap.append(videoPick);
        var playMark = el("i", "fa fa-play post-gallery-pick-play");
        playMark.setAttribute("aria-hidden", "true");
        wrap.append(playMark);
        pick.append(wrap);
      }
      pick.append(el("span", "", media.filename || media.kind));
      pick.addEventListener("click", function () {
        editor.insertContent(mediaHtml(media));
        editor.windowManager.close();
      });
      picker.append(pick);
    }
  }

  function registerGalleryPlugin() {
    if (!globalThis.tinymce || !tinymce.PluginManager) return;
    if (tinymce.PluginManager.get("postgallery")) return;
    tinymce.PluginManager.add("postgallery", function (editor) {
      editor.ui.registry.addButton("postgallery", {
        icon: "image",
        tooltip: "Вставить файл из галереи",
        onAction: function () {
          openGalleryDialog(editor);
        },
      });
    });
  }

  function preview(media) {
    if (media.kind === "image") {
      var img = el("img");
      img.src = media.url;
      img.alt = media.filename;
      img.loading = "lazy";
      return img;
    }
    if (media.kind === "video") {
      var video = el("video");
      video.src = media.url;
      video.muted = true;
      video.preload = "metadata";
      return video;
    }
    var audio = el("div", "post-media-audio");
    audio.append(el("span", "post-media-name", "♪ " + media.filename));
    return audio;
  }

  function readMediaTransfer(dataTransfer) {
    if (!dataTransfer) return null;
    var raw = dataTransfer.getData(MEDIA_MIME);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function editorList() {
    if (!globalThis.tinymce || typeof tinymce.get !== "function") return null;
    // TinyMCE 6 has no tinymce.editors. get() with no id returns every instance.
    var editors = tinymce.get();
    return Array.isArray(editors) ? editors : [];
  }

  function bindEditorDrops() {
    var editors = editorList();
    if (!editors) return false;
    var bound = 0;
    for (const editor of editors) {
      if (editor.__postMediaBound) {
        bound += 1;
        continue;
      }
      editor.__postMediaBound = true;
      bound += 1;

      editor.on("dragover", function (event) {
        if (!event.dataTransfer) return;
        if (
          Array.prototype.indexOf.call(event.dataTransfer.types, MEDIA_MIME) ===
          -1
        ) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      });

      editor.on("drop", function (event) {
        var media = readMediaTransfer(event.dataTransfer);
        if (!media || !media.url || !media.kind) return;
        event.preventDefault();
        // TinyMCE may also listen; stop further handling of this drop.
        event.stopPropagation();
        editor.insertContent(mediaHtml(media));
      });
    }
    return bound > 0;
  }

  function watchEditors() {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      var done = false;
      try {
        done = bindEditorDrops();
      } catch {
        done = false;
      }
      if (done || tries > 80) clearInterval(timer);
    }, 100);
  }

  function touchById(list, id) {
    for (const element of list) {
      if (element.identifier === id) return element;
    }
    return null;
  }

  function hasFiles(event) {
    return (
      Array.prototype.indexOf.call(event.dataTransfer.types, "Files") !== -1
    );
  }

  function init(root) {
    var form = root.closest("form");
    var idsInput = root.querySelector("[data-post-media-ids]");
    var coverInput = root.querySelector("[data-post-media-cover]");
    var grid = root.querySelector("[data-post-media-grid]");
    var count = root.querySelector("[data-post-media-count]");
    var status = root.querySelector("[data-post-media-status]");
    var dropzone = root.querySelector("[data-post-media-dropzone]");
    var fileInput = root.querySelector("[data-post-media-input]");
    var coverPreview = root.querySelector("[data-post-media-cover-preview]");
    var coverFileInput = root.querySelector("[data-post-media-cover-input]");
    var coverRemove = root.querySelector("[data-post-media-cover-remove]");
    var stateNode = root.querySelector("[data-post-media-state]");
    var uploadUrl = root.dataset.uploadUrl;
    var max = Number(root.dataset.max);
    var maxBytes = Number(root.dataset.maxBytes);
    var state = JSON.parse(
      root.querySelector("[data-post-media-initial]").textContent,
    );
    galleryItems = function () {
      return [...state.attachments];
    };
    var pending = 0;
    var errors = [];
    var dragIndex = null;

    function isCover(media) {
      return state.cover !== null && state.cover.id === media.id;
    }

    function setBusy() {
      if (!form) return;
      for (const node of form.querySelectorAll("[type=submit]")) {
        node.disabled = pending > 0;
      }
    }

    function renderStatus() {
      status.replaceChildren();
      if (pending > 0) {
        status.append(el("div", "text-secondary", "Загрузка: " + pending));
      }
      for (const message of errors) {
        status.append(el("div", "text-danger", message));
      }
    }

    function renderCover() {
      coverPreview.replaceChildren();
      if (state.cover === null) {
        coverPreview.append(el("span", "text-secondary", "Нет обложки"));
      } else {
        var img = el("img", "post-media-cover-image");
        img.src = state.cover.url;
        img.alt = "";
        coverPreview.append(img);
      }
      coverRemove.hidden = state.cover === null;
    }

    function moveAttachment(from, to) {
      if (to < 0 || to >= state.attachments.length || from === to) return;
      var moved = state.attachments.splice(from, 1)[0];
      state.attachments.splice(to, 0, moved);
      sync();
    }

    // Phones do not fire HTML5 drag events. A finger on the picture
    // reorders it; preventDefault stops that gesture from scrolling.
    var touchDrag = null;

    function clearDropTarget() {
      for (const node of grid.querySelectorAll(".is-drop-target")) {
        node.classList.remove("is-drop-target");
      }
    }

    function itemUnderPoint(x, y) {
      var node = document.elementFromPoint(x, y);
      var over = node && node.closest(".post-media-item");
      if (!over || !grid.contains(over)) return null;
      return over;
    }

    function bindTouchReorder(frame, item, index) {
      frame.addEventListener(
        "touchstart",
        function (event) {
          if (touchDrag || event.touches.length !== 1) return;
          var touch = event.touches[0];
          item.draggable = false;
          var drag = {
            id: touch.identifier,
            index: index,
            startX: touch.clientX,
            startY: touch.clientY,
            active: false,
          };

          function onMove(event) {
            var point = touchById(event.touches, drag.id);
            if (!point) return;
            if (event.cancelable) event.preventDefault();
            var dx = point.clientX - drag.startX;
            var dy = point.clientY - drag.startY;
            if (!drag.active) {
              if (dx * dx + dy * dy < 36) return;
              drag.active = true;
              item.classList.add("is-dragging", "is-touch-drag");
            }
            clearDropTarget();
            var over = itemUnderPoint(point.clientX, point.clientY);
            if (over && over !== item) over.classList.add("is-drop-target");
            if (point.clientY < 72) window.scrollBy(0, -14);
            else if (point.clientY > window.innerHeight - 72) {
              window.scrollBy(0, 14);
            }
          }

          function onEnd(event) {
            var point = touchById(event.changedTouches, drag.id);
            if (!point) return;
            document.removeEventListener("touchmove", onMove);
            document.removeEventListener("touchend", onEnd);
            document.removeEventListener("touchcancel", onEnd);
            var from = drag.index;
            var active = drag.active;
            var x = point.clientX;
            var y = point.clientY;
            item.classList.remove("is-dragging", "is-touch-drag");
            item.draggable = true;
            clearDropTarget();
            if (touchDrag === drag) touchDrag = null;
            if (!active) return;
            var over = itemUnderPoint(x, y);
            if (!over || over === item) return;
            moveAttachment(
              from,
              Array.prototype.indexOf.call(grid.children, over),
            );
          }

          touchDrag = drag;
          document.addEventListener("touchmove", onMove, { passive: false });
          document.addEventListener("touchend", onEnd);
          document.addEventListener("touchcancel", onEnd);
        },
        { passive: true },
      );
    }

    function renderGrid() {
      grid.replaceChildren();
      for (const [index, media] of state.attachments.entries()) {
        const item = el("div", "post-media-item");
        if (isCover(media)) item.classList.add("is-cover");
        item.draggable = true;
        item.title =
          "Перетащите в текст поста, чтобы вставить, или на другое вложение, чтобы изменить порядок";
        if (media.show_in_gallery === false) {
          item.classList.add("is-hidden-gallery");
        }
        var frame = el("div", "post-media-frame");
        frame.append(preview(media));
        if (media.kind === "video") {
          var play = el("span", "post-media-play");
          var playIcon = el("i", "fa fa-play");
          playIcon.setAttribute("aria-hidden", "true");
          play.append(playIcon);
          frame.append(play);
        }
        if (isCover(media)) {
          frame.append(el("span", "post-media-badge", "Обложка"));
        }
        var toggle = el("input", "post-media-gallery-toggle");
        toggle.type = "checkbox";
        toggle.checked = media.show_in_gallery !== false;
        toggle.title = "Показывать в галерее";
        toggle.setAttribute("aria-label", "Показывать в галерее");
        toggle.addEventListener("pointerdown", function (event) {
          event.stopPropagation();
          item.draggable = false;
        });
        toggle.addEventListener("pointerup", function () {
          item.draggable = true;
        });
        toggle.addEventListener("pointercancel", function () {
          item.draggable = true;
        });
        toggle.addEventListener(
          "touchstart",
          function (event) {
            event.stopPropagation();
          },
          { passive: true },
        );
        toggle.addEventListener("click", function (event) {
          event.stopPropagation();
        });
        toggle.addEventListener("change", function () {
          media.show_in_gallery = toggle.checked;
          sync();
        });
        frame.append(toggle);
        item.append(frame);
        bindTouchReorder(frame, item, index);

        var toolbar = el("div", "post-media-toolbar");
        var actions = el("div", "post-media-actions");
        if (media.kind === "image" && !isCover(media)) {
          actions.append(
            button("Обложка", "btn-secondary", function () {
              state.cover = media;
              sync();
            }),
          );
        }
        actions.append(
          button("В текст", "btn-secondary", function () {
            if (!globalThis.tinymce || !tinymce.activeEditor) {
              errors = ["Сначала кликните в поле содержания"];
              renderStatus();
              return;
            }
            tinymce.activeEditor.insertContent(mediaHtml(media));
          }),
        );
        var remove = button("✕", "btn-danger", function () {
          state.attachments.splice(index, 1);
          if (isCover(media)) state.cover = null;
          sync();
        });
        remove.title = "Удалить";
        remove.setAttribute("aria-label", "Удалить");
        actions.append(remove);
        toolbar.append(actions);
        item.append(toolbar);

        item.addEventListener("dragstart", function (event) {
          dragIndex = index;
          event.dataTransfer.effectAllowed = "copyMove";
          event.dataTransfer.setData("text/plain", String(index));
          event.dataTransfer.setData(MEDIA_MIME, JSON.stringify(media));
          event.dataTransfer.setData("text/html", mediaHtml(media));
          item.classList.add("is-dragging");
        });
        item.addEventListener("dragend", function () {
          dragIndex = null;
          item.classList.remove("is-dragging");
        });
        item.addEventListener("dragover", function (event) {
          if (dragIndex === null) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        });
        item.addEventListener("drop", function (event) {
          if (dragIndex === null) return;
          event.preventDefault();
          event.stopPropagation();
          var moved = state.attachments.splice(dragIndex, 1)[0];
          state.attachments.splice(index, 0, moved);
          dragIndex = null;
          sync();
        });
        grid.append(item);
      }
      count.textContent = state.attachments.length + " / " + max;
    }

    function sync() {
      idsInput.value = JSON.stringify(
        state.attachments.map(function (media) {
          return {
            id: media.id,
            show_in_gallery: media.show_in_gallery !== false,
          };
        }),
      );
      if (stateNode) {
        stateNode.textContent = JSON.stringify({
          attachments: state.attachments,
          cover: state.cover,
        });
      }
      coverInput.value = state.cover === null ? "" : String(state.cover.id);
      renderCover();
      renderGrid();
      renderStatus();
      setBusy();
    }

    function upload(file, purpose) {
      // Error JSON is read before response.ok, so the catch stays inside the then.
      /* eslint-disable promise/no-nesting */
      var body = new FormData();
      body.append("file", file);
      body.append("purpose", purpose);
      return fetch(uploadUrl, {
        method: "POST",
        body: body,
        credentials: "same-origin",
      }).then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!response.ok) {
              throw new Error(data.detail || "HTTP " + response.status);
            }
            return data;
          });
      });
      /* eslint-enable promise/no-nesting */
    }

    function tooLarge(file) {
      if (file.size <= maxBytes) return false;
      errors.push(
        file.name + ": файл больше " + Math.round(maxBytes / 1_048_576) + " МБ",
      );
      return true;
    }

    function addFiles(files) {
      errors = [];
      Array.prototype.forEach.call(files, function (file) {
        if (state.attachments.length + pending >= max) {
          errors.push(file.name + ": не больше " + max + " вложений");
          return;
        }
        if (tooLarge(file)) return;
        pending += 1;
        void upload(file, "attachment")
          .then(function (media) {
            state.attachments.push(media);
            return null;
          })
          .catch(function (error) {
            errors.push(file.name + ": " + error.message);
          })
          .finally(function () {
            pending -= 1;
            sync();
          });
      });
      sync();
    }

    fileInput.addEventListener("change", function () {
      addFiles(fileInput.files);
      fileInput.value = "";
    });

    dropzone.addEventListener("dragover", function (event) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("is-dragover");
    });
    dropzone.addEventListener("drop", function (event) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dropzone.classList.remove("is-dragover");
      addFiles(event.dataTransfer.files);
    });

    coverFileInput.addEventListener("change", function () {
      var file = coverFileInput.files[0];
      coverFileInput.value = "";
      if (!file) return;
      errors = [];
      if (tooLarge(file)) {
        sync();
        return;
      }
      pending += 1;
      sync();
      void upload(file, "cover")
        .then(function (media) {
          state.cover = media;
          return null;
        })
        .catch(function (error) {
          errors.push(file.name + ": " + error.message);
        })
        .finally(function () {
          pending -= 1;
          sync();
        });
    });

    coverRemove.addEventListener("click", function () {
      state.cover = null;
      sync();
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        if (pending > 0) event.preventDefault();
      });
    }

    sync();
    watchEditors();
  }

  registerGalleryPlugin();

  document.addEventListener("DOMContentLoaded", function () {
    for (const root of document.querySelectorAll("[data-post-media]")) {
      init(root);
    }
  });
})();
