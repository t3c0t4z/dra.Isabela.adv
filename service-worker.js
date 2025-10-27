// Service Worker - Isabela Ventura PWA
// Versão: 1.0
// Data: 2025-10-26

const CACHE_NAME = 'isabela-ventura-v1.1';
const OFFLINE_URL = '/offline.html';

// Recursos para cache inicial (install)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// URLs das imagens QR Code para cache
const QR_IMAGES = [
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/Copilotqrcodetransp.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelaqrcodewpp.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelaqrcodeinstagram.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelaqrcodegmail.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelaqrcodelandingpageoficial.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelafoto3.jpeg',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelalogofav.png'
];

// Install Event - Cachear recursos iniciais
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando recursos...');
        // Cache recursos principais
        return cache.addAll(PRECACHE_URLS)
          .then(() => {
            // Cache QR Codes separadamente (não bloqueia instalação)
            return Promise.allSettled(
              QR_IMAGES.map(url => 
                cache.add(url).catch(err => {
                  console.warn(`⚠️ Falha ao cachear ${url}:`, err);
                })
              )
            );
          });
      })
      .then(() => {
        console.log('✅ Service Worker: Instalado com sucesso!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erro na instalação:', error);
      })
  );
});

// Activate Event - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Service Worker: Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Ativado com sucesso!');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Estratégia: Cache First, falling back to Network
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de analytics/tracking
  if (event.request.url.includes('analytics') || 
      event.request.url.includes('gtag') ||
      event.request.url.includes('facebook')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se encontrou no cache, retorna
        if (cachedResponse) {
          console.log('📦 Cache Hit:', event.request.url);
          
          // Update cache in background (stale-while-revalidate)
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, response);
                });
              }
            })
            .catch(() => {
              // Silently fail background update
            });
          
          return cachedResponse;
        }

        // Se não encontrou, busca na rede
        console.log('🌐 Network Request:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Cachear resposta válida
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch((error) => {
            console.error('❌ Network Error:', error);
            
            // Retornar página offline se disponível
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // Retornar erro
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Message Event - Atualizar cache sob demanda
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Service Worker: Pulando espera...');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_QR_CODES') {
    console.log('🔄 Service Worker: Atualizando cache de QR Codes...');
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          QR_IMAGES.map(url => cache.add(url))
        );
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('❌ Erro ao atualizar QR Codes:', error);
        event.ports[0].postMessage({ success: false, error });
      });
  }
});

// Background Sync Event (se suportado)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-qr-codes') {
    console.log('🔄 Background Sync: Sincronizando QR Codes...');
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return Promise.all(
            QR_IMAGES.map(url => cache.add(url))
          );
        })
    );
  }
});

// Push Notification Event (opcional - futuro)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação!',
    icon: 'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelalogofav.png',
    badge: 'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelalogofav.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: 'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelalogofav.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Dra. Isabela Ventura', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('🎉 Service Worker: Carregado com sucesso!');
