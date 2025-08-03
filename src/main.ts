import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/index.css'

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('Service Worker registered successfully:', registration)
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, show update notification
              console.log('New app version available')
              // You could dispatch an event to show an update notification to the user
            }
          })
        }
      })
      
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

// Global offline/online status tracking
let isOnline = navigator.onLine

const updateOnlineStatus = () => {
  const wasOffline = !isOnline
  isOnline = navigator.onLine
  
  // Dispatch custom events for components to listen to
  if (wasOffline && isOnline) {
    window.dispatchEvent(new CustomEvent('app-online'))
  } else if (!isOnline) {
    window.dispatchEvent(new CustomEvent('app-offline'))
  }
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

// Initialize Vue application
const app = createApp(App)

app.use(createPinia())
app.use(router)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  
  // In production, you might want to send errors to a logging service
  if (import.meta.env.PROD) {
    // Log to service (e.g., Sentry, LogRocket, etc.)
  }
}

app.mount('#app')