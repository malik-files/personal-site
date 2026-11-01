import { getJson } from "./client.js";

export function getSite() {
  return getJson("/api/site");
}
