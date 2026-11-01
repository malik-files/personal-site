import { getJson, postForm } from "./client.js";

export function listPhotos() {
  return getJson("/api/photos");
}

export function uploadPhoto({ file, title, caption }) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  form.append("caption", caption);
  return postForm("/api/photos", form);
}
