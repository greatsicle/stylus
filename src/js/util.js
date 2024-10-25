/**
 * WARNING!
 * Used in limited contexts such as the offscreen document.
 * Only for pure declarations with no side effects or marked with /*@__PURE__*/

export const capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);
export const clamp = (value, min, max) => value < min ? min : value > max ? max : value;
export const clipString = (str, limit = 100) => str.length > limit
  ? str.substr(0, limit) + '...'
  : str;
export const hasOwn = /*@__PURE__*/Object.call.bind({}.hasOwnProperty);
/** FYI, matchMedia's onchange doesn't work in bg context, so we use it in our content script */
export const isCssDarkScheme = () => matchMedia('(prefers-color-scheme:dark)').matches;
export const isObject = val => typeof val === 'object' && val;
export const stringAsRegExpStr = s => s.replace(/[{}()[\]\\.+*?^$|]/g, '\\$&');
export const stringAsRegExp = (s, flags) => new RegExp(stringAsRegExpStr(s), flags);
export const RX_META = /\/\*!?\s*==userstyle==[\s\S]*?==\/userstyle==\s*\*\//i;

export const debounce = /*@__PURE__*/Object.assign((fn, delay, ...args) => {
  delay = +delay || 0;
  const t = performance.now() + delay;
  let old = debounce.timers.get(fn);
  if (!old && debounce.timers.set(fn, old = {})
    || delay && old.time < t && (clearTimeout(old.timer), true)
    || old.args.length !== args.length
    || old.args.some((a, i) => a !== args[i]) // note that we can't use deepEqual here
  ) {
    old.args = args;
    old.time = t;
    old.timer = setTimeout(debounce.run, delay, fn, args);
  }
}, {
  timers: new Map(),
  run(fn, args) {
    debounce.timers.delete(fn);
    fn(...args);
  },
  unregister(fn) {
    const data = debounce.timers.get(fn);
    if (data) {
      clearTimeout(data.timer);
      debounce.timers.delete(fn);
    }
  },
});

export function isEmptyObj(obj) {
  if (obj) {
    for (const k in obj) {
      if (hasOwn(obj, k)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {?Object} obj
 * @param {function(val:?, key:string, obj:Object):T} [fn]
 * @param {string[]} [keys]
 * @returns {?Object<string,T>}
 * @template T
 */
export function mapObj(obj, fn, keys) {
  if (!obj) return obj;
  const res = {};
  for (const k of keys || Object.keys(obj)) {
    if (!keys || k in obj) {
      res[k] = fn ? fn(obj[k], k, obj) : obj[k];
    }
  }
  return res;
}

export function tryRegExp(regexp, flags) {
  try {
    return new RegExp(regexp, flags);
  } catch {}
}

export function tryJSONparse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {}
}

export function tryURL(url) {
  try {
    if (url) return new URL(url);
  } catch {}
  return ''; // allows `res.prop` without checking res first
}

export function deepMerge(src, dst, mergeArrays) {
  if (!src || typeof src !== 'object') {
    return src;
  }
  if (Array.isArray(src)) {
    // using `Array` that belongs to this `window`; not using Array.from as it's slower
    if (!dst || !mergeArrays) dst = Array.prototype.map.call(src, deepCopy);
    else for (const v of src) dst.push(deepMerge(v));
  } else {
    // using an explicit {} that belongs to this `window`
    if (!dst) dst = {};
    for (const [k, v] of Object.entries(src)) {
      dst[k] = deepMerge(v, dst[k]);
    }
  }
  return dst;
}

/** Useful in arr.map(deepCopy) to ignore the extra parameters passed by map() */
export function deepCopy(src) {
  return deepMerge(src);
}

export function deepEqual(a, b, ignoredKeys) {
  if (!a || !b || a === b /*same object ref*/) return a === b;
  const type = typeof a;
  if (type !== typeof b) return false;
  if (type !== 'object') return a === b;
  if (Array.isArray(a)) {
    return Array.isArray(b) &&
           a.length === b.length &&
           a.every((v, i) => deepEqual(v, b[i], ignoredKeys));
  }
  for (const key in a) {
    if (!hasOwn(a, key) || ignoredKeys && ignoredKeys.includes(key)) continue;
    if (!hasOwn(b, key)) return false;
    if (!deepEqual(a[key], b[key], ignoredKeys)) return false;
  }
  for (const key in b) {
    if (!hasOwn(b, key) || ignoredKeys && ignoredKeys.includes(key)) continue;
    if (!hasOwn(a, key)) return false;
  }
  return true;
}

/**
 * @param {string | URL | Request} url
 * @param {RequestInit} [opts]
 * @return {Promise<string>}
 */
export async function fetchText(url, opts) {
  return (await fetch(url, opts)).text();
}

/** @this {Object} DriveOptions */
export function fetchWebDAV(url, init = {}) {
  return fetch(url, {
    ...init,
    credentials: 'omit', // circumventing nextcloud CSRF token error
    headers: {
      ...init.headers,
      Authorization: `Basic ${btoa(`${this.username || ''}:${this.password || ''}`)}`,
    },
  });
}

/** A simple polyfill in case DOM storage is disabled in the browser */
export let sessionStore = /*@__PURE__*/ new Proxy({}, {
  get(target, name) {
    try {
      const val = sessionStorage[name];
      sessionStore = sessionStorage;
      return val;
    } catch {
      Object.defineProperty(window, 'sessionStorage', {value: target});
    }
  },
  set(target, name, value) {
    try {
      sessionStorage[name] = `${value}`;
      sessionStore = sessionStorage;
    } catch {
      this.get(target);
      target[name] = `${value}`;
    }
    return true;
  },
  deleteProperty(target, name) {
    return delete target[name];
  },
});
