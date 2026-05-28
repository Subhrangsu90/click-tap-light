const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickTapLight', {
  getState: () => ipcRenderer.invoke('get-state'),
  setEnabled: (value) => ipcRenderer.send('set-enabled', value),
  setLaunchAtStartup: (value) => ipcRenderer.send('set-launch-at-startup', value),
  setSettings: (value) => ipcRenderer.send('set-settings', value),
  resetSettings: () => ipcRenderer.send('reset-settings'),
  testClick: () => ipcRenderer.send('test-click'),
  minimizeControls: () => ipcRenderer.send('window-control', 'minimize'),
  closeControls: () => ipcRenderer.send('window-control', 'close'),
  onClick: (callback) => ipcRenderer.on('click', (_event, payload) => callback(payload)),
  onShortcut: (callback) => ipcRenderer.on('shortcut', (_event, payload) => callback(payload)),
  onState: (callback) => ipcRenderer.on('state', (_event, payload) => callback(payload))
});
