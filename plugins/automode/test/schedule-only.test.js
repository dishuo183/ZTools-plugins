const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

describe('schedule-only mode regression', () => {
  let indexHtml;
  let preloadJs;
  let pluginManifest;

  before(() => {
    indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    preloadJs = fs.readFileSync(path.join(rootDir, 'preload.js'), 'utf8');
    pluginManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'plugin.json'), 'utf8'));
  });

  it('should remove sun-mode UI entry points from index.html', () => {
    assert.ok(indexHtml.includes('定时模式'));
    assert.ok(!indexHtml.includes('日出日落'));
    assert.ok(!indexHtml.includes("switchMode('sun')"));
    assert.ok(!indexHtml.includes('id="tabSun"'));
    assert.ok(!indexHtml.includes('id="sunPanel"'));
    assert.ok(!indexHtml.includes('id="sunToggle"'));
    assert.ok(!indexHtml.includes('id="citySearch"'));
  });

  it('should remove sun-mode APIs from preload.js', () => {
    assert.ok(preloadJs.includes('enableScheduler'));
    assert.ok(!preloadJs.includes('enableSunScheduler'));
    assert.ok(!preloadJs.includes('getUserLocation'));
    assert.ok(!preloadJs.includes('searchCities'));
    assert.ok(!preloadJs.includes('fetchSunTimes'));
    assert.ok(!preloadJs.includes('automode-sun-config'));
    assert.ok(!preloadJs.includes('sun-config.json'));
    assert.ok(!preloadJs.includes('api.sunrise-sunset.org'));
  });

  it('should describe the plugin as schedule-only', () => {
    assert.equal(pluginManifest.description, '定时自动切换 Windows 系统深浅色主题');
    assert.deepEqual(pluginManifest.features, [
      {
        code: 'theme-scheduler',
        explain: '定时切换系统深浅色模式',
        cmds: ['主题切换', '深色模式', '定时主题', 'theme switch', 'dark mode']
      }
    ]);
  });
});
