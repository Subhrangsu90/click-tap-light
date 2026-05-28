const stage = document.getElementById('stage');
let enabled = true;
let currentSettings = {
  color: '#655391',
  secondaryColor: '#fbf8ff',
  size: 96,
  duration: 620,
  stroke: 4,
  opacity: 96,
  glow: 32,
  showKeystrokes: true,
  keystrokeDuration: 1100,
  showLabel: true,
  labelText: 'Click'
};

function labelFor(button, settings) {
  if (settings.labelText && settings.labelText.trim()) return settings.labelText.trim();
  if (button === 'right') return 'Right';
  if (button === 'middle') return 'Middle';
  return 'Click';
}

function renderPulse(event) {
  if (!enabled) return;

  const settings = event.settings || currentSettings;
  const pulse = document.createElement('div');
  pulse.className = settings.followThrough ? 'pulse follow' : 'pulse';
  pulse.dataset.button = labelFor(event.button, settings);
  pulse.style.setProperty('--x', `${event.x}px`);
  pulse.style.setProperty('--y', `${event.y}px`);
  pulse.style.setProperty('--color', settings.color);
  pulse.style.setProperty('--secondary-color', settings.secondaryColor);
  pulse.style.setProperty('--size', `${settings.size}px`);
  pulse.style.setProperty('--duration', `${settings.duration}ms`);
  pulse.style.setProperty('--stroke', `${settings.stroke}px`);
  pulse.style.setProperty('--opacity', String(settings.opacity / 100));
  pulse.style.setProperty('--glow', `${settings.glow}px`);
  pulse.style.setProperty('--inner-opacity', settings.doubleRing ? '0.88' : '0');
  pulse.style.setProperty('--label-opacity', settings.showLabel ? '1' : '0');
  pulse.style.setProperty('--label-top', settings.labelPosition === 'top' ? 'auto' : 'calc(100% + 8px)');
  pulse.style.setProperty('--label-bottom', settings.labelPosition === 'top' ? 'calc(100% + 8px)' : 'auto');
  pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
  stage.appendChild(pulse);
}

function renderShortcut(event) {
  if (!enabled || !currentSettings.showKeystrokes || !event.keys) return;

  const shortcut = document.createElement('div');
  shortcut.className = 'shortcut';
  shortcut.textContent = event.keys;
  shortcut.style.setProperty('--duration', `${event.duration || currentSettings.keystrokeDuration}ms`);
  shortcut.addEventListener('animationend', () => shortcut.remove(), { once: true });
  stage.appendChild(shortcut);
}

window.clickTapLight.onState((state) => {
  enabled = state.enabled;
  currentSettings = state.settings;
});

window.clickTapLight.onClick(renderPulse);
window.clickTapLight.onShortcut(renderShortcut);
