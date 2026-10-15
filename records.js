'use strict';

// Tabla de records local (localStorage). Se carga antes de game.js; las
// variables de game.js (score, lines, ...) se leen de forma perezosa.

const RECORDS_KEY = 'tetris.records';
const TOP_SIZE = 5;
const NAME_MAX = 12;
const DEFAULT_NAME = 'Anónimo';

const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const startTop = document.getElementById('start-top');
const startStats = document.getElementById('start-stats');
const startResetBtn = document.getElementById('start-reset-btn');
const goRecords = document.getElementById('gameover-records');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const saveBtn = document.getElementById('save-btn');
const goTop = document.getElementById('go-top');
const goStats = document.getElementById('go-stats');
const goResetBtn = document.getElementById('go-reset-btn');

function emptyRecords() {
  return { top: [], bestCombo: 0, maxLines: 0 };
}

function loadRecords() {
  const rec = emptyRecords();
  try {
    const data = JSON.parse(localStorage.getItem(RECORDS_KEY));
    if (!data || typeof data !== 'object') return rec;
    if (Array.isArray(data.top)) {
      rec.top = data.top
        .filter(e => e && Number.isFinite(e.score))
        .map(e => ({
          name: String(e.name ?? DEFAULT_NAME).slice(0, NAME_MAX),
          score: e.score,
          lines: Number.isFinite(e.lines) ? e.lines : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_SIZE);
    }
    if (Number.isFinite(data.bestCombo)) rec.bestCombo = data.bestCombo;
    if (Number.isFinite(data.maxLines)) rec.maxLines = data.maxLines;
  } catch (e) { /* datos corruptos o localStorage no disponible */ }
  return rec;
}

function saveRecords(rec) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(rec));
  } catch (e) { /* almacenamiento no disponible */ }
}

function qualifiesForTop(rec, s) {
  if (s <= 0) return false;
  return rec.top.length < TOP_SIZE || s > rec.top[rec.top.length - 1].score;
}

// Dibuja el top en un <ol>; highlight es el índice a resaltar (o -1)
function renderTop(listEl, rec, highlight) {
  listEl.textContent = '';
  if (!rec.top.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sin records todavía';
    listEl.appendChild(li);
    return;
  }
  rec.top.forEach((e, i) => {
    const li = document.createElement('li');
    if (i === highlight) li.className = 'highlight';
    const name = document.createElement('span');
    name.className = 'rec-name';
    name.textContent = `${i + 1}. ${e.name}`;
    const val = document.createElement('span');
    val.className = 'rec-score';
    val.textContent = `${e.score.toLocaleString()} · ${e.lines} líneas`;
    li.append(name, val);
    listEl.appendChild(li);
  });
}

function renderStats(el, rec) {
  el.textContent = `Mejor combo: ${rec.bestCombo} · Líneas máximas: ${rec.maxLines}`;
}

function refreshRecordViews(highlight = -1) {
  const rec = loadRecords();
  renderTop(startTop, rec, -1);
  renderStats(startStats, rec);
  renderTop(goTop, rec, highlight);
  renderStats(goStats, rec);
}

function resetRecords() {
  saveRecords(emptyRecords());
  // tras resetear ya no hay nada que guardar con nombre
  nameForm.classList.add('hidden');
  refreshRecordViews();
}

function showStartScreen() {
  refreshRecordViews();
  startOverlay.classList.remove('hidden');
}

function hideGameOverRecords() {
  goRecords.classList.add('hidden');
}

// Llamado desde endGame(): actualiza mejores marcas y muestra el top
let finalScore = 0, finalLines = 0; // instantánea de la partida terminada

function showGameOverRecords() {
  finalScore = score;
  finalLines = lines;
  const rec = loadRecords();
  rec.bestCombo = Math.max(rec.bestCombo, maxCombo);
  rec.maxLines = Math.max(rec.maxLines, lines);
  saveRecords(rec);

  const qualifies = qualifiesForTop(rec, finalScore);
  nameForm.classList.toggle('hidden', !qualifies);
  nameInput.value = '';
  saveBtn.disabled = false;
  refreshRecordViews();
  goRecords.classList.remove('hidden');
  if (qualifies) nameInput.focus();
}

function submitName() {
  if (saveBtn.disabled) return;
  const rec = loadRecords();
  if (!qualifiesForTop(rec, finalScore)) return;
  const name = nameInput.value.trim().slice(0, NAME_MAX) || DEFAULT_NAME;
  const entry = { name, score: finalScore, lines: finalLines };
  // empate: la entrada nueva va después de las existentes con igual puntuación
  let idx = rec.top.findIndex(e => e.score < finalScore);
  if (idx === -1) idx = rec.top.length;
  rec.top.splice(idx, 0, entry);
  rec.top.length = Math.min(rec.top.length, TOP_SIZE);
  saveRecords(rec);
  saveBtn.disabled = true;
  nameForm.classList.add('hidden');
  refreshRecordViews(idx);
}

// El input no debe disparar teclas de juego (P, Space, flechas...)
nameInput.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.code === 'Enter') submitName();
});
nameForm.addEventListener('submit', e => e.preventDefault());
saveBtn.addEventListener('click', submitName);

function confirmReset() {
  if (confirm('¿Borrar todos los records?')) resetRecords();
}
startResetBtn.addEventListener('click', confirmReset);
goResetBtn.addEventListener('click', confirmReset);

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  init();
});

showStartScreen();
