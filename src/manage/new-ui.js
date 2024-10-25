import {$} from '/js/dom';
import {getCssMediaRuleByName} from '/js/dom-util';
import {API} from '/js/msg';
import * as prefs from '/js/prefs';
import {MEDIA_OFF, MEDIA_ON} from '/js/themer';
import {debounce, isEmptyObj} from '/js/util';
import {favsBusy, partEntry, renderFavs, renderMissingFavs, showStyles} from './render';
import {installed} from './util';

export const cfg = {
  enabled: null, // the global option should come first
  favicons: null,
  faviconsGray: null,
  targets: null,
};
export const ids = Object.keys(cfg);
export const hasFavs = () => cfg.enabled && cfg.favicons;
export const prefKeyForId = id => `manage.newUI.${id}`.replace(/\.enabled$/, '');
const MEDIA_NAME = 'newui'; // must be lowercase
let media;

export function readPrefs(dest = cfg, cb) {
  for (const id of ids) {
    const val = dest[id] = prefs.get(prefKeyForId(id));
    if (cb) cb(id, val);
  }
}

export function renderClass() {
  const on = !!cfg.enabled;
  if (!media) getCssMediaRuleByName(MEDIA_NAME, m => !(media = m));
  $.rootCL.toggle('newUI', on);
  $.rootCL.toggle('oldUI', !on);
  if (on !== (media[0] === MEDIA_ON)) {
    media.mediaText = `${on ? MEDIA_ON : MEDIA_OFF},${MEDIA_NAME}`;
  }
}

export function render(isInit) {
  const current = {};
  const changed = {};
  readPrefs(current, (id, value) => {
    changed[id] = value !== cfg[id] && (id === 'enabled' || current.enabled);
  });

  if (!isInit && isEmptyObj(changed)) {
    return;
  }

  Object.assign(cfg, current);
  renderClass();

  installed.classList.toggle('has-favicons', hasFavs());
  installed.classList.toggle('favicons-grayed', cfg.enabled && cfg.faviconsGray);
  installed.classList.toggle('has-targets', !cfg.enabled || !!cfg.targets);

  if (isInit) {
    return;
  }

  const iconsEnabled = hasFavs();
  let iconsMissing = iconsEnabled && !$('.applies-to img');
  if (changed.enabled || iconsMissing && !favsBusy && !partEntry) {
    installed.textContent = '';
    requestAnimationFrame(() => API.styles.getAll().then(showStyles));
    return;
  }
  if (changed.targets) {
    iconsMissing = renderMissingFavs(cfg.targets, iconsMissing, iconsEnabled);
  }
  if (iconsMissing) {
    debounce(renderFavs);
  }
}
