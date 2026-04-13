document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  document.querySelectorAll(".js-year").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const isStoryPage = document.body.classList.contains("story-page");

  // Legacy nav highlighting for multi-page files still in the repo.
  if (!isStoryPage) {
    const filename = (() => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "index.html";
    })();

    document.querySelectorAll("a[data-page]").forEach((link) => {
      const page = link.getAttribute("data-page");
      const isActive = page === filename;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  if (isStoryPage) {
    const scrollRoot = document.querySelector(".story-scroll");
    const chapterDots = Array.from(document.querySelectorAll(".rail-dot[data-target]"));
    const mobileQuickLinks = Array.from(document.querySelectorAll(".mobile-quick-link[data-target]"));
    const chapterJumps = [...chapterDots, ...mobileQuickLinks];
    const chapters = Array.from(document.querySelectorAll(".chapter[id]"));
    const backToTop = document.getElementById("back-to-top");
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const updateBackToTop = (chapterId) => {
      if (!backToTop) return;
      const showButton = chapterId && chapterId !== "intro";
      backToTop.classList.toggle("is-visible", Boolean(showButton));
      backToTop.setAttribute("aria-hidden", showButton ? "false" : "true");
      backToTop.tabIndex = showButton ? 0 : -1;
    };

    const setActiveChapter = (chapterId) => {
      chapterJumps.forEach((jump) => {
        const isActive = jump.getAttribute("data-target") === chapterId;
        jump.classList.toggle("is-active", isActive);
        if (isActive) jump.setAttribute("aria-current", "true");
        else jump.removeAttribute("aria-current");
      });

      updateBackToTop(chapterId);
    };

    const updateHash = (id) => {
      try {
        history.replaceState(null, "", `#${id}`);
      } catch {
        // Ignore hash update errors.
      }
    };

    const scrollToChapter = (id, behavior = "smooth") => {
      const target = document.getElementById(id);
      if (!target) return;

      const effectiveBehavior =
        prefersReducedMotion && behavior === "smooth" ? "auto" : behavior;

      if (scrollRoot) {
        const rootRect = scrollRoot.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const targetTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 8;
        scrollRoot.scrollTo({ top: Math.max(0, targetTop), behavior: effectiveBehavior });
      } else {
        target.scrollIntoView({ behavior: effectiveBehavior, block: "start" });
      }

      setActiveChapter(id);
      updateHash(id);
    };

    chapterJumps.forEach((jump) => {
      jump.addEventListener("click", (event) => {
        const targetId = jump.getAttribute("data-target");
        if (!targetId) return;
        event.preventDefault();
        event.stopPropagation();
        scrollToChapter(targetId, "smooth");
      });
    });

    if (backToTop) {
      backToTop.addEventListener("click", () => {
        scrollToChapter("intro", "smooth");
      });
    }

    // Handle all in-page hash links inside the story layout.
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      if (href === "#") return;

      const id = decodeURIComponent(href.slice(1));
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      scrollToChapter(id, "smooth");
    });

    // Reveal animation on section entry.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        root: scrollRoot ?? null,
        threshold: 0.26,
      }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      revealObserver.observe(el);
    });

    // Update active chapter using whichever section is most visible.
    const chapterVisibility = new Map();
    const chapterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          chapterVisibility.set(entry.target.id, entry.intersectionRatio);
        });

        let bestId = null;
        let bestRatio = 0;
        chapterVisibility.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) {
          setActiveChapter(bestId);
          updateHash(bestId);
        }
      },
      {
        root: scrollRoot ?? null,
        threshold: [0.28, 0.42, 0.56, 0.7],
      }
    );

    chapters.forEach((chapter) => chapterObserver.observe(chapter));

    // Initial chapter state.
    const initial = (window.location.hash || "").replace("#", "");
    if (initial && document.getElementById(initial)) {
      scrollToChapter(initial, "auto");
    } else if (chapters[0]) {
      setActiveChapter(chapters[0].id);
    }
  }

  // Keep legacy flip-card behavior for cocktails.html.
  document.querySelectorAll(".flip-card").forEach((btn) => {
    btn.setAttribute("role", btn.getAttribute("role") ?? "button");
    if (!btn.hasAttribute("data-flipped")) btn.setAttribute("data-flipped", "false");
    if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    const btn = event.target?.closest?.(".flip-card");
    if (!btn) return;

    const flipped = btn.getAttribute("data-flipped") === "true";
    const next = !flipped;
    btn.setAttribute("data-flipped", String(next));
    btn.setAttribute("aria-expanded", String(next));
  });

  // Projects modal (used in the story page projects chapter).
  const projectOverlay = document.getElementById("project-overlay");
  const projectModalTitle = document.getElementById("project-modal-title");
  const projectModalBody = document.getElementById("project-modal-body");
  const projectClose = document.getElementById("project-modal-close");

  if (projectOverlay && projectModalTitle && projectModalBody && projectClose) {
    let lastFocusedEl = null;
    let prevBodyOverflow = "";
    let prevStoryOverflow = "";
    const storyScroll = document.querySelector(".story-scroll");

    const openProject = (card) => {
      lastFocusedEl = document.activeElement;
      prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      if (storyScroll) {
        prevStoryOverflow = storyScroll.style.overflowY;
        storyScroll.style.overflowY = "hidden";
      }

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

      if (storyScroll) {
        storyScroll.style.overflowY = prevStoryOverflow;
      }

      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus();
      }
    };

    document.querySelectorAll(".project-card.project-expand").forEach((card) => {
      card.addEventListener("click", () => openProject(card));
    });

    projectClose.addEventListener("click", closeProject);

    projectOverlay.addEventListener("click", (event) => {
      if (event.target === projectOverlay) closeProject();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && projectOverlay.classList.contains("is-open")) {
        closeProject();
      }
    });
  }
});
