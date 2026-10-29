import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Compile the real TSX components in memory; no browser effects or network calls run.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = name => {
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
    const resolved = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
    assert.ok(resolved, `Cannot resolve ${name}`);
    return load(resolved);
  };
  new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
  return module.exports;
}
const { I18N } = load(path.resolve('lib/i18n.ts'));
const { Header } = load(path.resolve('components/Header.tsx'));
const { Hero } = load(path.resolve('components/Hero.tsx'));
const { Footer } = load(path.resolve('components/Footer.tsx'));
const sections = load(path.resolve('components/Sections.tsx'));
const fixture = JSON.parse(readFileSync('tests/fixtures/landing-copy.json', 'utf8'));
const render = component => renderToStaticMarkup(component);
const text = html => html.replace(/<[^>]*>/g, '');
const encoded = value => render(React.createElement(React.Fragment, null, value));
for (const lang of ['es', 'en']) {
  test(`${lang}: approved copy is exact and rendered, without old claims`, () => {
    for (const [key, expected] of Object.entries(fixture[lang])) assert.deepEqual(I18N[lang][key], expected);
    const props = { lang, onOpenDemo() {}, setLang() {}, theme: 'light', setTheme() {} };
    const components = { hero: Hero, problem: sections.Problem, who: sections.WhoItsFor, solution: sections.Solution, how: sections.HowItWorks, academies: sections.Academies, pricing: sections.Pricing, faq: sections.FAQ, cta: sections.FinalCTA };
    let all = render(React.createElement(Header, props));
    for (const [key, Component] of Object.entries(components)) {
      const html = render(React.createElement(Component, props));
      all += html;
      const copy = fixture[lang][key];
      const visible = text(html);
      if ('title_1' in copy) assert.ok(visible.includes(encoded(copy.title_1 + copy.title_2 + copy.title_3)), key);
      function check(value, field = '') {
        if (field.startsWith('title_') || field === 'icon') return;
        if (typeof value === 'string' && value) assert.ok(visible.includes(encoded(value)), `${key}: ${value}`);
        else if (Array.isArray(value)) value.forEach(item => check(item));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => check(v, k));
      }
      check(copy);
    }
    assert.equal((all.match(/class="price-card/g) || []).length, 2);
    assert.equal((all.match(/class="faq-item/g) || []).length, 7);
    assert.ok(all.includes('href="#academias"'));
    assert.ok(all.includes('id="academias"'));
    assert.ok(!/~30s|15\+|24\/7|FMCSA|SAFER|McLeod|TruckMate|Ascend|TLS 1\.3|AES-256|99\.9%|Enterprise|Early Access|30 segundos|40 trucks/.test(all));
    const footer = render(React.createElement(Footer, props));
    assert.ok(footer.includes(lang === 'es' ? '>Producto</a>' : '>Product</a>'));
  });
}
test('Spanish is default and academy is between how-it-works and pricing', () => {
  const home = readFileSync('app/page.tsx', 'utf8');
  assert.ok(home.includes('useState<Lang>("es")'));
  assert.ok(!home.includes('navigator.language'));
  assert.ok(home.indexOf('<HowItWorks') < home.indexOf('<Academies'));
  assert.ok(home.indexOf('<Academies') < home.indexOf('<Pricing'));
});
