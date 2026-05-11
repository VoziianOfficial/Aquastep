"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initLegalPage);

    function initLegalPage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on legal page.");
            return;
        }

        const legalKey = getLegalKey();

        if (!legalKey || !config.legalPages || !config.legalPages[legalKey]) {
            console.warn("No matching legal page content found.");
            return;
        }

        const pageData = config.legalPages[legalKey];

        renderLegalHero(pageData);
        renderLegalSections(pageData);
        renderLegalNavigation(legalKey);
        initLegalReveal();
    }

    function getLegalKey() {
        const page = getCurrentPageName();

        const map = {
            "privacy-policy.html": "privacy",
            "cookie-policy.html": "cookie",
            "terms-of-service.html": "terms"
        };

        return map[page] || document.body.getAttribute("data-legal-page");
    }

    function getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf("/") + 1);

        return fileName || "index.html";
    }

    function renderLegalHero(pageData) {
        const kicker = document.querySelector("[data-legal-kicker]");
        const title = document.querySelector("[data-legal-title]");
        const intro = document.querySelector("[data-legal-intro]");

        if (kicker) {
            kicker.textContent = pageData.kicker;
            kicker.setAttribute("data-allow-static", "true");
        }

        if (title) {
            title.textContent = pageData.title;
            title.setAttribute("data-allow-static", "true");
        }

        if (intro) {
            intro.textContent = pageData.intro;
            intro.setAttribute("data-allow-static", "true");
        }
    }

    function renderLegalSections(pageData) {
        const container = document.querySelector("[data-legal-sections]");

        if (!container || !Array.isArray(pageData.sections)) return;

        container.innerHTML = pageData.sections
            .map((section) => {
                return `
          <section class="legal-section-card">
            <h2>${escapeHtml(section.title)}</h2>
            <p>${escapeHtml(section.text)}</p>
          </section>
        `;
            })
            .join("");

        container.setAttribute("data-allow-static", "true");
    }

    function renderLegalNavigation(activeKey) {
        const nav = document.querySelector("[data-legal-nav]");

        if (!nav) return;

        const links = [
            {
                key: "privacy",
                label: "Privacy Policy",
                href: "privacy-policy.html"
            },
            {
                key: "cookie",
                label: "Cookie Policy",
                href: "cookie-policy.html"
            },
            {
                key: "terms",
                label: "Terms of Service",
                href: "terms-of-service.html"
            }
        ];

        nav.innerHTML = links
            .map((item) => {
                const activeClass = item.key === activeKey ? " is-active" : "";

                return `
          <a class="${activeClass}" href="${escapeHtml(item.href)}" data-allow-static="true">
            <span>${escapeHtml(item.label)}</span>
            <span aria-hidden="true">→</span>
          </a>
        `;
            })
            .join("");

        nav.setAttribute("data-allow-static", "true");
    }

    function initLegalReveal() {
        const elements = document.querySelectorAll(
            ".legal-sidebar-card, .legal-section-card, .legal-disclaimer-card, .legal-platform-card, .legal-bottom-copy"
        );

        if (!elements.length) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) {
            elements.forEach((element) => {
                element.classList.add("is-visible");
            });
            return;
        }

        elements.forEach((element, index) => {
            element.classList.add("legal-reveal");
            element.style.setProperty("--legal-reveal-delay", `${Math.min(index * 55, 220)}ms`);
        });

        if (!("IntersectionObserver" in window)) {
            elements.forEach((element) => {
                element.classList.add("is-visible");
            });
            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("is-visible");
                    currentObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.14
            }
        );

        elements.forEach((element) => observer.observe(element));
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();