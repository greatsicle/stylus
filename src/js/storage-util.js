import browser from './browser';
import {tryJSONparse} from './util';
import {compressToUTF16, decompressFromUTF16} from 'lz-string-unsafe';

export const LZ_KEY = {
  csslint: 'editorCSSLintConfig',
  stylelint: 'editorStylelintConfig',
  usercssTemplate: 'usercssTemplate',
};
const StorageExtras = {
  async getValue(key) {
    return (await this.get(key))[key];
  },
  async setValue(key, value) {
    await this.set({[key]: value});
  },
  async getLZValue(key) {
    return (await this.getLZValues([key]))[key];
  },
  async getLZValues(keys = Object.values(LZ_KEY)) {
    const data = await this.get(keys);
    for (const key of keys) {
      const value = data[key];
      data[key] = value && tryJSONparse(decompressFromUTF16(value));
    }
    return data;
  },
  setLZValue(key, value) {
    return this.setValue(key, compressToUTF16(JSON.stringify(value)));
  },
};

export const chromeLocal = Object.assign(browser.storage.local, StorageExtras);
export const chromeSync = Object.assign(browser.storage.sync, StorageExtras);
export const chromeSession = process.env.MV3
  ? Object.assign(chrome.storage.session, StorageExtras)
  : null;
