import { escapeHtml } from "./escape.js";

const NAV = [
  { href: "/", id: "home", label: "About" },
  { href: "/photographs.html", id: "photographs", label: "Photographs" },
  { href: "/projects.html", id: "projects", label: "Projects" },
];

function nav(current) {
  return NAV.map((item) => {
    const currentAttr = item.id === current ? ' aria-current="page"' : "";
    return `<a href="${item.href}"${currentAttr}>${item.label}</a>`;
  }).join("");
}

export function mountLayout({ current, name = "Your Name", githubUrl = "https://github.com/your-username" }) {
  document.documentElement.dataset.page = current;
  document.body.dataset.page = current;

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="wordmark" href="/">${escapeHtml(name)}</a>
    <nav class="nav" aria-label="Primary">${nav(current)}</nav>
    <a class="github-link" href="${escapeHtml(githubUrl)}" rel="noreferrer" target="_blank">GitHub</a>
  `;

  document.body.prepend(header);
}
