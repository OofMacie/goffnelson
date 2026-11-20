// Delegated handlers keep carousels working after Tina re-renders a region in the editor.
const TRACK = '[data-carousel-track]';

function updateArrows(root: Element) {
  const track = root.querySelector<HTMLElement>(TRACK);
  if (!track) return;
  const left = root.querySelector<HTMLButtonElement>('[data-carousel-arrow="left"]');
  const right = root.querySelector<HTMLButtonElement>('[data-carousel-arrow="right"]');
  if (left) left.disabled = track.scrollLeft <= 8;
  if (right) right.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
}

const updateAll = () => document.querySelectorAll('[data-carousel]').forEach(updateArrows);

document.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-carousel-arrow]');
  const root = button?.closest('[data-carousel]');
  const track = root?.querySelector<HTMLElement>(TRACK);
  if (!button || !track) return;
  const direction = button.dataset.carouselArrow === 'right' ? 1 : -1;
  track.scrollBy({
    left: direction * track.clientWidth * 0.75,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
});

document.addEventListener(
  'scroll',
  (event) => {
    const target = event.target;
    if (target instanceof Element && target.matches(TRACK)) {
      const root = target.closest('[data-carousel]');
      if (root) updateArrows(root);
    }
  },
  true
);

// A broken image URL swaps to the placeholder instead of leaving a gap.
document.addEventListener(
  'error',
  (event) => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.closest('[data-carousel]')) {
      img.hidden = true;
      img.parentElement
        ?.querySelector<HTMLElement>('[data-placeholder]')
        ?.removeAttribute('hidden');
    }
  },
  true
);

let pending = 0;
new MutationObserver(() => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(updateAll);
}).observe(document.body, { childList: true, subtree: true });
window.addEventListener('resize', updateAll);
updateAll();
