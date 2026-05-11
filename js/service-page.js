"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initServicePage);

    function initServicePage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on service detail page.");
            return;
        }

        const service = getCurrentService(config);

        if (!service) {
            console.warn("No matching service found for current service page.");
            return;
        }

        applyServiceData(service);
        renderServiceIntroPoints(service);
        renderServiceEvaluationFactors(service);
        renderRelatedServices(config, service);
        initServiceReveal();
        initEvaluationHover();
    }

    function getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf("/") + 1);

        return fileName || "index.html";
    }

    function getCurrentService(config) {
        const page = getCurrentPageName();

        return config.services.find((service) => service.href === page);
    }

    function applyServiceData(service) {
        document.querySelectorAll("[data-service-title]").forEach((element) => {
            element.textContent = service.title;
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-short-title]").forEach((element) => {
            element.textContent = service.shortTitle || service.title;
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-summary]").forEach((element) => {
            element.textContent = service.summary;
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-page-kicker]").forEach((element) => {
            element.textContent = service.pageKicker || "Walk-in tub category";
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-page-title]").forEach((element) => {
            element.textContent = service.pageTitle || service.title;
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-page-intro]").forEach((element) => {
            element.textContent = service.pageIntro || service.summary;
            element.setAttribute("data-allow-static", "true");
        });

        document.querySelectorAll("[data-service-hero-image]").forEach((image) => {
            image.setAttribute("src", service.heroImage || service.image);
            image.setAttribute("alt", "");
        });

        document.querySelectorAll("[data-service-image]").forEach((image) => {
            image.setAttribute("src", service.image);
            image.setAttribute("alt", "");
        });
    }

    function renderServiceIntroPoints(service) {
        const containers = document.querySelectorAll("[data-service-intro-points]");

        if (!containers.length) return;

        const points = Array.isArray(service.evaluationPoints)
            ? service.evaluationPoints.slice(0, 4)
            : [];

        containers.forEach((container) => {
            container.innerHTML = points
                .map((point) => {
                    return `<li>${escapeHtml(point)}</li>`;
                })
                .join("");

            container.setAttribute("data-allow-static", "true");
        });
    }

    function renderServiceEvaluationFactors(service) {
        const containers = document.querySelectorAll("[data-service-evaluation-factors]");

        if (!containers.length) return;

        const points = Array.isArray(service.evaluationPoints)
            ? service.evaluationPoints
            : [];

        containers.forEach((container) => {
            container.innerHTML = points
                .map((point, index) => {
                    return `
            <article class="service-evaluation-card">
              <span class="service-evaluation-number">${String(index + 1).padStart(2, "0")}</span>

              <div class="service-evaluation-text">
                <strong>${escapeHtml(point)}</strong>
                <span>${getEvaluationDescription(point)}</span>
              </div>
            </article>
          `;
                })
                .join("");

            container.setAttribute("data-allow-static", "true");
        });
    }

    function renderRelatedServices(config, currentService) {
        const containers = document.querySelectorAll("[data-related-services]");

        if (!containers.length) return;

        const related = config.services.filter((service) => service.id !== currentService.id);

        containers.forEach((container) => {
            container.innerHTML = related
                .map((service, index) => {
                    return `
            <a class="service-mini-item" href="${escapeHtml(service.href)}" data-allow-static="true">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(service.shortTitle || service.title)}</strong>
            </a>
          `;
                })
                .join("");

            container.setAttribute("data-allow-static", "true");
        });
    }

    function initServiceReveal() {
        const elements = document.querySelectorAll(
            ".service-intro-photo, .service-intro-copy, .service-evaluation-copy, .service-evaluation-card, .service-editorial-copy, .service-editorial-photo, .service-step-card, .service-faq-copy, .faq-item"
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
            element.classList.add("service-reveal");
            element.style.setProperty("--service-reveal-delay", `${Math.min(index * 45, 220)}ms`);
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
                threshold: 0.16
            }
        );

        elements.forEach((element) => observer.observe(element));
    }

    function initEvaluationHover() {
        const cards = document.querySelectorAll(".service-evaluation-card");

        if (!cards.length) return;

        cards.forEach((card) => {
            card.addEventListener("mouseenter", () => {
                cards.forEach((item) => {
                    if (item !== card) {
                        item.classList.add("is-muted");
                    }
                });
            });

            card.addEventListener("mouseleave", () => {
                cards.forEach((item) => {
                    item.classList.remove("is-muted");
                });
            });
        });
    }

    function getEvaluationDescription(point) {
        const value = point.toLowerCase();

        if (value.includes("entry") || value.includes("threshold")) {
            return "Ask providers how the entry design, door style, and step-in height may fit the homeowner’s needs.";
        }

        if (value.includes("seat") || value.includes("comfort") || value.includes("position")) {
            return "Compare comfort details such as seat shape, bathing position, controls, and everyday ease of use.";
        }

        if (value.includes("door") || value.includes("layout") || value.includes("bathroom")) {
            return "Review bathroom dimensions, door swing, surrounding fixtures, and layout compatibility before deciding.";
        }

        if (value.includes("faucet") || value.includes("drain") || value.includes("fill")) {
            return "Ask about fill speed, drain speed, plumbing considerations, and what is included in the written quote.";
        }

        if (value.includes("quote") || value.includes("warranty") || value.includes("pricing")) {
            return "Confirm written quote scope, warranty language, possible exclusions, and any additional cost conditions.";
        }

        if (value.includes("jet") || value.includes("hydrotherapy")) {
            return "Compare jet type, controls, maintenance needs, feature packages, and warranty terms.";
        }

        if (value.includes("electrical")) {
            return "Ask providers whether the feature package may require electrical review or added project considerations.";
        }

        if (value.includes("grab") || value.includes("anti-slip") || value.includes("safety")) {
            return "Review safety-oriented details such as grip placement, textured surfaces, and entry support features.";
        }

        if (value.includes("provider") || value.includes("availability")) {
            return "Confirm ZIP code coverage, appointment timing, provider credentials, licensing, and insurance details.";
        }

        if (value.includes("finish") || value.includes("premium")) {
            return "Compare finish packages, upgraded controls, comfort features, and written product specifications.";
        }

        return "Use this factor as a provider discussion point before making an independent homeowner decision.";
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