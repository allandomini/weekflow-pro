const CACHE_NAME = 'weekflow-pro-v1';
const STATIC_CACHE = 'weekflow-static-v1';
const DYNAMIC_CACHE = 'weekflow-dynamic-v1';

// Arquivos estáticos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/App.css',
  '/src/index.css',
  '/logo.svg',
  '/domini-logo.png',
  '/favicon.ico'
];

// Estratégia de cache: Network First com fallback para cache
async function networkFirst(request) {
  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network error, serving from cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network error', { status: 408, statusText: 'Network error' });
  }
}

// Estratégia de cache: Cache First para recursos estáticos
async function cacheFirst(request) {
  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Cache first error:', error);
    return new Response('Offline content not available', { 
      status: 408, 
      statusText: 'Offline content not available' 
    });
  }
}

// Instalação do service worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Cacheando arquivos estáticos...');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// Ativação do service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Supabase realtime endpoint
  if (url.hostname.includes('supabase') && url.pathname.includes('realtime')) {
    return;
  }

  // Cache de recursos estáticos (CSS, JS, imagens)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cache de páginas HTML
  if (request.destination === 'document') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Para APIs e dados dinâmicos, usar Network First
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Fallback para outras requisições
  event.respondWith(fetch(request).catch(() => {
    return caches.match(request) || new Response('Not found', { status: 404 });
  }));
});

// Sincronização em background quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronizando dados em background...');
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados offline
async function syncData() {
  try {
    // Aqui você pode implementar a lógica de sincronização
    // Por exemplo, enviar dados salvos offline para o servidor
    console.log('✅ Dados sincronizados com sucesso!');
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Mensagens do cliente principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
