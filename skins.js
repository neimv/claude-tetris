'use strict';

// Skins visuales. Cada skin define paleta (indexada 1-7 como COLORS), color de
// rejilla y una función de dibujo de bloque. El fondo de los canvas lo pone CSS
// mediante body[data-skin].

const SKIN_KEY = 'tetris.skin';

// Rectángulo redondeado con fallback manual si no existe roundRect
function roundedPath(context, x, y, w, h, r) {
  context.beginPath();
  if (context.roundRect) {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const SKINS = {
  retro: {
    colors: [
      null,
      '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d',
    ],
    grid: '#22222e',
    block(context, x, y, color, size) {
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    },
  },

  neon: {
    colors: [
      null,
      '#00f0ff', '#fff700', '#d400ff', '#39ff14', '#ff1744', '#4d6bff', '#ff9100',
    ],
    grid: '#14142a',
    block(context, x, y, color, size) {
      const px = x * size, py = y * size;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fillStyle = color;
      context.fillRect(px + 3, py + 3, size - 6, size - 6);
      context.shadowBlur = 0;
      // núcleo oscuro para dar aspecto de tubo de neón
      context.fillStyle = 'rgba(0,0,0,0.45)';
      context.fillRect(px + 7, py + 7, size - 14, size - 14);
      context.shadowColor = 'transparent';
    },
  },

  pastel: {
    colors: [
      null,
      '#a8e6ef', '#fff1b8', '#d8b4e8', '#b8e6bf', '#f7b6b6', '#b4bce8', '#ffd4a3',
    ],
    grid: '#2c2c3c',
    block(context, x, y, color, size) {
      const px = x * size, py = y * size;
      roundedPath(context, px + 2, py + 2, size - 4, size - 4, size * 0.28);
      context.fillStyle = color;
      context.fill();
      // brillo suave arriba
      roundedPath(context, px + 5, py + 5, size - 10, 5, 2.5);
      context.fillStyle = 'rgba(255,255,255,0.35)';
      context.fill();
    },
  },

  pixel: {
    colors: [
      null,
      '#3cc4d6', '#f2c230', '#a24cc0', '#4caf50', '#d84a4a', '#4a5cc0', '#ee8a1e',
    ],
    grid: '#1f1f2b',
    block(context, x, y, color, size) {
      const px = x * size, py = y * size;
      const u = Math.max(1, Math.floor(size / 6)); // tamaño del "píxel"
      // borde oscuro
      context.fillStyle = 'rgba(0,0,0,0.85)';
      context.fillRect(px, py, size, size);
      context.fillStyle = color;
      context.fillRect(px + u / 2, py + u / 2, size - u, size - u);
      // textura: damero de dos tonos
      const n = Math.floor((size - u * 2) / u);
      context.fillStyle = 'rgba(0,0,0,0.16)';
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if ((r + c) % 2 === 0)
            context.fillRect(px + u + c * u, py + u + r * u, u, u);
      // reflejo en esquina superior izquierda
      context.fillStyle = 'rgba(255,255,255,0.45)';
      context.fillRect(px + u, py + u, u * 2, u);
      context.fillRect(px + u, py + u, u, u * 2);
    },
  },
};

const Skins = (() => {
  let name = 'retro';

  function isSkin(value) {
    return Object.prototype.hasOwnProperty.call(SKINS, value);
  }

  function load() {
    try {
      const saved = localStorage.getItem(SKIN_KEY);
      if (isSkin(saved)) return saved;
    } catch (e) { /* localStorage no disponible */ }
    return 'retro';
  }

  function drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    const skin = SKINS[name];
    context.save();
    context.globalAlpha = alpha ?? 1;
    skin.block(context, x, y, skin.colors[colorIndex], size);
    context.restore();
  }

  function gridColor() {
    return SKINS[name].grid;
  }

  function apply(newName, persist) {
    if (!isSkin(newName)) return;
    name = newName;
    document.body.dataset.skin = name;
    if (persist) {
      try { localStorage.setItem(SKIN_KEY, name); } catch (e) { /* ignorar */ }
    }
    // Redibujar sólo si el juego ya está inicializado (let globales de game.js)
    if (typeof next !== 'undefined' && next) drawNext();
    if (typeof board !== 'undefined' && board && typeof current !== 'undefined' && current) draw();
  }

  function init() {
    const select = document.getElementById('skin');
    apply(load(), false);
    if (!select) return;
    select.value = name;
    select.addEventListener('change', () => {
      apply(select.value, true);
      select.blur();
    });
    // Flechas/Espacio con el selector enfocado no deben cambiarlo: se quita el
    // foco y la tecla llega al juego.
    select.addEventListener('keydown', e => {
      if (e.code.startsWith('Arrow') || e.code === 'Space') {
        e.preventDefault();
        select.blur();
      }
    });
  }

  return { drawBlock, gridColor, apply, init };
})();

Skins.init();
