import { getJson } from "./client.js";

export function listProjects() {
  return getJson("/api/projects");
}
