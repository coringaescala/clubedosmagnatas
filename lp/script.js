const revealElements = document.querySelectorAll('.reveal');
const lines = document.querySelectorAll('.line');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.classList.contains('chart-box')) {
        lines.forEach(line => line.classList.add('animate'));
      }
    }
  });
}, { threshold: 0.16 });

revealElements.forEach(el => observer.observe(el));

const chartBox = document.querySelector('.chart-box');
if (chartBox) observer.observe(chartBox);

const ofertaSection = document.querySelector('#oferta');
const precoTarget = document.querySelector('#preco');
document.querySelectorAll('.cta').forEach(button => {
  if (ofertaSection && !ofertaSection.contains(button)) {
    button.addEventListener('click', () => {
      const target = precoTarget || ofertaSection;
      const y = target.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }
});

function initStreamCarousel(carousel) {
  const track = carousel.querySelector('.stream-track');
  const next = carousel.querySelector('.carousel-btn.next');
  const prev = carousel.querySelector('.carousel-btn.prev');
  const dots = carousel.parentElement.querySelector('.dots');

  if (!track || !next || !prev) return;

  const stateClasses = ['small', 'active', 'main'];
  const positionClasses = ['is-far-left', 'is-left', 'is-main', 'is-right', 'is-far-right'];
  const cards = Array.from(track.querySelectorAll('.stream-card'));
  const mainSlot = Math.floor(cards.length / 2);
  let dragStartX = 0;
  let dragDeltaX = 0;
  let isDragging = false;
  const dragLimit = 150;
  const dragThreshold = 45;

  const setDragOffset = (offset) => {
    track.style.setProperty('--drag-offset', `${offset}px`);
  };

  cards.forEach((card, index) => { card.dataset.index = index; });

  if (dots) {
    dots.innerHTML = cards.map((_, i) => `<span${i === mainSlot ? ' class="active"' : ''}></span>`).join('');
  }

  const syncCarousel = () => {
    const orderedCards = Array.from(track.querySelectorAll('.stream-card'));
    orderedCards.forEach((card, index) => {
      const distanceFromMain = Math.abs(index - mainSlot);
      card.classList.remove(...stateClasses, ...positionClasses);
      if (index < mainSlot - 1) card.classList.add('is-far-left');
      else if (index === mainSlot - 1) card.classList.add('is-left');
      else if (index === mainSlot) card.classList.add('is-main');
      else if (index === mainSlot + 1) card.classList.add('is-right');
      else card.classList.add('is-far-right');

      if (index === mainSlot) card.classList.add('active', 'main');
      else if (distanceFromMain === 1) card.classList.add('active');
      else card.classList.add('small');
    });

    if (dots) {
      const activeIndex = Number(orderedCards[mainSlot].dataset.index);
      dots.querySelectorAll('span').forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
      });
    }
  };

  const moveNext = () => { track.appendChild(track.firstElementChild); syncCarousel(); };
  const movePrev = () => { track.prepend(track.lastElementChild); syncCarousel(); };

  next.addEventListener('click', moveNext);
  prev.addEventListener('click', movePrev);

  const startDrag = (clientX) => {
    isDragging = true;
    dragStartX = clientX;
    dragDeltaX = 0;
    track.classList.add('is-dragging');
  };

  const updateDrag = (clientX) => {
    if (!isDragging) return;
    dragDeltaX = clientX - dragStartX;
    setDragOffset(Math.max(-dragLimit, Math.min(dragLimit, dragDeltaX)));
  };

  const finishDrag = () => {
    if (!isDragging) return;
    track.classList.remove('is-dragging');
    isDragging = false;
    if (Math.abs(dragDeltaX) < dragThreshold) { setDragOffset(0); dragDeltaX = 0; return; }
    if (dragDeltaX < 0) moveNext(); else movePrev();
    dragDeltaX = 0;
    requestAnimationFrame(() => setDragOffset(0));
  };

  track.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.student-video-cover')) return;
    if (e.button !== undefined && e.button !== 0) return;
    startDrag(e.clientX);
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => updateDrag(e.clientX));
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);

  track.addEventListener('touchstart', (e) => {
    if (e.target.closest('.student-video-cover')) return;
    if (e.touches.length) startDrag(e.touches[0].clientX);
  }, { passive: true });
  track.addEventListener('touchmove', (e) => { if (e.touches.length) updateDrag(e.touches[0].clientX); }, { passive: true });
  track.addEventListener('touchend', finishDrag);
  track.addEventListener('touchcancel', finishDrag);

  syncCarousel();
}

document.querySelectorAll('.stream-carousel').forEach(initStreamCarousel);

document.querySelectorAll('.student-video-cover').forEach(cover => {
  const playVideo = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (cover.classList.contains('is-playing')) return;

    const videoId = cover.dataset.youtubeId;
    if (!videoId) return;

    if (window.location.protocol === 'file:') {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener');
      return;
    }

    const card = cover.closest('.stream-card');
    const iframe = document.createElement('iframe');
    const origin = encodeURIComponent(window.location.origin);
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&origin=${origin}`;
    iframe.title = 'Depoimento em vídeo';
    iframe.allow = 'autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    cover.classList.add('is-playing');
    card?.classList.add('is-playing');
    cover.innerHTML = '';
    cover.appendChild(iframe);
  };

  cover.addEventListener('pointerdown', event => event.stopPropagation());
  cover.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
  cover.addEventListener('click', playVideo);
  cover.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    playVideo(event);
  });
});

const moduleTrack = document.querySelector('.module-scroll');
const moduleNext = document.querySelector('.module-next');
const modulePrev = document.querySelector('.module-prev');

if (moduleTrack && moduleNext && modulePrev) {
  const getModuleStep = () => {
    const card = moduleTrack.querySelector('.module-card');
    if (!card) return 260;
    const gap = parseFloat(getComputedStyle(moduleTrack).columnGap || getComputedStyle(moduleTrack).gap) || 20;
    return card.getBoundingClientRect().width + gap;
  };

  const getScrollMultiplier = () => window.innerWidth < 768 ? 1 : 2;

  moduleNext.addEventListener('click', () => {
    moduleTrack.scrollBy({ left: getModuleStep() * getScrollMultiplier(), behavior: 'smooth' });
  });

  modulePrev.addEventListener('click', () => {
    moduleTrack.scrollBy({ left: getModuleStep() * -getScrollMultiplier(), behavior: 'smooth' });
  });

  let isModuleDragging = false;
  let moduleStartX = 0;
  let moduleScrollStart = 0;

  const moduleDragStart = (x) => {
    isModuleDragging = true;
    moduleStartX = x;
    moduleScrollStart = moduleTrack.scrollLeft;
    moduleTrack.style.cursor = 'grabbing';
    moduleTrack.style.scrollSnapType = 'none';
  };

  const moduleDragMove = (x) => {
    if (!isModuleDragging) return;
    moduleTrack.scrollLeft = moduleScrollStart - (x - moduleStartX);
  };

  const moduleDragEnd = () => {
    if (!isModuleDragging) return;
    isModuleDragging = false;
    moduleTrack.style.cursor = '';
    moduleTrack.style.scrollSnapType = '';
  };

  moduleTrack.addEventListener('mousedown', (e) => { moduleDragStart(e.clientX); });
  window.addEventListener('mousemove', (e) => { moduleDragMove(e.clientX); });
  window.addEventListener('mouseup', moduleDragEnd);

  moduleTrack.addEventListener('touchstart', (e) => { moduleDragStart(e.touches[0].clientX); }, { passive: true });
  moduleTrack.addEventListener('touchmove', (e) => { moduleDragMove(e.touches[0].clientX); }, { passive: true });
  moduleTrack.addEventListener('touchend', moduleDragEnd);
}

const priceButton = document.querySelector('.cta-green');
if (priceButton) {
  priceButton.addEventListener('click', () => {
    priceButton.textContent = 'Redirecionando...';
    setTimeout(() => {
      priceButton.textContent = 'Quero garantir meu acesso agora';
    }, 1200);
  });
}

// Aplicar imagem em todos os cards do carrossel de bônus
document.querySelectorAll('.module-scroll article .image-placeholder').forEach(placeholder => {
  placeholder.style.cssText = [
    'background: url("assets/bonus-1-ex.jpg") center top / cover no-repeat',
    'border: 0',
    'box-shadow: none',
    'position: absolute',
    'inset: 0',
    'width: 100%',
    'height: 100%',
    'min-height: 100%'
  ].join(';');
  const s = placeholder.querySelector('span');
  const sm = placeholder.querySelector('small');
  if (s) s.style.display = 'none';
  if (sm) sm.style.display = 'none';
});
