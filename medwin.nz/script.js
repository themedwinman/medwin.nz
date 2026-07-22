(() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------------------------------------
       Footer year
       ------------------------------------------------------- */
    document.querySelectorAll(".js-year").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });

    /* -------------------------------------------------------
       Hero prompt — type a single word once, then settle
       (reduced-motion / no-JS: full text is already in the DOM)
       ------------------------------------------------------- */
    const typed = document.querySelector(".hero-typed");
    if (typed && !prefersReducedMotion) {
      const full = (typed.textContent || "").trim();
      const prompt = typed.closest(".hero-prompt");
      typed.textContent = "";
      prompt?.classList.add("is-typing");
      let i = 0;
      const step = () => {
        i += 1;
        typed.textContent = full.slice(0, i);
        if (i < full.length) {
          setTimeout(step, 85);
        } else {
          // let the caret blink briefly, then hand off to the title caret
          setTimeout(() => prompt?.classList.remove("is-typing"), 1400);
        }
      };
      setTimeout(step, 480);
    }

    /* -------------------------------------------------------
       Nav: stuck-on-scroll + mobile toggle
       ------------------------------------------------------- */
    const nav = document.getElementById("nav");
    const navToggle = document.getElementById("nav-toggle");
    const navLinksEl = document.getElementById("nav-links");
    const navLinks = Array.from(document.querySelectorAll(".nav-link[data-target]"));

    const updateNavStuck = () => {
      if (!nav) return;
      nav.classList.toggle("is-stuck", window.scrollY > 24);
    };
    updateNavStuck();
    window.addEventListener("scroll", updateNavStuck, { passive: true });

    if (navToggle && navLinksEl) {
      const closeMenu = () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      };

      navToggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });

      navLinksEl.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeMenu();
      });
    }

    /* -------------------------------------------------------
       Smooth-scroll for in-page anchors with sticky-nav offset
       ------------------------------------------------------- */
    document.addEventListener("click", (e) => {
      const link = e.target.closest?.('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href === "#" || href === "#top") {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
        return;
      }
      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      const navHeight = nav?.offsetHeight ?? 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    /* -------------------------------------------------------
       Active section observer
       ------------------------------------------------------- */
    const sections = navLinks
      .map((link) => document.getElementById(link.dataset.target))
      .filter(Boolean);

    if (sections.length) {
      const visibility = new Map();
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visibility.set(entry.target.id, entry.intersectionRatio);
          });
          let bestId = null;
          let bestRatio = 0;
          visibility.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });
          if (bestId) {
            navLinks.forEach((link) => {
              link.classList.toggle("is-active", link.dataset.target === bestId);
            });
          }
        },
        {
          rootMargin: "-30% 0px -50% 0px",
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        }
      );

      sections.forEach((s) => sectionObserver.observe(s));
    }

    /* -------------------------------------------------------
       Reveal-on-scroll
       ------------------------------------------------------- */
    const revealEls = document.querySelectorAll(".reveal, .reveal-children");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    /* -------------------------------------------------------
       Project modal
       ------------------------------------------------------- */
    const overlay = document.getElementById("project-overlay");
    const modalTitle = document.getElementById("project-modal-title");
    const modalBody = document.getElementById("project-modal-body");
    const modalClose = document.getElementById("project-modal-close");

    if (overlay && modalTitle && modalBody && modalClose) {
      let lastFocusedEl = null;
      let prevBodyOverflow = "";

      const openProject = (card) => {
        lastFocusedEl = document.activeElement;
        prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const title = card.querySelector("h3")?.textContent?.trim() ?? "Project";
        const detailsEl = card.querySelector(".project-details");
        const detailsHtml = detailsEl?.innerHTML ?? "<p>Coming soon.</p>";

        modalTitle.textContent = title;
        modalBody.innerHTML = detailsHtml;

        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        modalClose.focus();
      };

      const closeProject = () => {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = prevBodyOverflow;
        if (lastFocusedEl?.focus) lastFocusedEl.focus();
      };

      // Delegated so cards rendered later by projects-data.js also open the modal.
      document.addEventListener("click", (e) => {
        const card = e.target.closest?.(".project-card.project-expand");
        if (card) openProject(card);
      });

      modalClose.addEventListener("click", closeProject);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeProject();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) closeProject();
      });
    }
  });
})();
