"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initServicesPage);

    function initServicesPage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on services page.");
            return;
        }

        prepareServicesLoop();
        initServicesAutoplay();
        initServicesFactorHover();
    }

    function prepareServicesLoop() {
        const track = document.querySelector(".services-carousel-track");

        if (!track) return;

        const cards = Array.from(track.children);

        if (!cards.length) return;

        const alreadyCloned = track.hasAttribute("data-loop-ready");

        if (alreadyCloned) return;

        cards.forEach((card) => {
            const clone = card.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("tabindex", "-1");

            const links = clone.querySelectorAll("a");

            links.forEach((link) => {
                link.setAttribute("tabindex", "-1");
            });

            track.appendChild(clone);
        });

        track.setAttribute("data-loop-ready", "true");
    }

    function initServicesAutoplay() {
        const carousel = document.querySelector(".services-carousel");
        const track = document.querySelector(".services-carousel-track");

        if (!carousel || !track) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) return;

        let autoplayId = null;
        let isPaused = false;

        const getStep = () => {
            const firstCard = track.querySelector(".service-card");

            if (!firstCard) return 320;

            const cardWidth = firstCard.getBoundingClientRect().width;
            const styles = window.getComputedStyle(track);
            const gap = parseFloat(styles.columnGap || styles.gap || "16") || 16;

            return cardWidth + gap;
        };

        const resetIfNeeded = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;

            if (maxScroll <= 0) return;

            if (track.scrollLeft >= maxScroll - 12) {
                track.scrollTo({
                    left: 0,
                    behavior: "auto"
                });
            }
        };

        const moveNext = () => {
            if (isPaused) return;

            resetIfNeeded();

            track.scrollBy({
                left: getStep(),
                behavior: "smooth"
            });
        };

        const start = () => {
            stop();
            autoplayId = window.setInterval(moveNext, 3600);
        };

        const stop = () => {
            if (!autoplayId) return;

            window.clearInterval(autoplayId);
            autoplayId = null;
        };

        carousel.addEventListener("mouseenter", () => {
            isPaused = true;
        });

        carousel.addEventListener("mouseleave", () => {
            isPaused = false;
        });

        carousel.addEventListener("focusin", () => {
            isPaused = true;
        });

        carousel.addEventListener("focusout", () => {
            isPaused = false;
        });

        track.addEventListener(
            "scroll",
            () => {
                window.requestAnimationFrame(resetIfNeeded);
            },
            {
                passive: true
            }
        );

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        start();
    }

    function initServicesFactorHover() {
        const rows = document.querySelectorAll(".services-factor-row");

        if (!rows.length) return;

        rows.forEach((row, index) => {
            row.style.setProperty("--factor-delay", `${index * 35}ms`);

            row.addEventListener("mouseenter", () => {
                rows.forEach((item) => {
                    if (item !== row) {
                        item.classList.add("is-muted");
                    }
                });
            });

            row.addEventListener("mouseleave", () => {
                rows.forEach((item) => {
                    item.classList.remove("is-muted");
                });
            });
        });
    }
})();