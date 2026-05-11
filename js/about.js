"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initAboutPage);

    function initAboutPage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on about page.");
            return;
        }

        renderAboutTimeline(config);
        initRevealAnimation();
        initModelPanelHover();
    }

    function renderAboutTimeline(config) {
        const timeline = document.querySelector(".about-timeline");

        if (!timeline || !Array.isArray(config.processSteps)) return;

        timeline.innerHTML = config.processSteps
            .map((step) => {
                return `
          <article class="about-timeline-step" data-about-reveal>
            <span class="about-timeline-icon" aria-hidden="true">
              ${getAboutIcon(step.icon)}
            </span>

            <strong>Step ${escapeHtml(step.number)}</strong>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.text)}</p>
          </article>
        `;
            })
            .join("");
    }

    function initRevealAnimation() {
        const elements = document.querySelectorAll(
            ".about-story-photo, .about-story-copy, .about-model-panel, .about-timeline-step, .about-trust-copy, .about-trust-photo"
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
            element.classList.add("about-reveal");
            element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 220)}ms`);
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
                threshold: 0.18
            }
        );

        elements.forEach((element) => {
            observer.observe(element);
        });
    }

    function initModelPanelHover() {
        const panels = document.querySelectorAll(".about-model-panel");

        if (!panels.length) return;

        panels.forEach((panel) => {
            panel.addEventListener("mouseenter", () => {
                panels.forEach((item) => {
                    if (item !== panel) {
                        item.classList.add("is-muted");
                    }
                });
            });

            panel.addEventListener("mouseleave", () => {
                panels.forEach((item) => {
                    item.classList.remove("is-muted");
                });
            });
        });
    }

    function getAboutIcon(name) {
        const icons = {
            form: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6 3.5H18V20.5H6V3.5Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M9 8H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M9 12H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M9 16H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            search: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M10.8 17.1C14.3 17.1 17.1 14.3 17.1 10.8C17.1 7.3 14.3 4.5 10.8 4.5C7.3 4.5 4.5 7.3 4.5 10.8C4.5 14.3 7.3 17.1 10.8 17.1Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15.4 15.4L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            quote: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M7.5 7H11V11.1C11 14.3 9.5 16.4 6.5 17.6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M15 7H18.5V11.1C18.5 14.3 17 16.4 14 17.6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      `,

            shield: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2.8L19 5.4V10.8C19 15.2 16.3 19.2 12 21.2C7.7 19.2 5 15.2 5 10.8V5.4L12 2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M8.8 11.8L11.1 14.1L15.6 9.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
        };

        return icons[name] || icons.form;
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