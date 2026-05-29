// 笔吧购机助手 - Service Worker
const CACHE_NAME = 'biba-helper-v8';

// 需要预缓存的文件列表
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// 安装：预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // API 请求不走缓存（DeepSeek 等）
  const url = new URL(event.request.url);
  if (url.hostname !== self.location.hostname) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // 成功获取后缓存（仅本站资源）
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 网络失败 & 无缓存：图片返回空占位
        if (event.request.destination === 'image') {
          return new Response('', { headers: { 'Content-Type': 'image/svg+xml' } });
        }
      });
    })
  );
});
