(() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const isCoarsePointer =
    window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false;

  /* ---------------------------------------------------------
     Page load veil
     --------------------------------------------------------- */
  const lift = () => {
    requestAnimationFrame(() => {
      document.body.classList.add("is-loaded");
      const veil = document.getElementById("page-veil");
      if (veil) {
        setTimeout(() => veil.classList.add("is-gone"), prefersReducedMotion ? 0 : 480);
      }
    });
  };

  if (document.readyState === "complete") {
    lift();
  } else {
    window.addEventListener("load", lift, { once: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------------------------------------
       Footer year
       ------------------------------------------------------- */
    document.querySelectorAll(".js-year").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });

    /* -------------------------------------------------------
       Hero title — staggered character reveal
       ------------------------------------------------------- */
    const splitTitle = (el) => {
      if (!el || prefersReducedMotion) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);

      let charIndex = 0;
      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue;
        if (!text || !text.trim()) return;

        const frag = document.createDocumentFragment();
        const words = text.split(/(\s+)/);

        words.forEach((word) => {
          if (!word) return;
          if (/^\s+$/.test(word)) {
            frag.appendChild(document.createTextNode(word));
            return;
          }
          const wordSpan = document.createElement("span");
          wordSpan.className = "word";
          [...word].forEach((ch) => {
            const charSpan = document.createElement("span");
            charSpan.className = "char";
            charSpan.textContent = ch;
            charSpan.style.animationDelay = `${charIndex * 38 + 220}ms`;
            wordSpan.appendChild(charSpan);
            charIndex += 1;
          });
          frag.appendChild(wordSpan);
        });

        textNode.parentNode.replaceChild(frag, textNode);
      });
    };

    splitTitle(document.querySelector("[data-stagger]"));

    /* -------------------------------------------------------
       Custom cursor
       ------------------------------------------------------- */
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");

    if (dot && ring && !isCoarsePointer) {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let ringX = mouseX;
      let ringY = mouseY;
      let raf;

      const tick = () => {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        raf = requestAnimationFrame(tick);
      };
      tick();

      document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      document.addEventListener("mouseleave", () => {
        dot.classList.add("is-hidden");
        ring.classList.add("is-hidden");
      });

      document.addEventListener("mouseenter", () => {
        dot.classList.remove("is-hidden");
        ring.classList.remove("is-hidden");
      });

      const hoverSelector = 'a, button, [data-cursor="hover"], summary, .project-card';
      document.addEventListener("mouseover", (e) => {
        if (e.target.closest?.(hoverSelector)) {
          dot.classList.add("is-hover");
          ring.classList.add("is-hover");
        }
      });
      document.addEventListener("mouseout", (e) => {
        if (e.target.closest?.(hoverSelector)) {
          dot.classList.remove("is-hover");
          ring.classList.remove("is-hover");
        }
      });
    } else if (dot && ring) {
      dot.style.display = "none";
      ring.style.display = "none";
    }

    /* -------------------------------------------------------
       Nav: stuck-on-scroll + active section + mobile toggle
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

      document.querySelectorAll(".project-card.project-expand").forEach((card) => {
        card.addEventListener("click", () => openProject(card));
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
