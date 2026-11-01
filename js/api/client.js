import { config } from "../config.js";

function url(path) {
  return `${config.apiBase}${path}`;
}

async function parse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export async function getJson(path) {
  const response = await fetch(url(path), { headers: { Accept: "application/json" } });
  return parse(response);
}

export async function postForm(path, formData) {
  const response = await fetch(url(path), {
    method: "POST",
    body: formData,
  });
  return parse(response);
}
