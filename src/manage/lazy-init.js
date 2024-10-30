import {UCD} from '/js/consts';
import {$, $create} from '/js/dom';
import {animateElement} from '/js/dom-util';
import {formatDate, formatRelativeDate, t} from '/js/localization';
import {debounce} from '/js/util';
import InjectionOrder from './injection-order';
import * as router from './router';
import UpdateHistory from './updater-ui';
import {installed} from './util';
import './events';
import './import-export';
import './incremental-search';

installed.on('mouseover', lazyAddEntryTitle, {passive: true});
installed.on('mouseout', lazyAddEntryTitle, {passive: true});

$('#sync-styles').onclick =
  $('#manage-options-button').onclick = router.makeToggle('stylus-options', toggleEmbeddedOptions);
$('#injection-order-button').onclick = router.makeToggle('injection-order', InjectionOrder);
$('#update-history-button').onclick = router.makeToggle('update-history', UpdateHistory);
router.update();

function addEntryTitle(link) {
  const style = link.closest('.entry').styleMeta;
  const {installDate: dIns, updateDate: dUpd, [UCD]: ucd} = style;
  link.title = [
    dUpd || dIns ? `${formatRelativeDate(dUpd || dIns)}` : '',
    `${t('dateInstalled')}: ${formatDate(dIns, true) || '—'}`,
    `${t('dateUpdated')}: ${formatDate(dUpd, true) || '—'}`,
    ucd ? `UserCSS, v.${ucd.version}` : '',
  ].filter(Boolean).join('\n');
}

function lazyAddEntryTitle({type, target}) {
  const cell = target.closest('h2.style-name, [data-type=age]');
  if (cell) {
    const link = $('.style-name-link', cell) || cell;
    if (type === 'mouseover' && !link.title) {
      debounce(addEntryTitle, 50, link);
    } else {
      debounce.unregister(addEntryTitle);
    }
  }
}

async function toggleEmbeddedOptions(show, el, selector) {
  // TODO: use messageBox() or a dockable sidepanel or the chrome.sidePanel API
  if (show) {
    $.root.appendChild($create('iframe' + selector, {src: '/options.html'}))
      .focus();
    await new Promise(resolve => (window.closeOptions = resolve));
  } else {
    await animateElement(el, 'fadeout');
    el.remove();
  }
}
