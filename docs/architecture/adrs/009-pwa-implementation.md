# ADR-009: Progressive Web App Implementation Strategy

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Frontend Team, UX Team
- **Consulted**: Mobile Team, Performance Team
- **Informed**: All Stakeholders

## Context

We needed to implement Progressive Web App (PWA) capabilities for our CRM system to provide enhanced user experience, especially for mobile users and offline scenarios. The requirements included:

- **Mobile Experience**: Native app-like experience on mobile devices
- **Offline Functionality**: Basic functionality when internet connection is unavailable
- **Performance**: Fast loading and smooth interactions
- **Installation**: Ability to install the app on user devices
- **Push Notifications**: Real-time notifications for important updates
- **Caching Strategy**: Intelligent caching for performance and offline use
- **Responsive Design**: Seamless experience across all device sizes

The alternatives considered were:
1. **Full PWA with Service Worker**: Complete PWA implementation
2. **Native Mobile Apps**: Separate iOS and Android applications
3. **Responsive Web Only**: Standard responsive website without PWA features
4. **Hybrid App Framework**: Cordova, Ionic, or React Native
5. **Progressive Enhancement**: Gradual PWA feature addition

## Decision

We will implement a **Progressive Web App with Service Worker** for our CRM system, providing offline functionality, installability, and enhanced mobile experience.

**Core PWA Features:**
- **Service Worker**: Background sync and caching strategies
- **Web App Manifest**: Installation and app-like behavior
- **Offline Support**: Critical functionality available offline
- **Push Notifications**: Real-time updates and alerts
- **Responsive Design**: Mobile-first responsive interface

## Rationale

### PWA Advantages
- **Single Codebase**: Maintain one codebase for web and mobile
- **Cross-Platform**: Works on all devices with modern browsers
- **App-like Experience**: Native app feel without app store distribution
- **Offline Capability**: Continue working without internet connection
- **Performance**: Fast loading through intelligent caching
- **Cost Effective**: No separate native app development needed

### User Experience Benefits
- **Mobile-First**: Optimized for mobile sales teams in the field
- **Offline Access**: View contacts and data without internet
- **Installation**: Add to home screen for quick access
- **Fast Loading**: Cached resources for instant startup
- **Push Notifications**: Real-time alerts for important updates

### Technical Benefits
- **Service Worker**: Background processing and sync capabilities
- **Cache Strategy**: Intelligent caching for performance and offline use
- **Web Standards**: Built on modern web platform capabilities
- **Progressive Enhancement**: Features work incrementally based on browser support

### Business Benefits
- **Increased Engagement**: App-like experience increases user retention
- **Mobile Sales**: Better support for field sales representatives
- **Reduced Development Cost**: Single codebase vs. multiple native apps
- **Easy Distribution**: No app store approval process

## Consequences

### Positive
- **Enhanced Mobile Experience**: Native app-like feel on mobile devices
- **Offline Functionality**: Users can work without internet connectivity
- **Improved Performance**: Faster loading through caching strategies
- **Easy Installation**: Users can install directly from browser
- **Push Notifications**: Real-time engagement with users
- **Cost Efficiency**: Single codebase for all platforms

### Negative
- **Browser Limitations**: Limited by browser PWA support variations
- **Storage Constraints**: Limited offline storage compared to native apps
- **Performance Trade-offs**: May not match native app performance
- **Complex Caching**: Sophisticated cache management required

### Risks
- **Medium Risk**: Browser PWA support inconsistencies
  - **Mitigation**: Progressive enhancement and feature detection
- **Low Risk**: Cache management complexity
  - **Mitigation**: Use proven caching strategies and monitoring
- **Medium Risk**: Offline data synchronization conflicts
  - **Mitigation**: Implement conflict resolution strategies

## Implementation

### Web App Manifest
```json
// public/manifest.json
{
  "name": "CRM System",
  "short_name": "CRM",
  "description": "Customer Relationship Management System",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Contacts",
      "short_name": "Contacts",
      "description": "View and manage contacts",
      "url": "/contacts",
      "icons": [
        {
          "src": "/icons/contact-shortcut.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Opportunities",
      "short_name": "Opportunities",
      "description": "View sales pipeline",
      "url": "/opportunities",
      "icons": [
        {
          "src": "/icons/opportunity-shortcut.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### Service Worker Implementation
```javascript
// public/sw.js
const CACHE_NAME = 'crm-v1.0.0'
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(
      networkFirstStrategy(request)
    )
    return
  }

  // Handle static assets
  event.respondWith(
    cacheFirstStrategy(request)
  )
})

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncOfflineActions()
    )
  }
})

async function syncOfflineActions() {
  // Sync offline actions when connection is restored
  const offlineActions = await getOfflineActions()
  
  for (const action of offlineActions) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      })
      await removeOfflineAction(action.id)
    } catch (error) {
      console.error('Sync failed for action:', action.id)
    }
  }
}
```

### PWA Registration in Vue App
```typescript
// src/pwa/register.ts
export function registerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
        
        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update available notification
                showUpdateNotification()
              }
            })
          }
        })
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  }
}

function showUpdateNotification() {
  // Notify user that app update is available
  const updateBanner = document.createElement('div')
  updateBanner.innerHTML = `
    <div class="update-banner">
      <p>App update available!</p>
      <button onclick="window.location.reload()">Refresh</button>
    </div>
  `
  document.body.appendChild(updateBanner)
}
```

### Offline State Management
```typescript
// src/composables/useOffline.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useOffline() {
  const isOnline = ref(navigator.onLine)
  const offlineActions = ref<any[]>([])

  function updateOnlineStatus() {
    isOnline.value = navigator.onLine
  }

  async function queueOfflineAction(action: any) {
    if (!isOnline.value) {
      offlineActions.value.push({
        id: Date.now(),
        ...action,
        timestamp: new Date().toISOString()
      })
      
      // Store in IndexedDB for persistence
      await storeOfflineAction(action)
    }
  }

  async function syncWhenOnline() {
    if (isOnline.value && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register('background-sync')
      })
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('online', syncWhenOnline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
    window.removeEventListener('online', syncWhenOnline)
  })

  return {
    isOnline,
    offlineActions,
    queueOfflineAction
  }
}
```

### Responsive Mobile-First Design
```css
/* Mobile-first responsive design */
.container {
  @apply px-4 mx-auto;
}

.sidebar {
  @apply transform -translate-x-full;
  transition: transform 0.3s ease-in-out;
}

.sidebar.open {
  @apply translate-x-0;
}

/* Touch-friendly interactive elements */
.btn {
  @apply min-h-[44px] min-w-[44px];
  touch-action: manipulation;
}

/* Optimized for thumb navigation */
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 h-16;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 768px) {
  .sidebar {
    @apply translate-x-0 relative;
  }
  
  .bottom-nav {
    @apply hidden;
  }
}
```

### Installation Prompt
```typescript
// src/composables/useInstallPrompt.ts
import { ref } from 'vue'

export function useInstallPrompt() {
  const deferredPrompt = ref<any>(null)
  const showInstallButton = ref(false)

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallButton.value = true
  })

  async function installApp() {
    if (deferredPrompt.value) {
      deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      
      deferredPrompt.value = null
      showInstallButton.value = false
    }
  }

  return {
    showInstallButton,
    installApp
  }
}
```

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-007: Vercel Deployment Platform Selection](./007-vercel-deployment.md)
- [ADR-011: Design System Architecture with Tailwind CSS](./011-design-system-tailwind.md)

## Notes
- PWA features implemented progressively based on browser support
- Offline functionality focuses on read-only access to cached data
- Background sync handles offline actions when connection is restored
- Installation prompt shown to eligible users on supported browsers
- Responsive design optimized for mobile-first user experience