import { listPhotos, uploadPhoto } from "../api/photos.js";
import { getSite } from "../api/site.js";
import { escapeHtml } from "../ui/escape.js";
import { mountLayout } from "../ui/layout.js";

const root = document.querySelector("[data-page='photographs']");

function photoCard(photo) {
  return `
    <button class="photo-card" type="button" data-photo-id="${photo.id}">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || "Photograph")}">
      <div class="photo-meta">
        <strong>${escapeHtml(photo.title || "Untitled")}</strong>
        <p>${escapeHtml(photo.caption || "")}</p>
      </div>
    </button>
  `;
}

function renderGallery(photos) {
  const gallery = root.querySelector("[data-gallery]");
  if (!photos.length) {
    gallery.innerHTML = `<p class="empty">No photographs yet. Upload one above.</p>`;
    return;
  }
  gallery.innerHTML = `<div class="gallery">${photos.map(photoCard).join("")}</div>`;
}

function openLightbox(photo) {
  const dialog = root.querySelector("[data-lightbox]");
  dialog.innerHTML = `
    <figure>
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || "Photograph")}">
      <figcaption>${escapeHtml(photo.title || "Untitled")}${photo.caption ? ` — ${escapeHtml(photo.caption)}` : ""}</figcaption>
    </figure>
  `;
  dialog.showModal();
}

async function refresh() {
  const { photos } = await listPhotos();
  renderGallery(photos);
  return photos;
}

function wireGallery(getPhotos) {
  root.querySelector("[data-gallery]").addEventListener("click", (event) => {
    const button = event.target.closest("[data-photo-id]");
    if (!button) return;
    const photo = getPhotos().find((item) => item.id === button.dataset.photoId);
    if (photo) openLightbox(photo);
  });

  root.querySelector("[data-lightbox]").addEventListener("click", (event) => {
    if (event.target.tagName === "DIALOG") event.target.close();
  });
}

function wireUpload(onChange) {
  const form = root.querySelector("[data-upload-form]");
  const status = root.querySelector("[data-status]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) {
      status.textContent = "Choose an image to upload.";
      return;
    }

    status.textContent = "Uploading…";
    try {
      await uploadPhoto({
        file,
        title: String(data.get("title") || ""),
        caption: String(data.get("caption") || ""),
      });
      form.reset();
      status.textContent = "Uploaded.";
      await onChange();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

try {
  const site = await getSite();
  mountLayout({ current: "photographs", name: site.name, githubUrl: site.githubUrl });

  root.innerHTML = `
    <div class="page-head">
      <h1>Photographs</h1>
      <p class="muted">Placeholder captions until you replace them.</p>
    </div>
    <section class="upload" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Upload</h2>
      <form data-upload-form>
        <label>
          <span class="visually-hidden">Image file</span>
          <input type="file" name="file" accept="image/*" required>
        </label>
        <label>
          <span class="visually-hidden">Title</span>
          <input type="text" name="title" placeholder="Title">
        </label>
        <label>
          <span class="visually-hidden">Caption</span>
          <textarea name="caption" placeholder="Caption"></textarea>
        </label>
        <button type="submit">Add photograph</button>
        <p class="status" data-status></p>
      </form>
    </section>
    <div data-gallery></div>
    <dialog class="lightbox" data-lightbox></dialog>
  `;

  let photos = [];
  const reload = async () => {
    photos = await refresh();
  };
  wireGallery(() => photos);
  wireUpload(reload);
  await reload();
} catch (error) {
  root.innerHTML =
    `<p class="empty">Could not load photographs. Start the local server with <code>python3 server.py</code>.</p>`;
  console.error(error);
}
