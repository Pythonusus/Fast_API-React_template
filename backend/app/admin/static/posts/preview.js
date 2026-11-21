// Opens the real post page so admin preview uses that route.
// The draft is stored in localStorage. The key prefix matches
// frontend/app/utils/post-preview.ts.
(function () {
  "use strict";

  var STORAGE_PREFIX = "app-post-preview:";

  function readJson(node) {
    if (!node || !node.textContent || !node.textContent.trim()) return null;
    try {
      return JSON.parse(node.textContent);
    } catch {
      return null;
    }
  }

  function mediaPayload(media) {
    return {
      id: media.id,
      kind: media.kind,
      content_type: media.content_type || "application/octet-stream",
      filename: media.filename || "",
      url: media.url,
    };
  }

  function galleryItems(state) {
    var coverId = state.cover && state.cover.id;
    return (state.attachments || [])
      .filter(function (media) {
        if (media.show_in_gallery === false) return false;
        return !(coverId && media.id === coverId);
      })
      .map(function (media) {
        return mediaPayload(media);
      });
  }

  function editorHtml() {
    if (!globalThis.tinymce || typeof tinymce.get !== "function") return null;
    var named = tinymce.get("content");
    if (named && named.getContent) return named.getContent();
    var editors = tinymce.get();
    if (Array.isArray(editors) && editors[0] && editors[0].getContent) {
      return editors[0].getContent();
    }
    if (tinymce.activeEditor && tinymce.activeEditor.getContent) {
      return tinymce.activeEditor.getContent();
    }
    return null;
  }

  function stampAudioNames(html, state) {
    var names = {};
    for (const media of state.attachments || []) {
      if (media && media.url && media.filename)
        names[media.url] = media.filename;
    }
    if (state.cover && state.cover.url && state.cover.filename) {
      names[state.cover.url] = state.cover.filename;
    }
    return html.replaceAll(/<audio\b[^>]*>/gi, function (tag) {
      if (/data-filename\s*=/i.test(tag)) return tag;
      var srcMatch = /src\s*=\s*"([^"]*)"/i.exec(tag);
      var filename = srcMatch && names[srcMatch[1]];
      if (!filename) return tag;
      var safe = String(filename)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;");
      return tag.replace(/<audio/i, '<audio data-filename="' + safe + '"');
    });
  }

  function fromForm() {
    var titleInput = document.querySelector('input[name="title"]');
    var galleryInput = document.querySelector('input[name="show_gallery"]');
    var state = readJson(document.querySelector("[data-post-media-state]")) ||
      readJson(document.querySelector("[data-post-media-initial]")) || {
        attachments: [],
        cover: null,
      };
    var area = document.querySelector('textarea[name="content"]');
    var now = new Date().toISOString();
    return {
      id: 0,
      title: titleInput ? titleInput.value : "",
      content: stampAudioNames(editorHtml() || (area ? area.value : ""), state),
      created_at: now,
      updated_at: now,
      show_gallery: galleryInput ? galleryInput.checked : true,
      cover: state.cover ? mediaPayload(state.cover) : null,
      media: galleryItems(state),
    };
  }

  function openPreview() {
    var payload = document.querySelector("[data-post-media]")
      ? fromForm()
      : readJson(document.querySelector("[data-post-preview-saved]"));
    if (!payload) return;
    var draft = String(Date.now());
    localStorage.setItem(STORAGE_PREFIX + draft, JSON.stringify(payload));
    var postId = payload.id > 0 ? String(payload.id) : "0";
    window.open(
      "/posts/" +
        encodeURIComponent(postId) +
        "?draft=" +
        encodeURIComponent(draft),
      "_blank",
      "noopener",
    );
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-post-preview-open]");
    if (!button) return;
    event.preventDefault();
    openPreview();
  });
})();
