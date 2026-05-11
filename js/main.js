"use strict";

(function () {
    const SELECTORS = {
        headerMount: "[data-site-header]",
        footerMount: "[data-site-footer]",
        serviceCards: "[data-service-cards]",
        serviceLinks: "[data-service-links]",
        footerServiceLinks: "[data-footer-service-links]",
        mobileServiceLinks: "[data-mobile-service-links]",
        navigation: "[data-navigation]",
        mobileNavigation: "[data-mobile-navigation]",
        faqList: "[data-faq-list]",
        faqSchema: "[data-faq-schema]",
        leadForm: "[data-lead-form]",
        contactForm: "[data-contact-form]",
        cookieMount: "[data-cookie-banner]",
        counter: "[data-counter-value]"
    };

    const FOCUSABLE_SELECTOR = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    let lastFocusedElement = null;

    document.addEventListener("DOMContentLoaded", initSite);

    function initSite() {
        const config = getConfig();

        if (!config) {
            console.warn("SITE_CONFIG is missing. Make sure /js/config.js is loaded before /js/main.js.");
            return;
        }

        applyPageMeta();
        renderHeader();
        renderFooter();
        applyConfig();
        renderServiceCards();
        renderServiceLinks();
        renderFaqBlocks();
        renderCookieBanner();
        initMobileMenu();
        initForms();
        initFaqAccordions();
        initCounters();
        initSimpleCarousels();
        setCurrentYear();

        const shouldRunConfigAudit = new URLSearchParams(window.location.search).has("audit");

        if (shouldRunConfigAudit) {
            window.requestAnimationFrame(() => {
                auditHardcodedBusinessData();
            });
        }
    }

    function getConfig() {
        return window.SITE_CONFIG || null;
    }

    function resolveConfigText(value) {
        if (value === null || value === undefined) return value;
        if (typeof value !== "string") return value;

        const config = getConfig();

        if (!config) return value;

        const replacements = {
            companyName: config.companyName,
            companyId: config.companyId,
            brandShortName: config.brand && config.brand.shortName,
            phone: config.phone,
            phoneButtonText: config.phoneButtonText || config.phone,
            phoneHref: config.phoneHref,
            phoneLabel: config.phoneLabel,
            email: config.email,
            address: config.address && config.address.full,
            serviceArea: config.serviceArea,
            footerText: config.footerText,
            disclaimer: config.disclaimer,
            legalNotice: config.legalNotice
        };

        const output = value.replace(/\{\{([a-zA-Z]+)\}\}|\{([a-zA-Z]+)\}/g, (match, mustacheKey, braceKey) => {
            const key = mustacheKey || braceKey;
            const replacement = replacements[key];
            return replacement === null || replacement === undefined ? match : String(replacement);
        });

        return output === value ? output : resolveConfigText(output);
    }

    function interpolateConfigText(value) {
        return resolveConfigText(value);
    }

    function currentPageName() {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf("/") + 1);
        return fileName || "index.html";
    }

    function applyPageMeta() {
        const config = getConfig();
        const page = currentPageName();
        const meta = config.pageMeta && config.pageMeta[page];

        if (!meta) {
            console.warn("pageMeta is missing for current page:", page);
            return;
        }

        if (meta.title) {
            document.title = interpolateConfigText(meta.title);
        }

        let description = document.querySelector("meta[name='description']");
        if (!description) {
            description = document.createElement("meta");
            description.setAttribute("name", "description");
            document.head.appendChild(description);
        }

        if (meta.description) {
            description.setAttribute("content", interpolateConfigText(meta.description));
        }
    }

    function applyConfig() {
        const config = getConfig();

        setText("[data-company-name]", config.companyName);
        setText("[data-company-id]", config.companyId);
        setText("[data-brand-short-name]", config.brand.shortName);
        setText("[data-brand-tagline]", config.brand.tagline);
        setText("[data-footer-text]", config.footerText);
        setText("[data-service-area]", config.serviceArea);
        setText("[data-address-text]", config.address.full);
        setText("[data-address-line1]", config.address.line1);
        setText("[data-address-city]", config.address.city);
        setText("[data-disclaimer]", config.disclaimer);
        setText("[data-legal-notice]", config.legalNotice);

        setText("[data-phone-text]", config.phoneButtonText || config.phone);
        setText("[data-phone-label]", config.phoneLabel);
        setText("[data-email-text]", config.email);

        setLinks("[data-phone-link]", config.phoneHref, config.phoneLabel);
        setLinks("[data-email-link]", `mailto:${config.email}`, `Email ${config.brand.shortName}`);

        const mapQuery = config.address && config.address.full ? config.address.full : "";
        const mapHref =
            config.mapHref ||
            (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "");

        setLinks("[data-map-link]", mapHref, `Open map for ${config.companyName}`);

        document.querySelectorAll("[data-config-text]").forEach((element) => {
            const key = element.getAttribute("data-config-text");
            const value = config.text && config.text[key];

            if (value) {
                element.textContent = interpolateConfigText(value);
                markConfigRendered(element);
            }
        });

        document.querySelectorAll("[data-form-title]").forEach((element) => {
            element.textContent = interpolateConfigText(config.forms.leadTitle);
            markConfigRendered(element);
        });

        document.querySelectorAll("[data-form-intro]").forEach((element) => {
            element.textContent = interpolateConfigText(config.forms.leadIntro);
            markConfigRendered(element);
        });

        document.querySelectorAll("[data-form-submit]").forEach((element) => {
            element.textContent = interpolateConfigText(config.forms.submitText);
            markConfigRendered(element);
        });

        document.querySelectorAll("[data-field-label]").forEach((element) => {
            const key = element.getAttribute("data-field-label");
            const label = config.forms.fields && config.forms.fields[key];

            if (label) {
                element.textContent = interpolateConfigText(label);
                markConfigRendered(element);
            }
        });

        document.querySelectorAll("[data-category-select]").forEach((select) => {
            renderCategorySelect(select);
        });

        document.querySelectorAll("[data-hero-bg]").forEach((element) => {
            const page = currentPageName();
            const hero = config.pageHeroes && config.pageHeroes[page];

            if (hero && hero.image) {
                element.setAttribute("src", hero.image);
                element.setAttribute("alt", "");
            }
        });

        document.querySelectorAll("[data-current-page-service]").forEach((element) => {
            const service = getCurrentService();

            if (!service) return;

            const field = element.getAttribute("data-current-page-service");
            const value = service[field];

            if (value) {
                element.textContent = interpolateConfigText(value);
                markConfigRendered(element);
            }
        });

        document.querySelectorAll("[data-current-page-service-bg]").forEach((image) => {
            const service = getCurrentService();

            if (!service || !service.heroImage) return;

            image.setAttribute("src", service.heroImage);
            image.setAttribute("alt", "");
        });
    }

    function setText(selector, value) {
        if (value === null || value === undefined || value === "") return;

        document.querySelectorAll(selector).forEach((element) => {
            element.textContent = interpolateConfigText(String(value));
            markConfigRendered(element);
        });
    }

    function setLinks(selector, href, ariaLabel) {
        document.querySelectorAll(selector).forEach((element) => {
            if (href) {
                element.setAttribute("href", href);
            }

            if (ariaLabel) {
                element.setAttribute("aria-label", interpolateConfigText(String(ariaLabel)));
            }

            markConfigRendered(element);
        });
    }

    function markConfigRendered(element) {
        element.setAttribute("data-allow-static", "true");
    }

    function renderHeader() {
        const config = getConfig();
        const mount = document.querySelector(SELECTORS.headerMount);

        if (!mount) return;

        mount.innerHTML = `
      <header class="site-header" data-generated-header>
        <div class="container-wide site-header-inner">
	          <a class="site-logo" href="index.html" aria-label="${escapeHtml(interpolateConfigText(config.brand.logoLabel))}" data-allow-static="true">
            ${getIcon("drop", "site-logo-icon")}
          <span class="site-logo-text">
         <span class="site-logo-name" data-company-name data-allow-static="true"></span>
         </span>
          </a>

          <nav class="desktop-nav" aria-label="Primary navigation" data-navigation></nav>

          <div class="header-actions">
            <a class="header-phone" data-phone-link data-allow-static="true">
              ${getIcon("phone")}
              <span data-phone-text data-allow-static="true"></span>
            </a>

            <a class="btn btn-primary" href="contact.html#request-info">
              <span data-config-text="finalCtaButton" data-allow-static="true"></span>
              ${getIcon("arrow-right")}
            </a>

            <button class="mobile-menu-toggle" type="button" aria-label="Open menu" aria-controls="mobileMenu" aria-expanded="false" data-mobile-menu-toggle>
              <span aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </header>

   <aside class="mobile-menu" id="mobileMenu" aria-label="Mobile navigation" data-mobile-menu inert>
  <div class="mobile-menu-backdrop" data-mobile-menu-close></div>

  <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Site menu">
    <div class="mobile-menu-top">
      <a class="mobile-menu-brand" href="index.html" data-mobile-menu-close data-allow-static="true">
        ${getIcon("drop", "mobile-menu-brand-icon")}
        <span>
          <strong data-company-name data-allow-static="true"></strong>
          <small data-brand-tagline data-allow-static="true"></small>
        </span>
      </a>

      <button class="mobile-menu-close" type="button" aria-label="Close menu" data-mobile-menu-close>
        <span></span>
      </button>
    </div>

    <div class="mobile-menu-content">
      <div class="mobile-menu-block">
        <p class="mobile-menu-title">Navigation</p>
        <nav class="mobile-nav-list" aria-label="Mobile primary navigation" data-mobile-navigation></nav>
      </div>

      <div class="mobile-menu-block">
        <p class="mobile-menu-title">Walk-In Tub Categories</p>
        <div class="mobile-services-list" data-mobile-service-links></div>
      </div>

      <div class="mobile-contact-card">
        <div class="mobile-contact-eyebrow">Request support</div>

        <a class="mobile-contact-link" data-phone-link data-allow-static="true">
          ${getIcon("phone")}
          <span data-phone-text data-allow-static="true"></span>
        </a>

        <a class="mobile-contact-link" data-email-link data-allow-static="true">
          ${getIcon("mail")}
          <span data-email-text data-allow-static="true"></span>
        </a>

        <a class="btn btn-primary mobile-menu-cta" href="contact.html#request-info" data-mobile-menu-close>
          <span data-config-text="finalCtaButton" data-allow-static="true"></span>
          ${getIcon("arrow-right")}
        </a>
      </div>
    </div>
  </div>
</aside>
    `;

        renderNavigation();
    }

    function renderNavigation() {
        const config = getConfig();

        document.querySelectorAll(SELECTORS.navigation).forEach((nav) => {
            nav.innerHTML = config.navigation
                .map((item) => {
                    const label = item.label || "";
                    const href = item.href || "";
                    const normalizedHref = href.replace("./", "").toLowerCase();

                    const active = normalizedHref === currentPageName().toLowerCase() ? " is-active" : "";

                    const isServices =
                        normalizedHref.includes("services") ||
                        label.toLowerCase().includes("service") ||
                        label.toLowerCase().includes("services");

                    if (isServices && Array.isArray(config.services) && config.services.length) {
                        const serviceLinks = config.services
                            .map((service) => {
                                return `
                                <a class="nav-dropdown-link" href="${escapeHtml(service.href)}" data-allow-static="true">
                                    <span>${escapeHtml(interpolateConfigText(service.shortTitle || service.title))}</span>
                                    ${getIcon("arrow-right")}
                                </a>
                            `;
                            })
                            .join("");

                        return `
                        <div class="nav-dropdown" data-allow-static="true">
	                            <a class="nav-link${active}" href="${escapeHtml(href)}" data-allow-static="true">
	                                ${escapeHtml(interpolateConfigText(label))}
                            </a>

                            <div class="nav-dropdown-panel" aria-label="Services list">
                                <div class="nav-dropdown-inner">
                                    <span class="nav-dropdown-kicker">Walk-In Tub Categories</span>
                                    ${serviceLinks}
                                </div>
                            </div>
                        </div>
                    `;
                    }

                    return `
	                    <a class="nav-link${active}" href="${escapeHtml(href)}" data-allow-static="true">
	                        ${escapeHtml(interpolateConfigText(label))}
                    </a>
                `;
                })
                .join("");
        });

        document.querySelectorAll(SELECTORS.mobileNavigation).forEach((nav) => {
            nav.innerHTML = config.navigation
                .map((item) => {
                    const active = item.href === currentPageName() ? " is-active" : "";

                    return `
	                    <a class="mobile-nav-link${active}" href="${escapeHtml(item.href)}" data-mobile-menu-close data-allow-static="true">
	                        <span>${escapeHtml(interpolateConfigText(item.label))}</span>
                        ${getIcon("arrow-right")}
                    </a>
                `;
                })
                .join("");
        });

        console.log("Desktop dropdown navigation rendered");
    }

    function renderFooter() {
        const config = getConfig();
        const mount = document.querySelector(SELECTORS.footerMount);

        if (!mount) return;

        mount.innerHTML = `
      <footer class="site-footer" data-generated-footer>
        <div class="container-wide">
          <div class="footer-main">
            <div class="footer-brand">
	              <a class="footer-logo" href="index.html" aria-label="${escapeHtml(interpolateConfigText(config.brand.logoLabel))}" data-allow-static="true">
                ${getIcon("drop", "site-logo-icon")}
                <span class="footer-logo-name" data-company-name data-allow-static="true"></span>
              </a>

              <p class="footer-text" data-footer-text data-allow-static="true"></p>

              <div class="btn-row">
                <a class="btn btn-primary" href="contact.html#request-info">
                  <span data-config-text="finalCtaButton" data-allow-static="true"></span>
                  ${getIcon("arrow-right")}
                </a>

                <a class="btn btn-secondary" data-phone-link data-allow-static="true">
                  ${getIcon("phone")}
                  <span data-phone-text data-allow-static="true"></span>
                </a>
              </div>
            </div>

            <div class="footer-column">
              <h2 class="footer-title">Navigation</h2>
              <div class="footer-links" data-footer-navigation></div>
            </div>

            <div class="footer-column">
              <h2 class="footer-title">Services</h2>
              <div class="footer-links" data-footer-service-links></div>
            </div>

            <div class="footer-column">
              <h2 class="footer-title">Contact</h2>
              <div class="footer-contact">
                <a data-phone-link data-allow-static="true">
                  <span data-phone-text data-allow-static="true"></span>
                </a>

                <a data-email-link data-allow-static="true">
                  <span data-email-text data-allow-static="true"></span>
                </a>

                <p data-address-text data-allow-static="true"></p>
                <p data-company-id data-allow-static="true"></p>
                <p data-service-area data-allow-static="true"></p>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <p class="footer-disclaimer" data-disclaimer data-allow-static="true"></p>

            <div class="footer-meta">
              <span>
                © <span data-current-year></span>
                <span data-company-name data-allow-static="true"></span>.
                All rights reserved.
              </span>

              <span data-legal-notice data-allow-static="true"></span>
            </div>
          </div>
        </div>
      </footer>
    `;

        renderFooterNavigation();
    }

    function renderFooterNavigation() {
        const config = getConfig();

        document.querySelectorAll("[data-footer-navigation]").forEach((container) => {
            container.innerHTML = config.navigation
                .map((item) => {
                    return `
	            <a class="footer-link" href="${escapeHtml(item.href)}" data-allow-static="true">
	              ${escapeHtml(interpolateConfigText(item.label))}
	            </a>
	          `;
                })
                .join("");

            renderFooterLegalLinks();
        });
    }

    function renderFooterLegalLinks() {
        document.querySelectorAll("[data-footer-navigation]").forEach((container) => {
            const legalLinks = [
                { label: "Privacy Policy", href: "privacy-policy.html" },
                { label: "Cookie Policy", href: "cookie-policy.html" },
                { label: "Terms of Service", href: "terms-of-service.html" }
            ];

            const legalHtml = legalLinks
                .map((item) => {
                    return `
            <a class="footer-link" href="${item.href}" data-allow-static="true">
              ${item.label}
            </a>
          `;
                })
                .join("");

            container.insertAdjacentHTML("beforeend", legalHtml);
        });
    }

    function renderServiceCards() {
        const config = getConfig();

        document.querySelectorAll(SELECTORS.serviceCards).forEach((container) => {
            const limit = Number(container.getAttribute("data-service-limit")) || config.services.length;
            const services = config.services.slice(0, limit);

            container.innerHTML = services.map((service) => createServiceCard(service)).join("");
        });
    }

    function createServiceCard(service) {
        return `
      <a class="service-card" href="${escapeHtml(service.href)}" data-service-id="${escapeHtml(service.id)}" data-allow-static="true">
        <span class="service-card-image" aria-hidden="true">
          <img src="${escapeHtml(service.image)}" alt="">
        </span>

        <span class="service-card-icon" aria-hidden="true">
          ${getIcon(service.icon)}
        </span>

	        <span class="service-card-content">
	          <h3>${escapeHtml(interpolateConfigText(service.title))}</h3>
	          <p>${escapeHtml(interpolateConfigText(service.summary))}</p>
	          <span class="card-arrow">
	            Compare options
	            ${getIcon("arrow-right")}
	          </span>
	        </span>
      </a>
    `;
    }

    function renderServiceLinks() {
        const config = getConfig();

        const linkGroups = [
            SELECTORS.serviceLinks,
            SELECTORS.footerServiceLinks,
            SELECTORS.mobileServiceLinks
        ];

        linkGroups.forEach((selector) => {
            document.querySelectorAll(selector).forEach((container) => {
                const isMobile = container.matches(SELECTORS.mobileServiceLinks);
                const isFooter = container.matches(SELECTORS.footerServiceLinks);

                container.innerHTML = config.services
                    .map((service) => {
                        const className = isMobile
                            ? "mobile-service-link"
                            : isFooter
                                ? "footer-link"
                                : "service-link";

	                        return `
	              <a class="${className}" href="${escapeHtml(service.href)}" data-mobile-menu-close data-allow-static="true">
	                <span>${escapeHtml(interpolateConfigText(service.shortTitle || service.title))}</span>
	                ${isMobile ? getIcon("arrow-right") : ""}
	              </a>
	            `;
	                    })
	                    .join("");
            });
        });
    }

    function renderCategorySelect(select) {
        const config = getConfig();
        const currentValue = select.value;

	        select.innerHTML = `
	      <option value="">${escapeHtml(interpolateConfigText(config.forms.categoryPlaceholder))}</option>
	      ${config.services
	                .map((service) => {
	                    return `
	            <option value="${escapeHtml(service.id)}">
	              ${escapeHtml(interpolateConfigText(service.title))}
	            </option>
	          `;
	                })
	                .join("")}
	    `;

        if (currentValue) {
            select.value = currentValue;
        }

        markConfigRendered(select);
    }

    function getCurrentService() {
        const config = getConfig();
        const page = currentPageName();

        return config.services.find((service) => service.href === page) || null;
    }

    function renderFaqBlocks() {
        const config = getConfig();

        document.querySelectorAll(SELECTORS.faqList).forEach((container) => {
            const type = container.getAttribute("data-faq-list");
            let faqs = [];

            if (type === "service") {
                const service = getCurrentService();
                faqs = service && service.faqs ? service.faqs : [];
            } else {
                faqs = config.faqs && config.faqs[type] ? config.faqs[type] : config.faqs.general;
            }

            container.innerHTML = faqs.map((faq, index) => createFaqItem(faq, index)).join("");
        });

        document.querySelectorAll(SELECTORS.faqSchema).forEach((script) => {
            const type = script.getAttribute("data-faq-schema");
            let faqs = [];

            if (type === "service") {
                const service = getCurrentService();
                faqs = service && service.faqs ? service.faqs : [];
            } else {
                faqs = config.faqs && config.faqs[type] ? config.faqs[type] : config.faqs.general;
            }

            script.textContent = JSON.stringify(createFaqSchema(faqs));
        });
    }

    function createFaqItem(faq, index) {
        const buttonId = `faq-button-${index + 1}`;
        const panelId = `faq-panel-${index + 1}`;

        return `
      <article class="faq-item">
	        <button class="faq-button" type="button" id="${buttonId}" aria-expanded="false" aria-controls="${panelId}">
	          ${escapeHtml(interpolateConfigText(faq.question))}
	          <span aria-hidden="true">+</span>
	        </button>

        <div class="faq-panel" id="${panelId}" role="region" aria-labelledby="${buttonId}">
	          <div class="faq-panel-inner">
	            <p>${escapeHtml(interpolateConfigText(faq.answer))}</p>
	          </div>
	        </div>
	      </article>
	    `;
    }

	    function createFaqSchema(faqs) {
	        return {
	            "@context": "https://schema.org",
	            "@type": "FAQPage",
	            mainEntity: faqs.map((faq) => {
	                return {
	                    "@type": "Question",
	                    name: interpolateConfigText(faq.question),
	                    acceptedAnswer: {
	                        "@type": "Answer",
	                        text: interpolateConfigText(faq.answer)
	                    }
	                };
	            })
	        };
	    }

    function renderCookieBanner() {
        const config = getConfig();
        const mount = document.querySelector(SELECTORS.cookieMount);

        if (!mount || !config.cookieBanner) return;

        const storedChoice = localStorage.getItem(config.cookieBanner.storageKey);

        mount.innerHTML = `
	      <div class="cookie-banner" role="dialog" aria-live="polite" aria-label="${escapeHtml(interpolateConfigText(config.cookieBanner.title))}" data-cookie-panel>
	        <div class="cookie-banner-inner">
	          <div class="cookie-content">
	            <h2 class="cookie-title">${escapeHtml(interpolateConfigText(config.cookieBanner.title))}</h2>
	            <p class="cookie-text">${escapeHtml(interpolateConfigText(config.cookieBanner.text))}</p>
	            <div class="cookie-links">
	              ${config.cookieBanner.links
	                .map((item) => {
	                    return `
	                    <a href="${escapeHtml(item.href)}" data-allow-static="true">
	                      ${escapeHtml(interpolateConfigText(item.label))}
	                    </a>
	                  `;
	                })
	                .join("")}
	            </div>
	          </div>

	          <div class="cookie-actions">
	            <button class="btn btn-secondary" type="button" data-cookie-decline>
	              ${escapeHtml(interpolateConfigText(config.cookieBanner.decline))}
	            </button>
	            <button class="btn btn-primary" type="button" data-cookie-accept>
	              ${escapeHtml(interpolateConfigText(config.cookieBanner.accept))}
	            </button>
	          </div>
	        </div>
	      </div>
	    `;

        const panel = mount.querySelector("[data-cookie-panel]");

        if (!storedChoice) {
            panel.classList.add("is-visible");
        }

        mount.querySelector("[data-cookie-accept]").addEventListener("click", () => {
            localStorage.setItem(config.cookieBanner.storageKey, "accepted");
            panel.classList.remove("is-visible");
        });

        mount.querySelector("[data-cookie-decline]").addEventListener("click", () => {
            localStorage.setItem(config.cookieBanner.storageKey, "declined");
            panel.classList.remove("is-visible");
        });
    }

    function initMobileMenu() {
        const menu = document.querySelector("[data-mobile-menu]");
        const toggle = document.querySelector("[data-mobile-menu-toggle]");

        if (!menu || !toggle) return;

        toggle.addEventListener("click", () => {
            const isOpen = menu.classList.contains("is-open");

            if (isOpen) {
                closeMobileMenu(menu, toggle);
            } else {
                openMobileMenu(menu, toggle);
            }
        });

        menu.addEventListener("click", (event) => {
            const closeTarget = event.target.closest("[data-mobile-menu-close]");

            if (closeTarget) {
                closeMobileMenu(menu, toggle);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (!menu.classList.contains("is-open")) return;

            if (event.key === "Escape") {
                closeMobileMenu(menu, toggle);
            }

            if (event.key === "Tab") {
                trapFocus(event, menu);
            }
        });
    }

    function openMobileMenu(menu, toggle) {
        lastFocusedElement = document.activeElement;

        document.body.classList.add("menu-open");
        menu.classList.add("is-open");
        menu.removeAttribute("inert");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");

        const firstFocusable = menu.querySelector(FOCUSABLE_SELECTOR);

        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    function closeMobileMenu(menu, toggle) {
        document.body.classList.remove("menu-open");
        menu.classList.remove("is-open");
        menu.setAttribute("inert", "");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    function trapFocus(event, container) {
        const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function initForms() {
        const config = getConfig();

        document.querySelectorAll(`${SELECTORS.leadForm}, ${SELECTORS.contactForm}`).forEach((form) => {
            form.addEventListener("submit", (event) => {
                event.preventDefault();

                const message = form.querySelector("[data-form-message]");
                const requiredFields = Array.from(form.querySelectorAll("[required]"));

                const isValid = requiredFields.every((field) => {
                    const valid = field.value.trim().length > 0;

                    field.toggleAttribute("aria-invalid", !valid);

                    return valid;
                });

                if (!message) return;

	                if (!isValid) {
	                    message.textContent = interpolateConfigText(config.forms.errorMessage);
	                    message.classList.add("is-error");
	                    return;
	                }

	                message.textContent = interpolateConfigText(config.forms.successMessage);
	                message.classList.remove("is-error");

                form.reset();

                form.querySelectorAll("[data-category-select]").forEach((select) => {
                    renderCategorySelect(select);
                });
            });
        });
    }

    function initFaqAccordions() {
        document.querySelectorAll(".faq-item").forEach((item) => {
            const button = item.querySelector(".faq-button");

            if (!button) return;

            button.addEventListener("click", () => {
                const isOpen = item.classList.toggle("is-open");
                button.setAttribute("aria-expanded", String(isOpen));
            });
        });
    }

    function initCounters() {
        const counters = document.querySelectorAll(SELECTORS.counter);

        if (!counters.length) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const runCounter = (counter) => {
            const target = Number(counter.getAttribute("data-counter-value")) || 0;
            const suffix = counter.getAttribute("data-counter-suffix") || "";

            if (prefersReducedMotion) {
                counter.textContent = `${target}${suffix}`;
                return;
            }

            let start = 0;
            const duration = 900;
            const startTime = performance.now();

            const tick = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.round(start + (target - start) * eased);

                counter.textContent = `${value}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        if (!("IntersectionObserver" in window)) {
            counters.forEach(runCounter);
            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    runCounter(entry.target);
                    currentObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.35 }
        );

        counters.forEach((counter) => observer.observe(counter));
    }

    function initSimpleCarousels() {
        document.querySelectorAll("[data-simple-carousel]").forEach((carousel) => {
            const track = carousel.querySelector("[data-carousel-track]");
            const prev = carousel.querySelector("[data-carousel-prev]");
            const next = carousel.querySelector("[data-carousel-next]");

            if (!track) return;

            const cards = Array.from(track.children);

            if (cards.length <= 1) return;

            let currentIndex = 0;
            let autoplayId = null;
            let isPaused = false;

            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const shouldAutoplay = carousel.hasAttribute("data-carousel-autoplay") && !reduceMotion;

            const getVisibleCount = () => {
                const firstCard = cards[0];

                if (!firstCard) return 1;

                const cardWidth = firstCard.getBoundingClientRect().width;
                const trackWidth = track.getBoundingClientRect().width;

                if (!cardWidth || !trackWidth) return 1;

                return Math.max(1, Math.floor(trackWidth / cardWidth));
            };

            const getMaxIndex = () => {
                return Math.max(0, cards.length - getVisibleCount());
            };

            const goTo = (index) => {
                const maxIndex = getMaxIndex();

                if (index > maxIndex) {
                    currentIndex = 0;
                } else if (index < 0) {
                    currentIndex = maxIndex;
                } else {
                    currentIndex = index;
                }

                const targetCard = cards[currentIndex];

                if (!targetCard) return;

                track.scrollTo({
                    left: targetCard.offsetLeft,
                    behavior: "smooth"
                });
            };

            const goNext = () => {
                goTo(currentIndex + 1);
            };

            const goPrev = () => {
                goTo(currentIndex - 1);
            };

            if (next) {
                next.addEventListener("click", (event) => {
                    event.preventDefault();
                    goNext();
                });
            }

            if (prev) {
                prev.addEventListener("click", (event) => {
                    event.preventDefault();
                    goPrev();
                });
            }

            const startAutoplay = () => {
                if (!shouldAutoplay) return;

                stopAutoplay();

                autoplayId = window.setInterval(() => {
                    if (isPaused) return;
                    goNext();
                }, 3600);
            };

            const stopAutoplay = () => {
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

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    stopAutoplay();
                } else {
                    startAutoplay();
                }
            });

            window.addEventListener("resize", () => {
                currentIndex = 0;

                track.scrollTo({
                    left: 0,
                    behavior: "auto"
                });
            });

            startAutoplay();
        });
    }

    function setCurrentYear() {
        document.querySelectorAll("[data-current-year]").forEach((element) => {
            element.textContent = String(new Date().getFullYear());
        });
    }

    function auditHardcodedBusinessData() {
        const config = getConfig();

        if (!config) return;

        const forbidden = [
            "AquaStep",
            "AquaStep Provider Matching LLC",
            "(855) 426-9283",
            "hello@aquastep.com",
            "123 Wellness Way",
            "Clearwater"
        ];

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();

        while (node) {
            const text = node.nodeValue || "";

            if (text.trim()) {
                const parent = node.parentElement;

                if (parent) {
                    const isAllowed =
                        parent.closest("script, style, noscript") ||
                        parent.closest("[data-allow-static]") ||
                        parent.closest("[data-generated-header]") ||
                        parent.closest("[data-generated-footer]") ||
                        parent.closest("[data-cookie-banner]") ||
                        parent.closest("[data-legal-sections]") ||
                        parent.closest("[data-phone-text]") ||
                        parent.closest("[data-email-text]") ||
                        parent.closest("[data-address-text]") ||
                        parent.closest("[data-disclaimer]") ||
                        parent.closest("[data-legal-notice]") ||
                        parent.closest("[data-config-text]") ||
                        parent.closest("[data-company-name]") ||
                        parent.closest("[data-company-id]");

                    if (!isAllowed) {
                        forbidden.forEach((value) => {
                            if (value && text.includes(value)) {
                                console.warn("Hardcoded business string found:", value, parent);
                            }
                        });
                    }
                }
            }

            node = walker.nextNode();
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getIcon(name, className) {
        const iconClass = className ? ` class="${className}"` : "";
        const common = `aria-hidden="true" focusable="false"${iconClass}`;

        const icons = {
            drop: `
        <svg ${common} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 3C24 3 5.5 25.2 5.5 41.1C5.5 53.1 13.6 61 24 61C34.4 61 42.5 53.1 42.5 41.1C42.5 25.2 24 3 24 3Z" stroke="currentColor" stroke-width="3"/>
          <path d="M16.8 42.4C16.8 48.4 20.5 52.2 25.8 52.2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          <path d="M30.6 25.3C33.1 30 35.2 35.1 35.2 40.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
        </svg>
      `,

            phone: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M7.2 4.5L9.5 4C10 3.9 10.5 4.2 10.7 4.7L12 7.8C12.2 8.3 12.1 8.8 11.7 9.2L10.4 10.5C11.4 12.7 13.2 14.5 15.5 15.6L16.8 14.3C17.2 13.9 17.7 13.8 18.2 14L21.3 15.3C21.8 15.5 22.1 16 22 16.5L21.5 18.8C21.3 19.5 20.7 20 20 20C10.6 20 4 13.4 4 4C4 3.3 4.5 2.7 5.2 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      `,

            mail: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M4 6.5H20V18H4V6.5Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M4.8 7.3L12 13L19.2 7.3" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      `,

            "map-pin": `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 18.5 14.8 18.5 8.8C18.5 5.2 15.6 2.5 12 2.5C8.4 2.5 5.5 5.2 5.5 8.8C5.5 14.8 12 21 12 21Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 11.2C13.3 11.2 14.3 10.2 14.3 8.9C14.3 7.6 13.3 6.6 12 6.6C10.7 6.6 9.7 7.6 9.7 8.9C9.7 10.2 10.7 11.2 12 11.2Z" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      `,

            "arrow-right": `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,

            droplet: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M12 2.8C12 2.8 5.8 10.2 5.8 15.3C5.8 19 8.4 21.4 12 21.4C15.6 21.4 18.2 19 18.2 15.3C18.2 10.2 12 2.8 12 2.8Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M9.2 15.8C9.2 17.7 10.4 18.9 12.2 18.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            waves: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M3 8.7C5.2 6.8 7.4 6.8 9.6 8.7C11.8 10.6 14 10.6 16.2 8.7C17.8 7.3 19.4 6.9 21 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3 13C5.2 11.1 7.4 11.1 9.6 13C11.8 14.9 14 14.9 16.2 13C17.8 11.6 19.4 11.2 21 11.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3 17.3C5.2 15.4 7.4 15.4 9.6 17.3C11.8 19.2 14 19.2 16.2 17.3C17.8 15.9 19.4 15.5 21 16.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            "shield-check": `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M12 2.8L19 5.4V10.8C19 15.2 16.3 19.2 12 21.2C7.7 19.2 5 15.2 5 10.8V5.4L12 2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M8.8 11.8L11.1 14.1L15.6 9.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,

            sparkles: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L13.5 8.4L19 10L13.5 11.6L12 17L10.5 11.6L5 10L10.5 8.4L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M18.5 15L19.2 17.1L21.4 17.8L19.2 18.5L18.5 20.7L17.8 18.5L15.6 17.8L17.8 17.1L18.5 15Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M5.4 14.6L6 16.2L7.6 16.8L6 17.4L5.4 19L4.8 17.4L3.2 16.8L4.8 16.2L5.4 14.6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      `,

            steps: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M4 18H10V14H15V10H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 21H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M7 15V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 11V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M17 7V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            checklist: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M8.5 6.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8.5 12H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M8.5 17.5H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3.8 6.5L5 7.7L7 5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.8 12L5 13.2L7 10.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.8 17.5L5 18.7L7 16.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,

            form: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M6 3.5H18V20.5H6V3.5Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M9 8H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M9 12H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M9 16H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            search: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M10.8 17.1C14.3 17.1 17.1 14.3 17.1 10.8C17.1 7.3 14.3 4.5 10.8 4.5C7.3 4.5 4.5 7.3 4.5 10.8C4.5 14.3 7.3 17.1 10.8 17.1Z" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15.4 15.4L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `,

            quote: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M7.5 7H11V11.1C11 14.3 9.5 16.4 6.5 17.6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M15 7H18.5V11.1C18.5 14.3 17 16.4 14 17.6" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      `,

            shield: `
        <svg ${common} viewBox="0 0 24 24" fill="none">
          <path d="M12 2.8L19 5.4V10.8C19 15.2 16.3 19.2 12 21.2C7.7 19.2 5 15.2 5 10.8V5.4L12 2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      `
        };

        return icons[name] || icons.droplet;
    }

    window.AquaStepSite = {
        interpolateConfigText,
        resolveConfigText,
        applyConfig,
        auditHardcodedBusinessData,
        renderServiceCards,
        renderFaqBlocks
    };
})();
