const startButton = document.querySelector('.start-button');
const nextButton = document.querySelector('.navigation-button');
const fadeOverlay = document.querySelector('.fade-overlay') || (() => {
  const overlay = document.createElement('div');
  overlay.className = 'fade-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);
  return overlay;
})();
const sections = [
  document.getElementById('section-poem'),
  document.getElementById('section-story-1'),
  document.getElementById('section-story-2'),
  document.getElementById('section-story-3'),
  document.getElementById('section-final'),
].filter(Boolean);
let currentIndex = -1;
let navigationStarted = false;
let manualScrollAllowed = false;
const urlParams = new URLSearchParams(window.location.search);
const isExperienceFinished = urlParams.get('done') === 'true';

if (isExperienceFinished) {
  manualScrollAllowed = true;
  unlockScroll();
} else {
  document.body.classList.add('scroll-lock');
}

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  {
    threshold: 0.22,
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

function preventScroll(event) {
  if (manualScrollAllowed) return;

  const target = event.target;
  if (target instanceof Element) {
    const isLinksArea = target.closest('.poem-links');
    const isScrollContainer = target.closest('.section-poem__copy') || target.closest('.poem-text') || target.closest('.poem-page');
    if (isLinksArea || isScrollContainer) return;
  }

  event.preventDefault();
}

window.addEventListener('wheel', preventScroll, { passive: false });
window.addEventListener('touchmove', preventScroll, { passive: false });
window.addEventListener('keydown', (event) => {
  const target = event.target;
  let allowInputKeys = false;

  if (target instanceof Element) {
    const isLinksArea = target.closest('.poem-links');
    const isFormInput = target.matches('input, textarea, select');
    allowInputKeys = Boolean(isLinksArea || isFormInput);
  }

  const blockedKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'];
  if (!manualScrollAllowed && blockedKeys.includes(event.key) && !allowInputKeys) {
    event.preventDefault();
  }
}, { passive: false });

function unlockScroll() {
  manualScrollAllowed = true;
  document.body.classList.remove('scroll-lock');
}

function lockScroll() {
  manualScrollAllowed = false;
  document.body.classList.add('scroll-lock');
}

function goToSection(index) {
  if (index < 0 || index >= sections.length) return;
  currentIndex = index;
  lockScroll();
  sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (!nextButton) return;
  nextButton.classList.add('hidden');
  if (index >= sections.length - 1) {
    unlockScroll();
  } else {
    // For the first section (prologue) create a small pause so emotion lingers
    if (index === 0) {
      setTimeout(() => {
        if (currentIndex === index) {
          nextButton.dataset.next = sections[index + 1].id;
          nextButton.classList.remove('hidden');
        }
      }, 4200);
    } else {
      nextButton.dataset.next = sections[index + 1].id;
      nextButton.classList.remove('hidden');
    }
  }
}

const transitionToPage = (targetUrl) => {
  fadeOverlay.classList.add('visible');
  setTimeout(() => {
    window.location.assign(new URL(targetUrl, document.baseURI).href);
  }, 700);
};

const navigationButtons = document.querySelectorAll('.start-button, .memories-button');

navigationButtons.forEach((button) => {
  button.addEventListener('click', () => {
    unlockScroll();
    const targetUrl = button.dataset.href || 'memorias.html';
    transitionToPage(targetUrl);
  });
});

const goToSectionUrl = (sectionId) => {
  history.replaceState(null, '', `?done=true#${sectionId}`);
  unlockScroll();
};

if (nextButton) {
  nextButton.addEventListener('click', () => {
    const nextId = nextButton.dataset.next;
    const index = sections.findIndex((section) => section.id === nextId);
    if (index !== -1) {
      goToSection(index);
    }
  });
}

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const move = Math.min(scrollY * 0.08, 80);
  document.body.style.backgroundPosition = `center ${move}px`;
});

const poemLinks = document.querySelectorAll('.poem-links a');

const carousels = document.querySelectorAll('[data-carousel]');
const imageModal = document.getElementById('imageModal');

if (imageModal) {
  const modalImage = imageModal.querySelector('.image-modal__image');
  const modalDots = imageModal.querySelector('.image-modal__dots');
  const modalPrevButton = imageModal.querySelector('[data-modal-prev]');
  const modalNextButton = imageModal.querySelector('[data-modal-next]');
  const modalCloseButtons = imageModal.querySelectorAll('[data-close-modal]');
  const modalContent = imageModal.querySelector('.image-modal__content');

  const closeModal = () => {
    imageModal.classList.remove('is-open');
    imageModal.setAttribute('aria-hidden', 'true');
  };

  const renderModalDots = (images, activeIndex) => {
    if (!modalDots) return;
    modalDots.innerHTML = '';
    images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `image-modal__dot${index === activeIndex ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Ir para a foto ${index + 1}`);
      dot.addEventListener('click', () => {
        activeModalIndex = index;
        renderModalDots(images, activeModalIndex);
        if (modalImage) {
          modalImage.src = images[activeModalIndex].src;
          modalImage.alt = images[activeModalIndex].alt || '';
        }
      });
      modalDots.appendChild(dot);
    });
  };

  let activeModalIndex = 0;
  let activeModalImages = [];

  const openModal = (images, index) => {
    activeModalImages = images;
    activeModalIndex = (index + activeModalImages.length) % activeModalImages.length;
    if (!activeModalImages.length || !modalImage) return;
    modalImage.src = activeModalImages[activeModalIndex].src;
    modalImage.alt = activeModalImages[activeModalIndex].alt || '';
    renderModalDots(activeModalImages, activeModalIndex);
    imageModal.classList.add('is-open');
    imageModal.setAttribute('aria-hidden', 'false');
  };

  if (modalPrevButton) {
    modalPrevButton.addEventListener('click', () => {
      if (!activeModalImages.length) return;
      activeModalIndex = (activeModalIndex - 1 + activeModalImages.length) % activeModalImages.length;
      modalImage.src = activeModalImages[activeModalIndex].src;
      modalImage.alt = activeModalImages[activeModalIndex].alt || '';
      renderModalDots(activeModalImages, activeModalIndex);
    });
  }

  if (modalNextButton) {
    modalNextButton.addEventListener('click', () => {
      if (!activeModalImages.length) return;
      activeModalIndex = (activeModalIndex + 1) % activeModalImages.length;
      modalImage.src = activeModalImages[activeModalIndex].src;
      modalImage.alt = activeModalImages[activeModalIndex].alt || '';
      renderModalDots(activeModalImages, activeModalIndex);
    });
  }

  modalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  imageModal.addEventListener('click', closeModal);
  if (modalContent) {
    modalContent.addEventListener('click', (event) => event.stopPropagation());
  }

  document.addEventListener('keydown', (event) => {
    if (!imageModal.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (!activeModalImages.length) return;
      activeModalIndex = (activeModalIndex + 1) % activeModalImages.length;
      modalImage.src = activeModalImages[activeModalIndex].src;
      modalImage.alt = activeModalImages[activeModalIndex].alt || '';
      renderModalDots(activeModalImages, activeModalIndex);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (!activeModalImages.length) return;
      activeModalIndex = (activeModalIndex - 1 + activeModalImages.length) % activeModalImages.length;
      modalImage.src = activeModalImages[activeModalIndex].src;
      modalImage.alt = activeModalImages[activeModalIndex].alt || '';
      renderModalDots(activeModalImages, activeModalIndex);
    }
  });
}

carousels.forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
  const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
  const prevButton = carousel.querySelector('.carousel-control.prev');
  const nextButton = carousel.querySelector('.carousel-control.next');
  const modalImages = slides.map((slide) => slide.querySelector('img')).filter(Boolean);
  let currentIndex = 0;
  let autoplayId;

  const updateCarousel = (index) => {
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    if (track) {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === currentIndex);
    });
  };

  const startAutoplay = () => {
    clearInterval(autoplayId);
    autoplayId = window.setInterval(() => {
      updateCarousel(currentIndex + 1);
    }, 4000);
  };

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      updateCarousel(currentIndex - 1);
      startAutoplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      updateCarousel(currentIndex + 1);
      startAutoplay();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      updateCarousel(index);
      startAutoplay();
    });
  });

  modalImages.forEach((image, index) => {
    image.addEventListener('click', () => {
      if (typeof openModal === 'function') {
        openModal(modalImages, index);
      }
    });
  });

  carousel.addEventListener('mouseenter', () => clearInterval(autoplayId));
  carousel.addEventListener('mouseleave', startAutoplay);

  updateCarousel(0);
  startAutoplay();
});

/* Poem page behavior (applies when viewing a single poem page) */
if (document.querySelector('.poem-page')) {
  const isFinalPoem = document.body.classList.contains('final-poem');

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.querySelector('.poem-page');
    const header = document.querySelector('.poem-header');
    const poem = document.querySelector('.poem-text');
    // show panel after small delay so background is perceived first
    setTimeout(() => page.classList.add('is-visible'), 200);
    setTimeout(() => header.classList.add('is-visible'), 600);
    setTimeout(() => poem.classList.add('is-visible'), 1100);
    // Allow the user to scroll the poem after the panel and text are visible
    setTimeout(() => { unlockScroll(); }, 1200);

    if (isFinalPoem) {
      let endingStarted = false;

      const finishPoem = () => {
        if (endingStarted) return;
        endingStarted = true;
        poem.removeEventListener('scroll', checkPoemEnd);

        window.setTimeout(() => {
          document.body.classList.add('final-poem-ending');

          window.setTimeout(() => {
            document.body.classList.add('final-poem-complete');
            document.querySelector('.poem-link')?.setAttribute('aria-disabled', 'true');
            document.querySelector('.final-poem-message')?.setAttribute('aria-hidden', 'false');
          }, 3800);
        }, 5000);
      };

      const checkPoemEnd = () => {
        const reachedEnd = poem.scrollTop + poem.clientHeight >= poem.scrollHeight - 12;
        if (reachedEnd) finishPoem();
      };

      poem.addEventListener('scroll', checkPoemEnd, { passive: true });
    }
  });

  // Handle exit animation before navigating back
  document.addEventListener('click', function (e) {
    const target = e.target.closest && e.target.closest('.poem-link');
    if (!target) return;
    if (isFinalPoem && document.body.classList.contains('final-poem-complete')) return;
    const href = target.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    const page = document.querySelector('.poem-page');
    const header = document.querySelector('.poem-header');
    const poem = document.querySelector('.poem-text');
    poem.classList.remove('is-visible');
    header.classList.remove('is-visible');
    page.classList.remove('is-visible');
    fadeOverlay.classList.add('visible');
    setTimeout(() => {
      window.location.assign(new URL(href, document.baseURI).href);
    }, 700);
  });
}

// If the page was opened with a hash to the prologue, start navigation there
window.addEventListener('load', () => {
  if (window.location.hash === '#section-poem') {
    // small delay to ensure layout is ready
    setTimeout(() => {
      navigationStarted = true;
      manualScrollAllowed = false;
      lockScroll();
      goToSection(0);
    }, 120);
  }
});
