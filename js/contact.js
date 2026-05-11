"use strict";

(function () {
    document.addEventListener("DOMContentLoaded", initContactPage);

    function initContactPage() {
        const config = window.SITE_CONFIG;

        if (!config) {
            console.warn("SITE_CONFIG is missing on contact page.");
            return;
        }

        initContactReveal();
        initMapCardMotion();
        initContactFormEnhancements();
    }

    function initContactReveal() {
        const elements = document.querySelectorAll(
            ".contact-form-copy, .contact-form-panel, .contact-detail-card, .contact-map-copy, .contact-map-card, .contact-faq-copy, .faq-item"
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
            element.classList.add("contact-reveal");
            element.style.setProperty("--contact-reveal-delay", `${Math.min(index * 45, 220)}ms`);
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

    function initMapCardMotion() {
        const mapCard = document.querySelector(".contact-map-card");
        const pinCard = document.querySelector(".map-pin-card");

        if (!mapCard || !pinCard) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion) return;

        mapCard.addEventListener("mousemove", (event) => {
            const rect = mapCard.getBoundingClientRect();

            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;

            pinCard.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        });

        mapCard.addEventListener("mouseleave", () => {
            pinCard.style.transform = "translate(-50%, -50%)";
        });
    }

    function initContactFormEnhancements() {
        const form = document.querySelector("[data-contact-form]");

        if (!form) return;

        const phoneInput = form.querySelector("input[type='tel']");
        const zipInput = form.querySelector("input[name='zip']");

        if (phoneInput) {
            phoneInput.addEventListener("input", () => {
                phoneInput.value = formatPhoneInput(phoneInput.value);
            });
        }

        if (zipInput) {
            zipInput.addEventListener("input", () => {
                zipInput.value = zipInput.value.replace(/[^\d-]/g, "").slice(0, 10);
            });
        }

        form.addEventListener("submit", () => {
            const firstInvalid = form.querySelector("[aria-invalid='true']");

            if (firstInvalid) {
                firstInvalid.focus();
            }
        });
    }

    function formatPhoneInput(value) {
        const numbers = value.replace(/\D/g, "").slice(0, 10);

        if (numbers.length <= 3) {
            return numbers;
        }

        if (numbers.length <= 6) {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        }

        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
})();