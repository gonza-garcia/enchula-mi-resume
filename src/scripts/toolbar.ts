import { LANG_STORAGE_KEY as STORAGE_KEY, POSITIONING_STORAGE_KEY } from './storage-keys';

type Locale = 'es' | 'en';

// ===== Toggle de idioma =====
const btnEn = document.getElementById('btn-en') as HTMLButtonElement | null;
const btnEs = document.getElementById('btn-es') as HTMLButtonElement | null;

function currentLang(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // localStorage no disponible: default EN
  }
  return 'en';
}

function setLangButtons(lang: Locale) {
  btnEn?.setAttribute('aria-pressed', String(lang === 'en'));
  btnEs?.setAttribute('aria-pressed', String(lang === 'es'));
}

setLangButtons(currentLang());

function changeLang(lang: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage no disponible
  }
  setLangButtons(lang);
  document.dispatchEvent(new CustomEvent('toolbar:lang-change', { detail: { lang } }));
}

btnEn?.addEventListener('click', () => changeLang('en'));
btnEs?.addEventListener('click', () => changeLang('es'));

// ===== Toggle de posicionamiento =====
const positioningButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button[data-positioning]')
);

function currentPositioning(): string {
  const ids = positioningButtons.map((button) => button.dataset.positioning || '');
  try {
    const saved = localStorage.getItem(POSITIONING_STORAGE_KEY);
    if (saved && ids.includes(saved)) return saved;
  } catch {
    // localStorage no disponible
  }
  return ids[0] ?? '';
}

function setPositioningButtons(id: string) {
  positioningButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.positioning === id));
  });
}

function changePositioning(id: string) {
  try {
    localStorage.setItem(POSITIONING_STORAGE_KEY, id);
  } catch {
    // storage no disponible
  }
  setPositioningButtons(id);
  document.dispatchEvent(new CustomEvent('toolbar:positioning-change', { detail: { positioning: id } }));
}

if (positioningButtons.length > 0) {
  setPositioningButtons(currentPositioning());
  positioningButtons.forEach((button) => {
    button.addEventListener('click', () => changePositioning(button.dataset.positioning || ''));
  });
}

// ===== Panel de tema (compartido) =====
const THEME_KEY = 'resume-theme';
const ACCENTS_KEY = 'resume-accents';
const CUSTOM_KEY = 'resume-theme-custom';
const DEFAULT_THEME = 'navy';
const DEFAULT_ACCENT = '#1a365d';
const DEFAULT_ACCENTS = ['name', 'sections', 'urls', 'skills'];
const AAA_THRESHOLD = 7;

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastVsWhite(hex: string) {
  return (1.0 + 0.05) / (luminance(hex) + 0.05);
}

const rootEl = document.documentElement;
const themeButtons = document.querySelectorAll<HTMLButtonElement>('.theme-presets button[data-theme]');
const accentCbs = document.querySelectorAll<HTMLInputElement>('input[data-accent]');
const customPicker = document.querySelector<HTMLInputElement>('#theme-custom-color');
const customPickerWrap = document.querySelector<HTMLLabelElement>('.theme-picker');
const customSwatch = document.querySelector<HTMLElement>('[data-custom-swatch]');
const feedback = document.getElementById('theme-feedback');

function applyTheme(theme: string) {
  let effective = theme;
  if (theme === 'custom') {
    const c = localStorage.getItem(CUSTOM_KEY) || DEFAULT_ACCENT;
    if (contrastVsWhite(c) < AAA_THRESHOLD) {
      effective = 'navy';
      try { localStorage.setItem(THEME_KEY, 'navy'); } catch {}
    }
  }
  rootEl.setAttribute('data-theme', effective);
  themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === effective)));
  const isCustom = effective === 'custom';
  if (customPickerWrap) customPickerWrap.hidden = !isCustom;
  if (isCustom && customPicker) {
    const c = localStorage.getItem(CUSTOM_KEY) || DEFAULT_ACCENT;
    rootEl.style.setProperty('--accent', c);
    customPicker.value = c;
    if (customSwatch) customSwatch.style.background = c;
    if (feedback) {
      const r = contrastVsWhite(c);
      feedback.textContent = `Contraste ${r.toFixed(1)}:1 \u2014 ok`;
      feedback.className = 'theme-feedback ok';
      feedback.hidden = false;
    }
  } else {
    rootEl.style.removeProperty('--accent');
    if (customSwatch) {
      customSwatch.style.background =
        getComputedStyle(rootEl).getPropertyValue('--accent').trim() || DEFAULT_ACCENT;
    }
    if (feedback) feedback.hidden = true;
  }
}

function applyAccents(accents: string[]) {
  rootEl.setAttribute('data-accents', accents.join(' '));
  accentCbs.forEach((cb) => { cb.checked = accents.includes(cb.dataset.accent || ''); });
}

applyTheme(localStorage.getItem(THEME_KEY) || DEFAULT_THEME);
applyAccents((localStorage.getItem(ACCENTS_KEY) || DEFAULT_ACCENTS.join(' ')).split(/\s+/).filter(Boolean));

themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.theme || DEFAULT_THEME;
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch {}
  });
});

customPicker?.addEventListener('input', (e) => {
  const v = (e.target as HTMLInputElement).value;
  const ratio = contrastVsWhite(v);
  if (ratio >= AAA_THRESHOLD) {
    rootEl.style.setProperty('--accent', v);
    if (customSwatch) customSwatch.style.background = v;
    try { localStorage.setItem(CUSTOM_KEY, v); } catch {}
    if (feedback) {
      feedback.textContent = `Contraste ${ratio.toFixed(1)}:1 \u2014 ok`;
      feedback.className = 'theme-feedback ok';
      feedback.hidden = false;
    }
  } else {
    if (feedback) {
      feedback.textContent = `Contraste ${ratio.toFixed(1)}:1 \u2014 m\u00ednimo ${AAA_THRESHOLD}:1`;
      feedback.className = 'theme-feedback error';
      feedback.hidden = false;
    }
  }
});

accentCbs.forEach((cb) => {
  cb.addEventListener('change', () => {
    const acc: string[] = [];
    accentCbs.forEach((c) => { if (c.checked) acc.push(c.dataset.accent || ''); });
    applyAccents(acc);
    try { localStorage.setItem(ACCENTS_KEY, acc.join(' ')); } catch {}
  });
});
