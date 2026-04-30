// Event Bus — The Nervous System
class EventBusClass {
  constructor() {
    this.listeners = {}
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
  }

  emit(event, data) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach((cb) => {
      try {
        cb(data)
      } catch (e) {
        console.error('EventBus error:', e)
      }
    })
  }
}

export const EventBus = new EventBusClass()
