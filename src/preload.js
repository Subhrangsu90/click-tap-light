const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickTapLight', {
  getState: () => ipcRenderer.invoke('get-state'),
  setEnabled: (value) => ipcRenderer.send('set-enabled', value),
  setSettings: (value) => ipcRenderer.send('set-settings', value),
  resetSettings: () => ipcRenderer.send('reset-settings'),
  testClick: () => ipcRenderer.send('test-click'),
  onClick: (callback) => ipcRenderer.on('click', (_event, payload) => callback(payload)),
  onState: (callback) => ipcRenderer.on('state', (_event, payload) => callback(payload))
});
