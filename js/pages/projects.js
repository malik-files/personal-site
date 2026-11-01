import { listProjects } from "../api/projects.js";
import { getSite } from "../api/site.js";
import { escapeHtml } from "../ui/escape.js";
import { mountLayout } from "../ui/layout.js";

function projectCard(project) {
  const tags = (project.tags || [])
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="project-card">
      <h2><a href="${escapeHtml(project.url)}" rel="noreferrer" target="_blank">${escapeHtml(project.title)}</a></h2>
      <p>${escapeHtml(project.description)}</p>
      <div class="tags">${tags}</div>
    </article>
  `;
}

const root = document.querySelector("[data-page='projects']");

try {
  const [site, { projects }] = await Promise.all([getSite(), listProjects()]);
  mountLayout({ current: "projects", name: site.name, githubUrl: site.githubUrl });

  root.innerHTML = `
    <div class="page-head">
      <h1>Projects</h1>
      <p class="muted">Selected work. Links go to GitHub.</p>
    </div>
    <div class="project-list">
      ${projects.map(projectCard).join("")}
    </div>
  `;
} catch (error) {
  root.innerHTML =
    `<p class="empty">Could not load projects. Start the local server with <code>python3 server.py</code>.</p>`;
  console.error(error);
}
