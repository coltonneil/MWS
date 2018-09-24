  var staticCache = 'restaurants-static-v1';
  var dynamicCache = 'restaurants-dynamic-v1';

  var cacheOnInstall = [
    '.',
    'index.html',
    'css/styles.css',
    'data/restaurants.json',
    'img/loading.svg',
    'js/main.js',
    'js/restaurant_info.js',
    'js/dbhelper.js',
    '404.html',
    'offline.html'
  ];



  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(staticCache).then(function (cache) {
        return cache.addAll(cacheOnInstall);
      })
    );
  });

  self.addEventListener('fetch', function (event) {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function (response) {
          if (response.status === 404) {
            return caches.match('404.html');
          }
          return caches.open(dynamicCache).then(function (cache) {
            if (event.request.url.indexOf('test') < 0) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          });
        });
      }).catch(function (error) {
        return caches.match('offline.html');
      })
    );
  });

  self.addEventListener('activate', function (event) {
    var cacheWhitelist = [staticCache, dynamicCache];
    event.waitUntil(
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });