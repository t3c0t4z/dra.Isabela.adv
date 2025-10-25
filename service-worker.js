const CACHE_NAME = 'isabela-advogada-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/logomarcat3c0t4zfavicom.png',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/isabelafoto3.jpeg',
  'https://lhujzzoqebgjbsnezmrt.supabase.co/storage/v1/object/public/Photos/Isabeladvogadaqrcode.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto - Dra. Isabela');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Clone da requisição
        const fetchRequest = event.request.clone();
    
        return fetch(fetchRequest).then(response => {
          // Verifica se recebeu uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
    
          // Clone da resposta
          const responseToCache = response.clone();
    
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
    
          return response;
        });
      })

  );
});
