import { getSite } from "../api/site.js";
import { escapeHtml } from "../ui/escape.js";
import { mountLayout } from "../ui/layout.js";

function render(site) {
  mountLayout({ current: "home", name: site.name, githubUrl: site.githubUrl });

  const root = document.querySelector("[data-page='home']");
  const paragraphs = site.about.map((text) => `<p>${escapeHtml(text)}</p>`).join("");

  root.innerHTML = `
    <section class="hero">
      <h1>${escapeHtml(site.name)}</h1>
      <p class="muted">${escapeHtml(site.tagline)}</p>
      ${paragraphs}
      <div class="hero-links">
        <a href="/photographs.html">Photographs</a>
        <a href="/projects.html">Projects</a>
        <a href="${escapeHtml(site.githubUrl)}" rel="noreferrer" target="_blank">GitHub</a>
      </div>
    </section>
  `;
}

try {
  render(await getSite());
} catch (error) {
  document.querySelector("[data-page='home']").innerHTML =
    `<p class="empty">Could not load site content. Start the local server with <code>python3 server.py</code>.</p>`;
  console.error(error);
}
