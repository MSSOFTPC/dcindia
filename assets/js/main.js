// Drive Chambers India (DCI) - Shared UI, Navigation, Scroll Effects, Form Validation & Dialog Utilities

(function () {
  // 1. Progressive enhancement polyfill for Popover API if needed
  if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js";
    s.defer = true;
    document.head.appendChild(s);
  }

  // 2. Dialog closedby="any" fallback for browsers without native closedBy
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    document.addEventListener("DOMContentLoaded", () => {
      for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener("pointerdown", (e) => {
          pressedOutside = outside(e, dialog);
        });
        dialog.addEventListener("pointerup", (e) => {
          if (pressedOutside && outside(e, dialog)) dialog.close();
        });
      }
    });
  }

  // 3. Scroll Progress Indicator & Scroll Reveal Fallbacks (modern CSS scroll()/view() first)
  function initScrollEffects() {
    const bar = document.createElement("div");
    bar.id = "dci-scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);

    const noReducedMotion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!noReducedMotion) return;

    if (!CSS.supports("animation-timeline", "scroll()")) {
      const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        bar.style.transform = `scaleX(${pct})`;
      };
      window.addEventListener("scroll", updateProgress, { passive: true });
      updateProgress();
    }

    if (!CSS.supports("(animation-timeline: view()) and (animation-range: entry)")) {
      const cards = document.querySelectorAll(".reveal-card");
      if (cards.length) {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const r = entry.intersectionRatio;
              entry.target.style.opacity = String(0.35 + r * 0.65);
              entry.target.style.transform = `translateY(${(1 - r) * 18}px) scale(${0.96 + r * 0.04})`;
            }
          },
          { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
        );
        cards.forEach((c) => io.observe(c));
      }

      // Parallax fallback
      const frames = document.querySelectorAll(".parallax-frame");
      if (frames.length) {
        const updateParallax = () => {
          const vh = window.innerHeight;
          frames.forEach((frame) => {
            const media = frame.querySelector(".parallax-media");
            if (!media) return;
            const rect = frame.getBoundingClientRect();
            const pct = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
            const offset = (pct - 0.5) * 12;
            media.style.transform = `scale(1.12) translateY(${offset}%)`;
          });
        };
        window.addEventListener("scroll", updateParallax, { passive: true });
        updateParallax();
      }
    }

    // 3D Perspective Tilt & Cursor Spotlight on hover-capable devices
    if (window.matchMedia("(hover: hover)").matches) {
      document.querySelectorAll(".tilt-card").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rx = ((y / rect.height) - 0.5) * -6;
          const ry = ((x / rect.width) - 0.5) * 6;
          card.style.setProperty("--mx", `${x}px`);
          card.style.setProperty("--my", `${y}px`);
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
        });
        card.addEventListener("pointerleave", () => {
          card.style.transform = "";
        });
      });
    }
  }

  // 4. Shared Light-Theme Header & Footer Injection
  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  function navLink(href, label) {
    const isCurrent = currentPage === href.toLowerCase();
    return `<a href="${href}"${isCurrent ? ' aria-current="page"' : ""}>${label}</a>`;
  }

  function renderHeader() {
    const host = document.getElementById("dci-header-mount");
    if (!host) return;

    host.innerHTML = `
      <header class="site-header" id="site-header">
        <div class="header-inner">
          <a href="index.html" class="flex items-center gap-2.5 focus-visible:outline-[#C89B35]" aria-label="Drive Chambers India Home">
            <img src="assets/img/dci-logo.png" alt="Drive Chambers India (DCI)" class="h-11 w-auto" width="79" height="44">
          </a>

          <nav class="site-nav" aria-label="Primary">
            <button
              class="menu-button"
              type="button"
              popovertarget="site-menu"
              popovertargetaction="toggle"
              aria-controls="site-menu"
            >
              <svg aria-hidden="true" class="w-5 h-5 text-[#294766]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <span>Menu</span>
            </button>

            <ul id="site-menu" class="site-menu" popover="auto">
              <li>${navLink("index.html", "Home")}</li>
              <li>${navLink("about.html", "About DCI")}</li>
              <li>${navLink("services.html", "Services")}</li>
              <li>${navLink("plans.html", "Membership Plans")}</li>
              <li>${navLink("how-it-works.html", "How It Works")}</li>
              <li>${navLink("dealership-partner.html", "Dealership Partner")}</li>
              <li class="nav-dropdown">
                <button
                  class="dropdown-trigger w-full"
                  type="button"
                  aria-expanded="false"
                  aria-controls="resources-menu"
                  popovertarget="resources-menu"
                >
                  <span>More</span>
                  <svg aria-hidden="true" class="w-4 h-4 text-[#C89B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <ul id="resources-menu" class="dropdown-list">
                  <li>${navLink("faqs.html", "FAQs & Awareness")}</li>
                  <li>${navLink("contact.html", "Contact & Grievance")}</li>
                  <li>${navLink("legal.html", "Legal & Policies")}</li>
                </ul>
              </li>
              <li class="pt-2 lg:pt-0 lg:pl-2">
                <a href="login.html" class="!bg-[#294766] !text-white hover:!bg-[#1D344C] !font-bold !rounded-lg !px-4 !py-2 shadow-sm border border-[#C89B35]/40">
                  Portal Login
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    `;

    initResponsiveNav();
  }

  function initResponsiveNav() {
    const header = document.getElementById("site-header");
    if (!header) return;
    const inner = header.querySelector(".header-inner");
    const menu = document.getElementById("site-menu");
    const trigger = header.querySelector(".dropdown-trigger");
    const submenu = document.getElementById("resources-menu");
    const dropdownItem = header.querySelector(".nav-dropdown");
    if (!inner || !menu || !trigger || !submenu || !dropdownItem) return;

    let lastWidth = 0;
    let hoverPreview = false;

    function syncLayout(forceMeasure = false) {
      const currentWidth = header.clientWidth;
      const wasWide = header.classList.contains("is-wide");
      if (!forceMeasure && !wasWide && currentWidth <= lastWidth) {
        return;
      }
      lastWidth = currentWidth;

      const menuWasOpen = !wasWide && menu.matches(":popover-open");
      header.classList.add("is-measuring");
      header.classList.add("is-wide");
      submenu.setAttribute("popover", "auto");
      submenu.hidden = false;

      const fits = inner.scrollWidth <= inner.clientWidth;

      if (fits) {
        menu.removeAttribute("popover");
        submenu.setAttribute("popover", "auto");
        submenu.hidden = false;
        trigger.setAttribute("aria-expanded", "false");
      } else {
        header.classList.remove("is-wide");
        menu.setAttribute("popover", "auto");
        submenu.removeAttribute("popover");
        submenu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        if (menuWasOpen) {
          try { menu.showPopover(); } catch (_) {}
        }
      }

      requestAnimationFrame(() => header.classList.remove("is-measuring"));
    }

    trigger.addEventListener("click", (e) => {
      if (header.classList.contains("is-wide")) {
        if (hoverPreview) {
          hoverPreview = false;
          e.preventDefault();
        }
        return;
      }
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      submenu.hidden = expanded;
    });

    submenu.addEventListener("toggle", (e) => {
      if (!header.classList.contains("is-wide")) return;
      const isOpen = e.newState === "open";
      trigger.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) hoverPreview = false;

      if (isOpen && !CSS.supports("position-area", "block-end")) {
        const tr = trigger.getBoundingClientRect();
        const sr = submenu.getBoundingClientRect();
        let top = tr.bottom + 8;
        if (top + sr.height > window.innerHeight) {
          top = Math.max(8, tr.top - sr.height - 8);
        }
        const left = Math.max(8, Math.min(tr.left, window.innerWidth - sr.width - 8));
        submenu.style.top = `${top}px`;
        submenu.style.left = `${left}px`;
      }
    });

    dropdownItem.addEventListener("pointerenter", (e) => {
      if (!header.classList.contains("is-wide")) return;
      if (!window.matchMedia("(hover: hover)").matches || e.pointerType === "touch") return;
      if (!submenu.matches(":popover-open")) {
        hoverPreview = true;
        try {
          submenu.showPopover({ source: trigger });
        } catch (_) {
          try { submenu.showPopover(); } catch (_) {}
        }
      }
    });

    dropdownItem.addEventListener("pointerleave", () => {
      if (!header.classList.contains("is-wide")) return;
      if (hoverPreview && submenu.matches(":popover-open")) {
        hoverPreview = false;
        try { submenu.hidePopover(); } catch (_) {}
      }
    });

    dropdownItem.addEventListener("focusout", (e) => {
      if (!header.classList.contains("is-wide")) return;
      if (e.relatedTarget && !dropdownItem.contains(e.relatedTarget) && submenu.matches(":popover-open")) {
        try { submenu.hidePopover(); } catch (_) {}
      }
    });

    const ro = new ResizeObserver(() => syncLayout(true));
    ro.observe(header);
    ro.observe(menu);
    syncLayout(true);
  }

  function renderFooter() {
    const host = document.getElementById("dci-footer-mount");
    if (!host) return;
    host.innerHTML = `
      <footer class="bg-[#F3F5F7] text-[#344054] border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-gray-200">
            <div>
              <img src="assets/img/dci-logo.png" alt="Drive Chambers India" class="h-12 w-auto mb-4" width="86" height="48">
              <p class="text-sm text-[#B08424] font-semibold italic mb-3">"Your Vehicle. Your Rights. Our Legal Support."</p>
              <p class="text-xs text-[#667085] leading-relaxed">
                Organised automotive legal &amp; insurance assistance membership ecosystem. Launching from Meerut, Uttar Pradesh with a Pan-India vision.
              </p>
            </div>

            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#294766] mb-4">Quick Links</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="about.html" class="hover:text-[#294766] hover:underline transition-colors">About DCI</a></li>
                <li><a href="services.html" class="hover:text-[#294766] hover:underline transition-colors">Our Support Areas</a></li>
                <li><a href="plans.html" class="hover:text-[#294766] hover:underline transition-colors">Membership Plans</a></li>
                <li><a href="how-it-works.html" class="hover:text-[#294766] hover:underline transition-colors">How It Works</a></li>
                <li><a href="dealership-partner.html" class="hover:text-[#294766] hover:underline transition-colors">Dealership Partnership</a></li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#294766] mb-4">Policies &amp; Support</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="faqs.html" class="hover:text-[#294766] hover:underline transition-colors">FAQs &amp; Traffic Awareness</a></li>
                <li><a href="legal.html#terms" class="hover:text-[#294766] hover:underline transition-colors">Terms &amp; Conditions</a></li>
                <li><a href="legal.html#privacy" class="hover:text-[#294766] hover:underline transition-colors">Privacy Policy</a></li>
                <li><a href="legal.html#refund" class="hover:text-[#294766] hover:underline transition-colors">Refund &amp; Cancellation</a></li>
                <li><a href="legal.html#disclaimer" class="hover:text-[#294766] hover:underline transition-colors">Compliance Disclaimer</a></li>
                <li><a href="contact.html" class="hover:text-[#294766] hover:underline transition-colors">Grievance &amp; Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#294766] mb-4">Headquarters &amp; Portal</h3>
              <p class="text-sm text-[#667085] mb-2">Meerut, Uttar Pradesh, India</p>
              <p class="text-sm text-[#667085] mb-2">Support: <a href="mailto:support@drivechambers.in" class="text-[#294766] font-semibold hover:underline">support@drivechambers.in</a></p>
              <p class="text-sm text-[#667085] mb-4">Helpline: +91 121-400-DCI0 (Mon–Sat, 9 AM – 7 PM)</p>
              <a href="login.html" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C89B35] text-[#171717] text-sm font-bold hover:bg-[#DFB858] shadow-sm transition-colors">
                Member &amp; Partner Login
              </a>
            </div>
          </div>

          <div class="pt-6 space-y-3 text-xs text-[#667085]">
            <p class="p-3.5 rounded-xl bg-white border border-gray-200 leading-relaxed shadow-2xs">
              <strong class="text-[#294766]">Important Disclaimer:</strong> Drive Chambers India (DCI) is an independent private assistance and legal-support coordination platform. DCI is <strong>not</strong> a government authority, court, police department, insurer, or statutory regulator. Membership does not grant immunity from traffic laws and does <strong>not</strong> guarantee traffic challan cancellation, penalty discounts, or insurance claim approval. All legal engagements are subject to the final membership agreement, defined scope, and customer's independent choice of advocate.
            </p>
            <div class="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
              <p>&copy; 2026 Drive Chambers India (DCI). All rights reserved.</p>
              <p>Initial Launch Market: Meerut, UP &bull; Pan-India Vision</p>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // 5. Accessible Form Validation Sync (:user-invalid + ARIA live region)
  function initFormValidation() {
    const forms = document.querySelectorAll("form[data-dci-validate]");
    if (!forms.length) return;

    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.classList.add("visually-hidden");
    document.body.append(announcer);
    let announceTimer;
    let announcedField;

    const supportsUserInvalid = CSS.supports("selector(:user-invalid)");
    const dirtyState = new WeakMap();
    const flagged = new WeakSet();
    const announced = new WeakSet();

    const linkError = (el, shown) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
      else el.removeAttribute("aria-describedby");
    };

    const spokenText = (node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => n.replaceWith(`${n.getAttribute("aria-label")}: `));
      return copy.textContent.replace(/\s+/g, " ").trim();
    };

    const announceError = (el) => {
      const error = document.getElementById(el.dataset.error);
      if (!error) return;
      const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : "";
      clearTimeout(announceTimer);
      announcer.textContent = "";
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = label + spokenText(error);
      }, 450);
    };

    const syncAria = (el, announce = false) => {
      if (!el.matches?.("input, select, textarea")) return;
      const invalid = supportsUserInvalid
        ? el.matches(":user-invalid")
        : el.classList.contains("user-invalid-fallback");
      if (invalid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute("aria-invalid", "true");
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute("aria-invalid") !== "true") {
        el.setAttribute("aria-invalid", "false");
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          clearTimeout(announceTimer);
          announcer.textContent = "";
        }
      }
    };

    forms.forEach((form) => {
      form.querySelectorAll("input, select, textarea").forEach((el) => syncAria(el));

      if (!supportsUserInvalid) {
        form.addEventListener("blur", (e) => {
          const t = e.target;
          if (!t.checkValidity) return;
          const s = dirtyState.get(t) || { hasInteracted: false, hasBlurred: false };
          s.hasBlurred = true;
          dirtyState.set(t, s);
          if (s.hasInteracted) {
            t.classList.toggle("user-invalid-fallback", !t.validity.valid);
            t.classList.toggle("user-valid-fallback", t.validity.valid);
            syncAria(t, true);
          }
        }, true);

        form.addEventListener("input", (e) => {
          const t = e.target;
          if (!t.checkValidity) return;
          const s = dirtyState.get(t) || { hasInteracted: false, hasBlurred: false };
          s.hasInteracted = true;
          dirtyState.set(t, s);
          if (s.hasBlurred) {
            t.classList.toggle("user-invalid-fallback", !t.validity.valid);
            t.classList.toggle("user-valid-fallback", t.validity.valid);
            syncAria(t);
          }
        });
      } else {
        form.addEventListener("blur", (e) => syncAria(e.target, true), true);
        form.addEventListener("input", (e) => {
          if (e.target.hasAttribute("aria-invalid")) syncAria(e.target);
        });
        form.addEventListener("change", (e) => syncAria(e.target, true), true);
      }

      form.addEventListener("invalid", (e) => {
        if (!supportsUserInvalid) {
          e.target.classList.add("user-invalid-fallback");
        }
        announced.add(e.target);
        syncAria(e.target);
      }, true);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initScrollEffects();
    renderHeader();
    renderFooter();
    initFormValidation();
  });
})();
