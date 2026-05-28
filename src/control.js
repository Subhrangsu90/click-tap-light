const fields = {
  enabled: document.getElementById('enabled'),
  color: document.getElementById('color'),
  secondaryColor: document.getElementById('secondaryColor'),
  size: document.getElementById('size'),
  duration: document.getElementById('duration'),
  stroke: document.getElementById('stroke'),
  glow: document.getElementById('glow'),
  opacity: document.getElementById('opacity'),
  sizeValue: document.getElementById('sizeValue'),
  durationValue: document.getElementById('durationValue'),
  strokeValue: document.getElementById('strokeValue'),
  glowValue: document.getElementById('glowValue'),
  opacityValue: document.getElementById('opacityValue'),
  labelPosition: document.getElementById('labelPosition'),
  labelText: document.getElementById('labelText'),
  showLabel: document.getElementById('showLabel'),
  doubleRing: document.getElementById('doubleRing'),
  followThrough: document.getElementById('followThrough'),
  left: document.getElementById('left'),
  right: document.getElementById('right'),
  middle: document.getElementById('middle'),
  test: document.getElementById('test'),
  reset: document.getElementById('reset'),
  platformStatus: document.getElementById('platformStatus'),
  platformMessage: document.getElementById('platformMessage')
};

const presets = {
  demo: {
    color: '#00d4ff',
    secondaryColor: '#ffffff',
    size: 116,
    duration: 720,
    stroke: 5,
    opacity: 100,
    glow: 44,
    showLabel: true,
    labelText: 'Click',
    labelPosition: 'bottom',
    doubleRing: true,
    followThrough: true
  },
  review: {
    color: '#ffcc00',
    secondaryColor: '#101418',
    size: 132,
    duration: 880,
    stroke: 6,
    opacity: 94,
    glow: 36,
    showLabel: true,
    labelText: 'Focus',
    labelPosition: 'top',
    doubleRing: true,
    followThrough: false
  },
  subtle: {
    color: '#7cf7b5',
    secondaryColor: '#ffffff',
    size: 76,
    duration: 500,
    stroke: 3,
    opacity: 76,
    glow: 12,
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
  fields.labelPosition.value = settings.labelPosition;
  fields.labelText.value = settings.labelText || '';
  fields.showLabel.checked = settings.showLabel;
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
  document.documentElement.style.setProperty('--accent', settings.color);
  document.documentElement.style.setProperty('--soft', `${settings.color}24`);
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
    labelPosition: fields.labelPosition.value,
    labelText: fields.labelText.value.trim().slice(0, 18),
    showLabel: fields.showLabel.checked,
    doubleRing: fields.doubleRing.checked,
    followThrough: fields.followThrough.checked,
    highlightLeft: fields.left.checked,
    highlightRight: fields.right.checked,
    highlightMiddle: fields.middle.checked
  };

  fields.sizeValue.value = `${settings.size}px`;
  fields.durationValue.value = `${settings.duration}ms`;
  fields.strokeValue.value = `${settings.stroke}px`;
  fields.glowValue.value = `${settings.glow}px`;
  fields.opacityValue.value = `${settings.opacity}%`;
  document.documentElement.style.setProperty('--accent', settings.color);
  window.clickTapLight.setSettings(settings);
}

fields.enabled.addEventListener('change', () => {
  window.clickTapLight.setEnabled(fields.enabled.checked);
});

for (const field of [
  fields.color,
  fields.secondaryColor,
  fields.size,
  fields.duration,
  fields.stroke,
  fields.glow,
  fields.opacity,
  fields.labelPosition,
  fields.labelText,
  fields.showLabel,
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

fields.reset.addEventListener('click', () => {
  window.clickTapLight.resetSettings();
});

for (const presetButton of document.querySelectorAll('.preset')) {
  presetButton.addEventListener('click', () => {
    for (const button of document.querySelectorAll('.preset')) {
      button.classList.toggle('active', button === presetButton);
    }
    window.clickTapLight.setSettings(presets[presetButton.dataset.preset]);
    window.clickTapLight.testClick();
  });
}

window.clickTapLight.onState(applyState);
window.clickTapLight.getState().then(applyState);
