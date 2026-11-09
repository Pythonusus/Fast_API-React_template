// Post gallery + cover editor for PostMediaField.
// Files upload immediately; the form submits only ids (hidden inputs).
(function () {
  "use strict";

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
    audio.appendChild(el("span", "post-media-name", "♪ " + media.filename));
    return audio;
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
    var uploadUrl = root.dataset.uploadUrl;
    var max = Number(root.dataset.max);
    var maxBytes = Number(root.dataset.maxBytes);
    var state = JSON.parse(
      root.querySelector("[data-post-media-initial]").textContent,
    );
    var pending = 0;
    var errors = [];
    var dragIndex = null;

    function isCover(media) {
      return state.cover !== null && state.cover.id === media.id;
    }

    function setBusy() {
      if (!form) return;
      form.querySelectorAll("[type=submit]").forEach(function (node) {
        node.disabled = pending > 0;
      });
    }

    function renderStatus() {
      status.replaceChildren();
      if (pending > 0) {
        status.appendChild(el("div", "text-secondary", "Загрузка: " + pending));
      }
      errors.forEach(function (message) {
        status.appendChild(el("div", "text-danger", message));
      });
    }

    function renderCover() {
      coverPreview.replaceChildren();
      if (state.cover === null) {
        coverPreview.appendChild(el("span", "text-secondary", "Нет обложки"));
      } else {
        var img = el("img", "post-media-cover-image");
        img.src = state.cover.url;
        img.alt = "";
        coverPreview.appendChild(img);
      }
      coverRemove.hidden = state.cover === null;
    }

    function renderGrid() {
      grid.replaceChildren();
      state.attachments.forEach(function (media, index) {
        var item = el("div", "post-media-item");
        if (isCover(media)) item.classList.add("is-cover");
        item.draggable = true;
        item.appendChild(preview(media));
        if (isCover(media)) {
          item.appendChild(el("span", "post-media-badge", "Обложка"));
        }

        var actions = el("div", "post-media-actions");
        if (media.kind === "image" && !isCover(media)) {
          actions.appendChild(
            button("Обложка", "btn-light", function () {
              state.cover = media;
              sync();
            }),
          );
        }
        actions.appendChild(
          button("✕", "btn-danger", function () {
            state.attachments.splice(index, 1);
            if (isCover(media)) state.cover = null;
            sync();
          }),
        );
        item.appendChild(actions);

        item.addEventListener("dragstart", function (event) {
          dragIndex = index;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(index));
        });
        item.addEventListener("dragend", function () {
          dragIndex = null;
        });
        item.addEventListener("dragover", function (event) {
          if (dragIndex === null) return;
          event.preventDefault();
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
        grid.appendChild(item);
      });
      count.textContent = state.attachments.length + " / " + max;
    }

    function sync() {
      idsInput.value = JSON.stringify(
        state.attachments.map(function (media) {
          return media.id;
        }),
      );
      coverInput.value = state.cover === null ? "" : String(state.cover.id);
      renderCover();
      renderGrid();
      renderStatus();
      setBusy();
    }

    function upload(file, purpose) {
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
    }

    function tooLarge(file) {
      if (file.size <= maxBytes) return false;
      errors.push(file.name + ": файл больше " + Math.round(maxBytes / 1048576) + " МБ");
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
        upload(file, "attachment")
          .then(function (media) {
            state.attachments.push(media);
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

    function hasFiles(event) {
      return Array.prototype.indexOf.call(event.dataTransfer.types, "Files") !== -1;
    }

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
      upload(file, "cover")
        .then(function (media) {
          state.cover = media;
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
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-post-media]").forEach(init);
  });
})();
