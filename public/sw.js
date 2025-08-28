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
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estratégia de cache: Cache First para recursos estáticos
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    throw error;
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
    return caches.match(request);
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
