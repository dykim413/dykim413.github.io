const _version  = "v1";
const cacheName = "cName1";
const cacheList = [];

const log = msg => {
    console.log(`[ServiceWorker ${_version}] ${msg}`);
}

// Life cycle: INSTALL
self.addEventListener("install", event => {
    self.skipWaiting();
    log("INSTALL");

    caches.open(cacheName).then(cache => {
        log("Caching app shell");
        return cache.addAll(cacheList);
    })
});

// Life cycle: ACTIVATE
self.addEventListener("activate", event => {
    log("Activate");

    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== cacheName) {
                    log("Removing old cache " + key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Functional: FETCH
self.addEventListener("fetch", event => {
    //log("Fetch " + event.request.url);
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});



//Push Message 수신 이벤트
self.addEventListener("push", event => {
    const json    = event.data.json();
    const title   = json.title || "알림";
    const options = {
        body                   : json.body || "",
        icon                   : json.icon || "",
        image                  : json.image || "",
        action                 : json.action || "",
        actions                : json.actions ? JSON.parse( json.actions ) : [],
        silent                 : json.silent === "true",
        persistence            : json.persistence === "true",
        renotify               : json.renotify === "true",
        requireInteraction     : json.requireInteraction === "true",
        sticky                 : json.sticky === "true",
        close                  : json.close === "true",
        notificationCloseEvent : json.notificationCloseEvent === "true",
        timestamp              : parseInt(json.timestamp) || Date.now(),
        vibrate                : json.vibrate || "",
        tag                    : json.tag || "",
        data                   : {
            url     : json.click_action,
            onclick : "",
        },
    };

    console.log("push : ", options);

    event.waitUntil( self.registration.showNotification(title, options) );
});

//사용자가 Notification을 클릭했을 때
self.addEventListener("notificationclick", function (event)
{
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" })
        .then(function (clientList)
        {
            //실행된 브라우저가 있으면 Focus
            for( let i = 0; i < clientList.length; i++ )
            {
                const client = clientList[i];
                if( client.url === "/" && "focus" in client ) {
                    return client.focus();
                }
            }
            //실행된 브라우저가 없으면 Open
            if( clients.openWindow && event.notification.data.url ) {
                return clients.openWindow( event.notification.data.url );
            }
        })
    );
});