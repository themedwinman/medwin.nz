document.addEventListener("DOMContentLoaded", () => {
  // Scroll story: reveal sections as they enter view
  const revealEls = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.2 }
    );
    revealEls.forEach((el) => io.observe(el));
    requestAnimationFrame(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      revealEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 32) el.classList.add("is-visible");
      });
    });
  }

  // Active nav link highlighting
  const filename = (() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "index.html";
  })();

  document.querySelectorAll('a[data-page]').forEach((link) => {
    const page = link.getAttribute("data-page");
    const isActive = page === filename;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Footer year
  document.querySelectorAll(".js-year").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const toggleFlipCard = (card) => {
    const flipped = card.getAttribute("data-flipped") === "true";
    const next = !flipped;
    card.setAttribute("data-flipped", String(next));
    card.setAttribute("aria-expanded", String(next));
  };

  document.querySelectorAll(".flip-card").forEach((card) => {
    if (!card.hasAttribute("role")) card.setAttribute("role", "button");
    if (!card.hasAttribute("data-flipped")) card.setAttribute("data-flipped", "false");
    if (!card.hasAttribute("aria-expanded")) card.setAttribute("aria-expanded", "false");
    if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
  });

  document.addEventListener("click", (e) => {
    const card = e.target?.closest?.(".flip-card");
    if (!card) return;
    toggleFlipCard(card);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target?.closest?.(".flip-card");
    if (!card || document.activeElement !== card) return;
    e.preventDefault();
    toggleFlipCard(card);
  });

  // Projects modal (fullscreen-ish details)
  const projectOverlay = document.getElementById("project-overlay");
  const projectModalTitle = document.getElementById("project-modal-title");
  const projectModalBody = document.getElementById("project-modal-body");
  const projectClose = document.getElementById("project-modal-close");

  if (projectOverlay && projectModalTitle && projectModalBody && projectClose) {
    let lastFocusedEl = null;
    let prevBodyOverflow = "";

    const openProject = (card) => {
      lastFocusedEl = document.activeElement;
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const title = card.querySelector("h3")?.textContent?.trim() ?? "Project";
      const detailsEl = card.querySelector(".project-details");
      const detailsHtml = detailsEl?.innerHTML ?? "<p>Coming soon.</p>";

      projectModalTitle.textContent = title;
      projectModalBody.innerHTML = detailsHtml;

      projectOverlay.classList.add("is-open");
      projectOverlay.setAttribute("aria-hidden", "false");

      projectClose.focus();
    };

    const closeProject = () => {
      projectOverlay.classList.remove("is-open");
      projectOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = prevBodyOverflow;

      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus();
      }
    };

    document.querySelectorAll(".project-card.project-expand").forEach((card) => {
      card.addEventListener("click", () => openProject(card));
    });

    projectClose.addEventListener("click", closeProject);

    projectOverlay.addEventListener("click", (e) => {
      if (e.target === projectOverlay) closeProject();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && projectOverlay.classList.contains("is-open")) {
        closeProject();
      }
    });
  }
});

