import { chromium } from 'playwright';
const url = 'http://127.0.0.1:4321/posts/stm32/' + encodeURIComponent('基于STM32L051的快门线通断控制') + '/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
const info = await p.evaluate(() => {
  const lic = document.querySelector('.bg-\[var\(--license-block-bg\)\]');
  const layout = document.querySelector('.sw-layout');
  const comments = document.querySelector('.sw-comments');
  const wrapper = document.querySelector('.sw-license');
  const row = lic?.querySelector('.flex.gap-6');
  const r = (el) => el ? { left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) } : null;
  return {
    viewport: window.innerWidth,
    docScrollW: document.documentElement.scrollWidth,
    layout: r(layout),
    licenseWrap: r(wrapper),
    license: r(lic),
    licenseRow: r(row),
    comments: r(comments),
    rowItems: row ? [...row.children].map(c => ({ left: Math.round(c.getBoundingClientRect().left), right: Math.round(c.getBoundingClientRect().right) })) : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await p.screenshot({ path: '/tmp/license-area.png', fullPage: false });
await b.close();
