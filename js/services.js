"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", () => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                initServicesInfiniteCarousel();
                initServicesFactorHover();
            });
        });
    });

    function initServicesInfiniteCarousel() {
        const section = document.querySelector(".services-swiper-section");

        if (!section) return;

        const viewport = section.querySelector(".services-carousel");
        const track = section.querySelector(".services-carousel-track");
        const prev = section.querySelector("[data-carousel-prev]");
        const next = section.querySelector("[data-carousel-next]");

        if (!viewport || !track || !prev || !next) return;

        let currentIndex = 0;
        let cloneCount = 0;
        let autoplayId = null;
        let isLocked = false;
        let lockTimer = null;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function getOriginalCards() {
            return Array.from(track.querySelectorAll(".service-card:not([data-service-clone])"));
        }

        function getAllCards() {
            return Array.from(track.querySelectorAll(".service-card"));
        }

        function getGap() {
            const styles = window.getComputedStyle(track);
            return parseFloat(styles.columnGap || styles.gap || "0") || 0;
        }

        function getVisibleCount() {
            const originals = getOriginalCards();

            if (!originals.length) return 1;

            const cardWidth = originals[0].getBoundingClientRect().width;
            const viewportWidth = viewport.getBoundingClientRect().width;
            const gap = getGap();

            if (!cardWidth || !viewportWidth) return 1;

            return Math.max(1, Math.round((viewportWidth + gap) / (cardWidth + gap)));
        }

        function clearClones() {
            track.querySelectorAll("[data-service-clone]").forEach((clone) => {
                clone.remove();
            });
        }

        function cloneCard(card) {
            const clone = card.cloneNode(true);

            clone.setAttribute("data-service-clone", "true");
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("tabindex", "-1");

            clone.querySelectorAll("a, button").forEach((item) => {
                item.setAttribute("tabindex", "-1");
            });

            return clone;
        }

        function buildLoop() {
            clearClones();

            const originals = getOriginalCards();

            if (originals.length <= 1) return;

            cloneCount = originals.length;

            const firstClones = originals.slice(0, cloneCount).map(cloneCard);
            const lastClones = originals.slice(-cloneCount).map(cloneCard);

            lastClones.reverse().forEach((clone) => {
                track.insertBefore(clone, track.firstChild);
            });

            firstClones.forEach((clone) => {
                track.appendChild(clone);
            });

            currentIndex = cloneCount;
            moveToCurrent(false);
        }

        function moveToCurrent(animate) {
            const cards = getAllCards();
            const target = cards[currentIndex];

            if (!target) return;

            track.style.transition = animate ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)" : "none";
            track.style.transform = `translate3d(${-target.offsetLeft}px, 0, 0)`;

            if (!animate) {
                window.requestAnimationFrame(() => {
                    track.style.transition = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)";
                });
            }
        }

        function normalizeLoopPosition() {
            const originals = getOriginalCards();
            const originalCount = originals.length;

            if (!originalCount) return;

            if (currentIndex >= cloneCount + originalCount) {
                currentIndex = cloneCount;
                moveToCurrent(false);
                return;
            }

            if (currentIndex < cloneCount) {
                currentIndex = cloneCount + originalCount - 1;
                moveToCurrent(false);
            }
        }

        function unlockAfterMove() {
            window.clearTimeout(lockTimer);

            lockTimer = window.setTimeout(() => {
                normalizeLoopPosition();
                isLocked = false;
            }, 620);
        }

        function goNext(event) {
            if (event) event.preventDefault();
            if (isLocked) return;

            isLocked = true;
            currentIndex += 1;
            moveToCurrent(true);
            unlockAfterMove();

            if (event) restartAutoplay();
        }

        function goPrev(event) {
            if (event) event.preventDefault();
            if (isLocked) return;

            isLocked = true;
            currentIndex -= 1;
            moveToCurrent(true);
            unlockAfterMove();

            if (event) restartAutoplay();
        }

        track.addEventListener("transitionend", (event) => {
            if (event.target !== track) return;
            if (event.propertyName !== "transform") return;

            window.clearTimeout(lockTimer);
            normalizeLoopPosition();
            isLocked = false;
        });

        next.addEventListener("click", goNext);
        prev.addEventListener("click", goPrev);

        function startAutoplay() {
            if (reduceMotion) return;

            stopAutoplay();

            autoplayId = window.setInterval(() => {
                goNext();
            }, 2800);
        }

        function stopAutoplay() {
            if (!autoplayId) return;

            window.clearInterval(autoplayId);
            autoplayId = null;
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        section.addEventListener("mouseenter", stopAutoplay);
        section.addEventListener("mouseleave", startAutoplay);
        section.addEventListener("focusin", stopAutoplay);
        section.addEventListener("focusout", startAutoplay);

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        let resizeTimer = null;

        window.addEventListener("resize", () => {
            window.clearTimeout(resizeTimer);

            resizeTimer = window.setTimeout(() => {
                stopAutoplay();
                buildLoop();
                startAutoplay();
            }, 180);
        });

        buildLoop();
        startAutoplay();
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