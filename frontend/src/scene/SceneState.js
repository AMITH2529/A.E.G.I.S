export const sceneState = {
  isForging: false,
  shouldExport: false,
  systemState: 'Offline',
  lastCommand: '',
  objects: [
    { id: 'placeholder-1', position: [0, 0, 0], scale: 1, color: '#00f3ff' }
  ],
  chatLog: [
    { role: 'aegis', text: 'Systems Online. Awaiting input.' }
  ],
  listeners: [],
  
  addLog(role, text) {
    this.chatLog.push({ role, text });
    // keep only last 10
    if (this.chatLog.length > 10) this.chatLog.shift();
    this.notify();
  },
  
  notify() {
    this.listeners.forEach(fn => fn());
  },
  
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
};
