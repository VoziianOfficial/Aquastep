"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initHomePage);

    function initHomePage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on home page.");
            return;
        }

        renderHomeHeroPoints(config);
        renderHomeCounters(config);
        // renderHomeReviews(config);
        // initHomeCounterAnimation();
        // initHomeReviewAutoplay();
        initHomeParallax();
    }

    function renderHomeHeroPoints(config) {
        const list = document.querySelector(".home-hero-card .icon-list");

        if (!list || !Array.isArray(config.homeHeroPoints)) return;

        list.innerHTML = config.homeHeroPoints
            .map((item) => {
                return `
          <article class="icon-row">
            <span class="icon-box" aria-hidden="true">
              ${getHomeIcon(item.icon)}
            </span>

            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </div>
          </article>
        `;
            })
            .join("");
    }

    function renderHomeCounters(config) {
        const grid = document.querySelector(".home-counter-grid");

        if (!grid || !Array.isArray(config.counters)) return;

        grid.innerHTML = config.counters
            .map((item) => {
                return `
          <article class="home-counter-card">
            <strong
              class="home-counter-value"
              data-home-counter
              data-counter-value="${escapeHtml(item.value)}"
              data-counter-suffix="${escapeHtml(item.suffix || "")}"
            >0</strong>

            <span class="home-counter-label">${escapeHtml(item.label)}</span>
            <p class="home-counter-text">${escapeHtml(item.text)}</p>
          </article>
        `;
            })
            .join("");
    }

    function renderHomeReviews(config) {
        const track = document.querySelector(".home-review-track");

        if (!track || !Array.isArray(config.reviews)) return;

        const reviews = [...config.reviews, ...config.reviews];

        track.innerHTML = reviews
            .map((review) => {
                return `
          <article class="review-card">
            <span class="review-mark" aria-hidden="true">“</span>

            <p class="review-quote">${escapeHtml(review.quote)}</p>

            <div class="review-author">
              <strong>${escapeHtml(review.name)}</strong>
              <span>${escapeHtml(review.location)}</span>
            </div>
          </article>
        `;
            })
            .join("");
    }

    function initHomeCounterAnimation() {
        const counters = document.querySelectorAll("[data-home-counter]");

        if (!counters.length) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const animateCounter = (counter) => {
            const target = Number(counter.getAttribute("data-counter-value")) || 0;
            const suffix = counter.getAttribute("data-counter-suffix") || "";

            if (reduceMotion) {
                counter.textContent = `${target}${suffix}`;
                return;
            }

            const startTime = performance.now();
            const duration = 900;

            const tick = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.round(target * eased);

                counter.textContent = `${value}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animateCounter);
            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    animateCounter(entry.target);
                    currentObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.35
            }
        );

        counters.forEach((counter) => observer.observe(counter));
    }

    function initHomeReviewAutoplay() {
        const carousel = document.querySelector(".home-review-carousel");
        const track = document.querySelector(".home-review-track");

        if (!carousel || !track) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) return;

        let autoplayId = null;
        let isPaused = false;

        const getStep = () => {
            const firstCard = track.querySelector(".review-card");

            if (!firstCard) return 320;

            const cardWidth = firstCard.getBoundingClientRect().width;
            return cardWidth + 16;
        };

        const start = () => {
            stop();

            autoplayId = window.setInterval(() => {
                if (isPaused) return;

                const maxScroll = track.scrollWidth - track.clientWidth;

                if (track.scrollLeft >= maxScroll - 10) {
                    track.scrollTo({
                        left: 0,
                        behavior: "auto"
                    });
                    return;
                }

                track.scrollBy({
                    left: getStep(),
                    behavior: "smooth"
                });
            }, 4200);
        };

        const stop = () => {
            if (autoplayId) {
                window.clearInterval(autoplayId);
                autoplayId = null;
            }
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

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        start();
    }

    function initHomeParallax() {
        const heroImage = document.querySelector(".home-hero .hero-media img");
        const heroCard = document.querySelector(".home-hero-card");

        if (!heroImage && !heroCard) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) return;

        let ticking = false;

        const update = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const offset = Math.min(scrollY * 0.08, 42);

            if (heroImage) {
                heroImage.style.transform = `translateY(${offset}px) scale(1.035)`;
            }

            if (heroCard) {
                heroCard.style.transform = `translateY(${offset * -0.18}px)`;
            }

            ticking = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (ticking) return;

                ticking = true;
                requestAnimationFrame(update);
            },
            {
                passive: true
            }
        );

        update();
    }

    function getHomeIcon(name) {
        const icons = {
            steps: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 18H10V14H15V10H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 21H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M7 15V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 11V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M17 7V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            waves: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 8.7C5.2 6.8 7.4 6.8 9.6 8.7C11.8 10.6 14 10.6 16.2 8.7C17.8 7.3 19.4 6.9 21 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3 13C5.2 11.1 7.4 11.1 9.6 13C11.8 14.9 14 14.9 16.2 13C17.8 11.6 19.4 11.2 21 11.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3 17.3C5.2 15.4 7.4 15.4 9.6 17.3C11.8 19.2 14 19.2 16.2 17.3C17.8 15.9 19.4 15.5 21 16.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            checklist: `
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M8.5 6.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8.5 12H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8.5 17.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3.8 6.5L5 7.7L7 5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.8 12L5 13.2L7 10.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.8 17.5L5 18.7L7 16.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
        };

        return icons[name] || icons.checklist;
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

/* FINAL infinite stories carousel — circular prev / next */

(function () {
    document.addEventListener("DOMContentLoaded", initStoriesInfiniteCarousel);

    function initStoriesInfiniteCarousel() {
        const section = document.querySelector(".home-stories-strip");

        if (!section) return;

        const viewport = section.querySelector(".home-stories-carousel");
        const track = section.querySelector(".home-stories-track");
        const prev = section.querySelector("[data-carousel-prev]");
        const next = section.querySelector("[data-carousel-next]");

        if (!viewport || !track || !prev || !next) return;

        let currentIndex = 0;
        let cloneCount = 0;
        let autoplayId = null;
        let isLocked = false;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function getOriginalCards() {
            return Array.from(track.querySelectorAll(".home-story-card:not([data-story-clone])"));
        }

        function getAllCards() {
            return Array.from(track.querySelectorAll(".home-story-card"));
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

            return Math.max(1, Math.floor((viewportWidth + gap) / (cardWidth + gap)));
        }

        function clearClones() {
            track.querySelectorAll("[data-story-clone]").forEach((clone) => {
                clone.remove();
            });
        }

        function buildLoop() {
            clearClones();

            const originals = getOriginalCards();

            if (originals.length <= 1) return;

            cloneCount = Math.min(getVisibleCount() + 1, originals.length);

            const firstClones = originals.slice(0, cloneCount).map((card) => {
                const clone = card.cloneNode(true);
                clone.setAttribute("data-story-clone", "true");
                clone.setAttribute("aria-hidden", "true");
                return clone;
            });

            const lastClones = originals.slice(-cloneCount).map((card) => {
                const clone = card.cloneNode(true);
                clone.setAttribute("data-story-clone", "true");
                clone.setAttribute("aria-hidden", "true");
                return clone;
            });

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

            track.style.transition = animate ? "" : "none";
            track.style.transform = `translate3d(${-target.offsetLeft}px, 0, 0)`;

            if (!animate) {
                window.requestAnimationFrame(() => {
                    track.style.transition = "";
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
            }

            if (currentIndex < cloneCount) {
                currentIndex = cloneCount + originalCount - 1;
                moveToCurrent(false);
            }
        }

        function goNext(event) {
            if (event) event.preventDefault();
            if (isLocked) return;

            isLocked = true;
            currentIndex += 1;
            moveToCurrent(true);
            restartAutoplay();
        }

        function goPrev(event) {
            if (event) event.preventDefault();
            if (isLocked) return;

            isLocked = true;
            currentIndex -= 1;
            moveToCurrent(true);
            restartAutoplay();
        }

        track.addEventListener("transitionend", () => {
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
            }, 3600);
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
                buildLoop();
            }, 180);
        });

        buildLoop();
        startAutoplay();

        console.log("Infinite stories carousel ready");
    }
})();