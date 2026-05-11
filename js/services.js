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
        const section = document.querySelector(".services-swiper-section");

        if (!section) return;

        const carousel = section.querySelector(".services-carousel");
        const track = section.querySelector(".services-carousel-track");
        const prev = section.querySelector("[data-carousel-prev]");
        const next = section.querySelector("[data-carousel-next]");

        if (!carousel || !track) return;

        if (track.dataset.servicesCarouselReady === "true") return;
        track.dataset.servicesCarouselReady = "true";

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let autoplayId = null;
        let isPaused = false;

        const getGap = () => {
            const styles = window.getComputedStyle(track);
            return parseFloat(styles.columnGap || styles.gap || "16") || 16;
        };

        const getStep = () => {
            const firstCard = track.querySelector(".service-card");

            if (!firstCard) return 320;

            return firstCard.getBoundingClientRect().width + getGap();
        };

        const getMaxScroll = () => {
            return Math.max(0, track.scrollWidth - track.clientWidth);
        };

        const moveNext = () => {
            const maxScroll = getMaxScroll();

            if (maxScroll <= 0) return;

            if (track.scrollLeft >= maxScroll - 12) {
                track.scrollTo({
                    left: 0,
                    behavior: "auto"
                });

                window.requestAnimationFrame(() => {
                    track.scrollBy({
                        left: getStep(),
                        behavior: "smooth"
                    });
                });

                return;
            }

            track.scrollBy({
                left: getStep(),
                behavior: "smooth"
            });
        };

        const movePrev = () => {
            const maxScroll = getMaxScroll();

            if (maxScroll <= 0) return;

            if (track.scrollLeft <= 12) {
                track.scrollTo({
                    left: maxScroll,
                    behavior: "auto"
                });

                window.requestAnimationFrame(() => {
                    track.scrollBy({
                        left: -getStep(),
                        behavior: "smooth"
                    });
                });

                return;
            }

            track.scrollBy({
                left: -getStep(),
                behavior: "smooth"
            });
        };

        const start = () => {
            if (reduceMotion) return;

            stop();

            autoplayId = window.setInterval(() => {
                if (isPaused) return;
                moveNext();
            }, 3600);
        };

        const stop = () => {
            if (!autoplayId) return;

            window.clearInterval(autoplayId);
            autoplayId = null;
        };

        const restart = () => {
            stop();
            start();
        };

        if (prev) {
            prev.addEventListener("click", (event) => {
                event.preventDefault();
                isPaused = false;
                movePrev();
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", (event) => {
                event.preventDefault();
                isPaused = false;
                moveNext();
                restart();
            });
        }

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