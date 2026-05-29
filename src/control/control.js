const fields = {
  enabled: document.getElementById('enabled'),
  keepOnTop: document.getElementById('keepOnTop'),
  test: document.getElementById('test'),
  openSettings: document.getElementById('openSettings'),
  minimizeWindow: document.getElementById('minimizeWindow'),
  closeWindow: document.getElementById('closeWindow'),
  statusPill: document.getElementById('statusPill')
};

const themeStorageKey = 'click-glow-theme-v1';
let state = {
  enabled: true,
  settings: {}
};
let currentTheme = null;

document.addEventListener('pointerdown', () => {
  window.clickTapLight.noteControlInteraction();
}, true);

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  currentTheme = safeTheme;
  document.documentElement.dataset.theme = safeTheme;
}

function syncThemeFromStorage() {
  const storedTheme = localStorage.getItem(themeStorageKey) || 'light';
  if (storedTheme !== currentTheme) applyTheme(storedTheme);
}

function applyState(nextState) {
  state = nextState;
  fields.enabled.checked = state.enabled;
  fields.keepOnTop.checked = Boolean(state.settings.controlAlwaysOnTop);

  const isActive = state.enabled && state.platform.supported;
  const statusIcon = isActive ? 'bolt' : 'pause';
  const statusText = isActive ? 'Active' : 'Paused';
  fields.statusPill.classList.toggle('paused', !isActive);
  fields.statusPill.innerHTML = `<span class="material-symbols-rounded">${statusIcon}</span>${statusText}`;
}

fields.enabled.addEventListener('change', () => {
  window.clickTapLight.setEnabled(fields.enabled.checked);
});

fields.keepOnTop.addEventListener('change', () => {
  window.clickTapLight.setSettings({
    ...state.settings,
    controlAlwaysOnTop: fields.keepOnTop.checked
  });
});

fields.test.addEventListener('click', () => {
  window.clickTapLight.testClick();
});

fields.openSettings.addEventListener('click', () => {
  window.clickTapLight.openSettings();
});

fields.minimizeWindow.addEventListener('click', () => {
  window.clickTapLight.minimizeControls();
});

fields.closeWindow.addEventListener('click', () => {
  window.clickTapLight.closeControls();
});

syncThemeFromStorage();
window.addEventListener('storage', (event) => {
  if (event.key === themeStorageKey) {
    applyTheme(event.newValue || 'light');
  }
});
window.addEventListener('focus', syncThemeFromStorage);
document.addEventListener('visibilitychange', syncThemeFromStorage);
window.clickTapLight.onState(applyState);
window.clickTapLight.getState().then(applyState);
