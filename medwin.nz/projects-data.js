// Data-driven project grids.
//
// Reads projects from Supabase and renders the same .project-card markup the
// site already uses, so the existing modal + styles just work. Progressive
// enhancement: the HTML ships with static fallback cards, and we only replace
// them once a fetch succeeds — so no-JS, a CDN hiccup, or a paused database
// still leaves visitors with real content.
//
// A grid opts in with a data attribute:
//   data-projects-grid="featured"  → homepage: render only featured projects
//   data-projects-grid="all"       → projects page: render every visible one
import { supabase } from "./supabase.js";

const pad = (n) => String(n).padStart(2, "0");

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

// Only allow safe link schemes — blocks javascript:/data: URLs even if one
// somehow ends up in the data.
function safeUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function normaliseTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through to comma-splitting */
    }
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

// Build a .project-card button matching the hand-written markup in index.html.
// `index` drives the "Project 0N" label; `featured` applies the split layout.
export function renderCard(project, index, { featured = false } = {}) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "project-card project-expand" + (featured ? " project-card--featured" : "");
  card.setAttribute("aria-haspopup", "dialog");
  card.setAttribute("aria-controls", "project-modal");
  card.setAttribute("aria-label", `Open project details for ${project.title}`);

  const cta = el("span", "project-card-cta");
  cta.setAttribute("aria-hidden", "true");
  card.appendChild(cta);

  if (project.image_url) {
    const media = el("div", "project-card-media");
    const img = document.createElement("img");
    img.src = project.image_url;
    img.alt = "";
    img.loading = "lazy";
    media.appendChild(img);
    card.appendChild(media);
  }

  const inner = el("div", "project-card-inner");
  const numLabel =
    `Project ${pad(index + 1)}` + (project.category ? ` · ${project.category}` : "");
  inner.appendChild(el("span", "project-card-num", numLabel));
  inner.appendChild(el("h3", null, project.title));
  if (project.description) inner.appendChild(el("p", null, project.description));

  const tags = normaliseTags(project.tags);
  if (tags.length) {
    const tagWrap = el("div", "project-card-tags");
    tags.forEach((t) => tagWrap.appendChild(el("span", "tag", t)));
    inner.appendChild(tagWrap);
  }
  card.appendChild(inner);

  // Hidden block the modal reads (script.js copies .project-details innerHTML).
  // `body` is admin-authored HTML (only an authenticated admin can write it),
  // so it is trusted; everything else is escaped.
  const details = el("div", "project-details");
  details.hidden = true;
  let html = "";
  if (project.image_url) {
    html += `<img class="project-modal-media" src="${escapeHtml(project.image_url)}" alt="" />`;
  }
  html +=
    project.body ||
    (project.description ? `<p>${escapeHtml(project.description)}</p>` : "<p>Coming soon.</p>");
  const link = project.link ? safeUrl(project.link) : null;
  if (link && !/<a[\s>]/i.test(project.body || "")) {
    html += `<p><a href="${escapeHtml(link)}" target="_blank" rel="noopener">Visit project &#8599;</a></p>`;
  }
  details.innerHTML = html;
  card.appendChild(details);

  return card;
}

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("visible", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function mount(grid, projects, onlyFeatured) {
  const list = onlyFeatured ? projects.filter((p) => p.featured) : projects;
  if (!list.length) return; // nothing to show → leave the static fallback in place
  grid.replaceChildren(...list.map((p, i) => renderCard(p, i, { featured: onlyFeatured && i === 0 })));
  // If the reveal-on-scroll observer already ran, its .is-visible stays on the
  // grid and the CSS shows the fresh children; if not, the observer reveals
  // them on scroll as usual. Either way they animate in.
}

(async () => {
  const grid = document.querySelector("[data-projects-grid]");
  if (!grid) return;
  const onlyFeatured = grid.dataset.projectsGrid === "featured";
  try {
    const projects = await fetchProjects();
    mount(grid, projects, onlyFeatured);
  } catch (err) {
    console.warn("[projects] keeping static fallback cards:", err?.message || err);
  }
})();
