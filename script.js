const body = document.body;
const header = document.querySelector("[data-header]");
const drawer = document.querySelector("[data-drawer]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const heroVideo = document.querySelector("[data-hero-video]");
const heroButtons = [...document.querySelectorAll("[data-hero-src]")];
const modal = document.querySelector("[data-modal]");
const modalBody = document.querySelector("[data-modal-body]");
const closeModalButton = document.querySelector("[data-close-modal]");
let modalReturnFocus = null;

const heroQueue = heroButtons.map((button) => button.dataset.heroSrc);
let activeHeroIndex = 0;

function setScrolledHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}

function setActiveHero(index, shouldPlay = true) {
  if (!heroVideo || !heroQueue[index]) return;
  activeHeroIndex = index;
  heroButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === index);
  });
  const source = heroVideo.querySelector("source");
  if (source.getAttribute("src") !== heroQueue[index]) {
    source.setAttribute("src", heroQueue[index]);
    heroVideo.load();
  }
  if (shouldPlay) {
    heroVideo.play().catch(() => {});
  }
}

function toggleMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !body.classList.contains("menu-open");
  body.classList.toggle("menu-open", shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
  drawer.setAttribute("aria-hidden", String(!shouldOpen));
  drawer.inert = !shouldOpen;
}

function openVideo(src, trigger = null) {
  modalReturnFocus = trigger;
  modalBody.innerHTML = `
    <video controls autoplay playsinline preload="auto">
      <source src="${src}" type="video/mp4" />
    </video>
  `;
  openModal();
}

function openImage(src, alt = "", trigger = null) {
  modalReturnFocus = trigger;
  modalBody.innerHTML = `<img src="${src}" alt="${alt}" />`;
  openModal();
}

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  modal.inert = false;
  body.classList.add("modal-open");
  closeModalButton.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modal.inert = true;
  body.classList.remove("modal-open");
  modalBody.innerHTML = "";
  modalReturnFocus?.focus?.();
  modalReturnFocus = null;
}

setScrolledHeader();
window.addEventListener("scroll", setScrolledHeader, { passive: true });

if (menuToggle) {
  menuToggle.addEventListener("click", () => toggleMenu());
}

drawer.inert = true;
modal.inert = true;

drawer?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    toggleMenu(false);
  }
});

heroButtons.forEach((button, index) => {
  button.addEventListener("click", () => setActiveHero(index));
});

heroVideo?.addEventListener("ended", () => {
  setActiveHero((activeHeroIndex + 1) % heroQueue.length);
});

window.addEventListener(
  "load",
  () => {
    window.requestIdleCallback ? requestIdleCallback(() => setActiveHero(0)) : setTimeout(() => setActiveHero(0), 250);
  },
  { once: true }
);

document.querySelectorAll("[data-open-video]").forEach((button) => {
  button.addEventListener("click", () => openVideo(button.dataset.openVideo, button));
});

document.querySelectorAll("[data-open-image]").forEach((button) => {
  button.addEventListener("click", () => {
    const image = button.querySelector("img");
    openImage(button.dataset.openImage, image?.alt || "", button);
  });
});

closeModalButton?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modal.classList.contains("is-open")) closeModal();
    if (body.classList.contains("menu-open")) toggleMenu(false);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sectionLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -50% 0px", threshold: 0 }
);

sections.forEach((section) => sectionObserver.observe(section));
