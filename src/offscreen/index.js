import {kGetAccessToken} from '/js/consts';
import {API} from '/js/msg-api';
import {COMMANDS} from '/js/port';
import {fetchWebDAV, isCssDarkScheme, mapObj} from '/js/util-base';

let webdavInstance;

/** @namespace OffscreenAPI */
Object.assign(COMMANDS, {
  __proto__: null,
  webdavInit: async cfg => {
    if (!webdavInstance) await loadScript(process.env.JS + 'webdav.js');
    cfg.fetch = fetchWebDAV.bind(cfg);
    cfg[kGetAccessToken] = API.sync[kGetAccessToken];
    webdavInstance = global.webdav(cfg);
    return mapObj(webdavInstance, v => typeof v === 'function' ? null : v);
  },
  webdav: (cmd, ...args) => webdavInstance[cmd](...args),
  /** Note that `onchange` doesn't work in bg context, so we use it in the content script */
  isDark: isCssDarkScheme,
});

/** A loader for scripts exposing a global, 100x smaller than webpack's smart chunk loader */
function loadScript(url) {
  return new Promise((resolve, reject) => document.head.appendChild(Object.assign(
    document.createElement('script'), {
      src: url,
      onload: resolve,
      onerror: reject,
    })));
}
