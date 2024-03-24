CSS.paintWorklet.addModule('./js/sketchy-arrow.js');

{
  const container = document.querySelector('.space-invaders');
  container.insertAdjacentHTML('beforeend', Array.from({ length: 60 }, () => '<svg viewBox="0 0 12 8"><path/></svg>').join(''));
  container.insertAdjacentHTML(
    'beforeend',
    Array.from({ length: 3 }, () => '<svg viewBox="0 0 24 16" class="bunker"><path/></svg>').join('')
  );
}
