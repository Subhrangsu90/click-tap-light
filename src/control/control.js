const fields = {
  enabled: document.getElementById('enabled'),
  color: document.getElementById('color'),
  secondaryColor: document.getElementById('secondaryColor'),
  size: document.getElementById('size'),
  duration: document.getElementById('duration'),
  stroke: document.getElementById('stroke'),
  glow: document.getElementById('glow'),
  opacity: document.getElementById('opacity'),
  keystrokeDuration: document.getElementById('keystrokeDuration'),
  sizeValue: document.getElementById('sizeValue'),
  durationValue: document.getElementById('durationValue'),
  strokeValue: document.getElementById('strokeValue'),
  glowValue: document.getElementById('glowValue'),
  opacityValue: document.getElementById('opacityValue'),
  keystrokeDurationValue: document.getElementById('keystrokeDurationValue'),
  labelPosition: document.getElementById('labelPosition'),
  labelText: document.getElementById('labelText'),
  showLabel: document.getElementById('showLabel'),
  showKeystrokes: document.getElementById('showKeystrokes'),
  launchAtStartup: document.getElementById('launchAtStartup'),
  keepOnTop: document.getElementById('keepOnTop'),
  doubleRing: document.getElementById('doubleRing'),
  followThrough: document.getElementById('followThrough'),
  left: document.getElementById('left'),
  right: document.getElementById('right'),
  middle: document.getElementById('middle'),
  test: document.getElementById('test'),
  quickPreview: document.getElementById('quickPreview'),
  reset: document.getElementById('reset'),
  resetPreset: document.getElementById('resetPreset'),
  themeToggle: document.getElementById('themeToggle'),
  minimizeWindow: document.getElementById('minimizeWindow'),
  closeWindow: document.getElementById('closeWindow'),
  platformStatus: document.getElementById('platformStatus'),
  platformMessage: document.getElementById('platformMessage'),
  statusPill: document.getElementById('statusPill')
};

const presets = {
  demo: {
    color: '#655391',
    secondaryColor: '#fbf8ff',
    size: 116,
    duration: 720,
    stroke: 5,
    opacity: 100,
    glow: 44,
    showKeystrokes: true,
    keystrokeDuration: 1100,
    showLabel: true,
    labelText: 'Click',
    labelPosition: 'bottom',
    doubleRing: true,
    followThrough: true
  },
  review: {
    color: '#b8edf0',
    secondaryColor: '#211d2b',
    size: 132,
    duration: 880,
    stroke: 6,
    opacity: 94,
    glow: 36,
    showKeystrokes: true,
    keystrokeDuration: 1400,
    showLabel: true,
    labelText: 'Focus',
    labelPosition: 'top',
    doubleRing: true,
    followThrough: false
  },
  subtle: {
    color: '#cdbbf4',
    secondaryColor: '#ffffff',
    size: 76,
    duration: 500,
    stroke: 3,
    opacity: 76,
    glow: 12,
    showKeystrokes: false,
    keystrokeDuration: 800,
    showLabel: false,
    labelText: '',
    labelPosition: 'bottom',
    doubleRing: false,
    followThrough: false
  }
};

let state = {
  enabled: true,
  settings: {}
};
let activePreset = 'demo';

const themeStorageKey = 'click-glow-theme-v1';

document.addEventListener('pointerdown', () => {
  window.clickTapLight.noteControlInteraction();
}, true);

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = safeTheme;
  fields.themeToggle.innerHTML = `<span class="material-symbols-rounded">${safeTheme === 'light' ? 'light_mode' : 'dark_mode'}</span>`;
  fields.themeToggle.setAttribute('aria-label', `Use ${safeTheme === 'light' ? 'dark' : 'light'} theme`);
  localStorage.setItem(themeStorageKey, safeTheme);
}

function setActivePreset(preset) {
  activePreset = preset;
  for (const button of document.querySelectorAll('.preset')) {
    button.classList.toggle('active', button.dataset.preset === preset);
  }
}

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--soft', `${color}24`);
}

function applyState(nextState) {
  state = nextState;
  const settings = state.settings;

  fields.platformStatus.classList.toggle('unsupported', !state.platform.supported);
  fields.platformMessage.textContent = state.platform.message;
  fields.enabled.checked = state.enabled;
  fields.color.value = settings.color;
  fields.secondaryColor.value = settings.secondaryColor;
  fields.size.value = settings.size;
  fields.duration.value = settings.duration;
  fields.stroke.value = settings.stroke;
  fields.glow.value = settings.glow;
  fields.opacity.value = settings.opacity;
  fields.keystrokeDuration.value = settings.keystrokeDuration;
  fields.labelPosition.value = settings.labelPosition;
  fields.labelText.value = settings.labelText || '';
  fields.showLabel.checked = settings.showLabel;
  fields.showKeystrokes.checked = settings.showKeystrokes;
  fields.launchAtStartup.checked = state.launchAtStartup;
  fields.keepOnTop.checked = true;
  fields.doubleRing.checked = settings.doubleRing;
  fields.followThrough.checked = settings.followThrough;
  fields.left.checked = settings.highlightLeft;
  fields.right.checked = settings.highlightRight;
  fields.middle.checked = settings.highlightMiddle;
  fields.sizeValue.value = `${settings.size}px`;
  fields.durationValue.value = `${settings.duration}ms`;
  fields.strokeValue.value = `${settings.stroke}px`;
  fields.glowValue.value = `${settings.glow}px`;
  fields.opacityValue.value = `${settings.opacity}%`;
  fields.keystrokeDurationValue.value = `${settings.keystrokeDuration}ms`;
  fields.statusPill.classList.toggle('paused', !state.enabled);
  fields.statusPill.innerHTML = `<span class="material-symbols-rounded">${state.enabled ? 'bolt' : 'pause'}</span>${state.enabled ? 'Active' : 'Paused'}`;
  applyAccent(settings.color);
}

function sendSettings() {
  const settings = {
    color: fields.color.value,
    secondaryColor: fields.secondaryColor.value,
    size: Number(fields.size.value),
    duration: Number(fields.duration.value),
    stroke: Number(fields.stroke.value),
    glow: Number(fields.glow.value),
    opacity: Number(fields.opacity.value),
    keystrokeDuration: Number(fields.keystrokeDuration.value),
    labelPosition: fields.labelPosition.value,
    labelText: fields.labelText.value.trim().slice(0, 18),
    showLabel: fields.showLabel.checked,
    showKeystrokes: fields.showKeystrokes.checked,
    doubleRing: fields.doubleRing.checked,
    followThrough: fields.followThrough.checked,
    highlightLeft: fields.left.checked,
    highlightRight: fields.right.checked,
    highlightMiddle: fields.middle.checked,
    controlAlwaysOnTop: true
  };

  fields.sizeValue.value = `${settings.size}px`;
  fields.durationValue.value = `${settings.duration}ms`;
  fields.strokeValue.value = `${settings.stroke}px`;
  fields.glowValue.value = `${settings.glow}px`;
  fields.opacityValue.value = `${settings.opacity}%`;
  fields.keystrokeDurationValue.value = `${settings.keystrokeDuration}ms`;
  applyAccent(settings.color);
  window.clickTapLight.setSettings(settings);
}

fields.enabled.addEventListener('change', () => {
  window.clickTapLight.setEnabled(fields.enabled.checked);
});

fields.launchAtStartup.addEventListener('change', () => {
  window.clickTapLight.setLaunchAtStartup(fields.launchAtStartup.checked);
});

for (const field of [
  fields.color,
  fields.secondaryColor,
  fields.size,
  fields.duration,
  fields.stroke,
  fields.glow,
  fields.opacity,
  fields.keystrokeDuration,
  fields.labelPosition,
  fields.labelText,
  fields.showLabel,
  fields.showKeystrokes,
  fields.doubleRing,
  fields.followThrough,
  fields.left,
  fields.right,
  fields.middle
]) {
  field.addEventListener('input', sendSettings);
  field.addEventListener('change', sendSettings);
}

fields.test.addEventListener('click', () => {
  window.clickTapLight.testClick();
});

fields.quickPreview.addEventListener('click', () => {
  window.clickTapLight.testClick();
});

fields.reset.addEventListener('click', () => {
  if (confirm('Reset all ClickGlow settings?')) {
    setActivePreset('demo');
    window.clickTapLight.resetSettings();
  }
});

fields.resetPreset.addEventListener('click', () => {
  window.clickTapLight.setSettings(presets[activePreset]);
  window.clickTapLight.testClick();
});

fields.themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

fields.minimizeWindow.addEventListener('click', () => {
  window.clickTapLight.minimizeControls();
});

fields.closeWindow.addEventListener('click', () => {
  window.clickTapLight.closeControls();
});

for (const presetButton of document.querySelectorAll('.preset')) {
  presetButton.addEventListener('click', () => {
    setActivePreset(presetButton.dataset.preset);
    window.clickTapLight.setSettings(presets[activePreset]);
    window.clickTapLight.testClick();
  });
}

applyTheme(localStorage.getItem(themeStorageKey) || 'light');
window.clickTapLight.onState(applyState);
window.clickTapLight.getState().then(applyState);
