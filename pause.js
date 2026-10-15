'use strict';

// Menú de pausa. Depende de game.js (paused, init, startLevel, togglePause). Se carga antes de game.js; las variables de game.js
// (paused, init, startLevel...) se acceden solo dentro de funciones.

const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const pauseControls = document.getElementById('pause-controls');
const startLevelSel = document.getElementById('start-level');

const RESUME_GRACE_MS = 200;
let resumeUntil = 0;

for (let i = 1; i <= 10; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = i;
  startLevelSel.appendChild(opt);
}

// true mientras los controles del juego deben ignorarse tras cerrar el menú
function inputBlocked() {
  return performance.now() < resumeUntil;
}

function openPauseMenu() {
  startLevelSel.value = startLevel;
  pauseControls.classList.add('hidden');
  controlsBtn.textContent = 'Ver controles';
  pauseMenu.classList.remove('hidden');
  resumeBtn.focus();
}

function closePauseMenu(grace = true) {
  pauseMenu.classList.add('hidden');
  if (grace) resumeUntil = performance.now() + RESUME_GRACE_MS;
  // evita que Espacio/Enter reactive un botón enfocado
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', () => init());
controlsBtn.addEventListener('click', () => {
  const show = pauseControls.classList.toggle('hidden') === false;
  controlsBtn.textContent = show ? 'Ocultar controles' : 'Ver controles';
});
startLevelSel.addEventListener('change', () => {
  startLevel = parseInt(startLevelSel.value, 10);
});

// Mientras el menú está abierto, evita que las teclas del juego hagan scroll
document.addEventListener('keydown', e => {
  if (!paused) return;
  const tag = e.target.tagName;
  const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  if (arrows.includes(e.code) && tag !== 'SELECT') e.preventDefault();
  if (e.code === 'Space' && tag !== 'BUTTON' && tag !== 'SELECT') e.preventDefault();
});
