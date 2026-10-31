import { chromium } from 'playwright';
import fs from 'node:fs';

const base = 'http://127.0.0.1:8081';
const outputs = '/tmp/mojarrad-mobile-captures';
fs.mkdirSync(outputs,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const failures = [];
async function checkPublicFontFloor(page, label, width) {
  const smallText = await page.evaluate(() => [...document.querySelectorAll('.site-header *, .site-main *, .site-footer *')]
    .filter(el => el.getClientRects().length && el.childNodes && [...el.childNodes]
      .some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
    .filter(el => parseFloat(getComputedStyle(el).fontSize) < 12.99)
    .slice(0, 8).map(el => ({tag:el.tagName,text:el.textContent.trim().slice(0, 30),px:getComputedStyle(el).fontSize})));
  if (smallText.length) failures.push(width+'px '+label+' text below 13px: '+JSON.stringify(smallText));
}
try {
  for (const width of [320,360,375,430,768,1024,1365]) {
    const page = await browser.newPage({viewport:{width,height:780},deviceScaleFactor:1});
    page.on('pageerror', error => {
      const stack = error.stack || error.message;
      // WordPress core's wp-login.php can enqueue user-profile.min.js in CI.
      // Its legacy password-meter callback occasionally calls serialize() on
      // a missing form; keep detecting errors from our own pages and assets.
      if (page.url().includes('/wp-login.php') &&
          stack.includes('user-profile.min.js') &&
          stack.includes("reading 'serialize'")) return;
      failures.push(width+'px uncaught JS on '+page.url()+': '+stack);
    });
    const response = await page.goto(base+'/',{waitUntil:'networkidle',timeout:30000});
    if (response?.status()!==200) failures.push(width+'px homepage status '+response?.status());
    await page.evaluate(() => document.fonts.ready);
    const dims = await page.evaluate(() => ({
      viewport:innerWidth, scroll:document.documentElement.scrollWidth,
      brand:!!document.querySelector('.site-brand'), hero:!!document.querySelector('.hero-home')
    }));
    if (!dims.brand || !dims.hero) failures.push(width+'px missing header/hero');
    if (dims.scroll>dims.viewport+2) failures.push(width+'px page overflow '+(dims.scroll-dims.viewport)+'px');
    await checkPublicFontFloor(page, 'homepage', width);
    await page.screenshot({path:outputs+'/home-'+width+'.png',fullPage:true,animations:'disabled'});
    if (width<=880) {
      const button=page.locator('#menu-toggle');
      await button.click();
      if (await button.getAttribute('aria-expanded')!=='true') failures.push(width+'px menu failed to open');
      if (!(await page.locator('.primary-nav .mobile-account').isVisible())) failures.push(width+'px member login missing from mobile menu');
      await page.keyboard.press('Escape');
      if (await button.getAttribute('aria-expanded')!=='false') failures.push(width+'px menu failed to close');
    }
    if (width===320||width===375||width===768) {
      await page.goto(base+'/dashboard/',{waitUntil:'domcontentloaded'});
      if (!page.url().includes('wp-login.php')) failures.push(width+'px dashboard did not redirect anonymous visitor');
      await page.goto(base+'/consulting/',{waitUntil:'networkidle'});
      if (!(await page.locator('form[action*="admin-post.php"] input[name="moj_name"]').isVisible())) failures.push(width+'px consulting form is missing');
      const dims2=await page.evaluate(() => ({vw:innerWidth,sw:document.documentElement.scrollWidth}));
      if (dims2.sw>dims2.vw+2) failures.push(width+'px consulting overflow '+(dims2.sw-dims2.vw)+'px');
      await page.screenshot({path:outputs+'/consulting-'+width+'.png',fullPage:true,animations:'disabled'});
    }
    if (width === 375 || width === 1365) {
      const publicPages = [
        ['projects','/projects/','.portfolio-mosaic .portfolio-tile'],
        ['project-detail','/projects/anvari-7/','.project-facts .project-fact'],
        ['about','/about/','.editorial-story'],
        ['blog','/blog/','.journal-grid .editorial-card'],
        ['article','/heblex-walls/','.article-prose'],
        ['news','/news/','.journal-grid .editorial-card'],
        ['sale','/sale/','.sale-contact-layout'],
        ['collaborate','/collaborate/','.collaboration-forms'],
        ['officials','/officials/','.people-section']
      ];
      for (const [label,route,selector] of publicPages) {
        const check = await page.goto(base+route,{waitUntil:'networkidle',timeout:30000});
        if (check?.status() !== 200) failures.push(width+'px '+label+' HTTP status '+check?.status());
        if (!(await page.locator(selector).count())) failures.push(width+'px '+label+' missing section '+selector);
        await checkPublicFontFloor(page, label, width);
        if (label === 'projects') {
          if (await page.locator('.portfolio-mosaic .portfolio-tile').count() !== 15) failures.push(width+'px public project inventory is not exactly 15');
          const images = await page.locator('.portfolio-mosaic .portfolio-tile img').evaluateAll(async els =>
            await Promise.all(els.map(async el => {
              el.loading = 'eager';
              try { await el.decode(); } catch (_) {}
              return {src:el.getAttribute('src') || '',loaded:el.complete && el.naturalWidth > 0};
            }))
          );
          if (images.length !== 15) failures.push(width+'px projects expected 15 image elements but found '+images.length);
          const bad=images.filter(img => !img.loaded);
          if(bad.length) failures.push(width+'px project thumbnails failed to load: '+bad.map(x=>x.src).join(', '));
          if (images.filter(img=>img.src.endsWith('.avif')).length !== 8) failures.push(width+'px expected 8 real project thumbnails');
          if (images.filter(img=>img.src.endsWith('project-placeholder.svg')).length !== 7) failures.push(width+'px expected 7 graphic thumbnails');
          await page.locator('.portfolio-filter[data-filter=\"garden\"]').click();
          if (await page.locator('.portfolio-tile:visible').count() !== 6) failures.push(width+'px garden filter did not show exactly 6 projects');
          await page.locator('.portfolio-filter[data-filter=\"all\"]').click();
          await page.locator('.portfolio-tile').first().click();
          if (!(await page.locator('#portfolio-lightbox').isVisible())) failures.push(width+'px portfolio dialog did not open');
          if (!(await page.locator('#portfolio-dialog-title').innerText()).includes('بزرگمهر')) failures.push(width+'px portfolio dialog title missing');
          if (!(await page.locator('.portfolio-fact').count())) failures.push(width+'px portfolio facts missing');
          if (await page.locator('#portfolio-next').isVisible()) {
            await page.locator('#portfolio-next').click();
            if (!(await page.locator('#portfolio-image-count').innerText()).includes('2 / 2')) failures.push(width+'px portfolio image navigation failed');
          }
          await page.screenshot({path:outputs+'/portfolio-dialog-'+width+'.png',animations:'disabled'});
          await page.keyboard.press('Escape');
          if (await page.locator('#portfolio-lightbox').isVisible()) failures.push(width+'px Escape did not close portfolio dialog');
          await page.locator('.portfolio-tile').nth(1).click();
          if (!(await page.locator('#portfolio-dialog-title').innerText()).includes('انوری')) failures.push(width+'px Anvari 7 dialog did not open');
          const anvariThumbs = page.locator('#portfolio-thumbs .portfolio-thumb');
          if (await anvariThumbs.count() !== 10) failures.push(width+'px Anvari 7 expected 10 gallery photos');
          else {
            await anvariThumbs.last().click();
            if ((await page.locator('#portfolio-image-count').innerText()) !== '10 / 10') failures.push(width+'px Anvari 7 last photo navigation failed');
            const loaded = await page.locator('#portfolio-stage-image').evaluate(async img => {
              try { await img.decode(); } catch (_) {}
              return img.complete && img.naturalWidth > 0;
            });
            if (!loaded) failures.push(width+'px Anvari 7 last photo failed to load');
          }
          await page.keyboard.press('Escape');
        }
        if (label === 'project-detail') {
          const hero = page.locator('.project-showcase-photo img');
          if (!(await hero.count()) || !(await hero.first().evaluate(img => img.complete && img.naturalWidth > 0)))
            failures.push(width+'px project hero image failed to load');
          const gallery=await page.locator('.project-photo-grid img').evaluateAll(els =>
            els.map(el => ({src:el.getAttribute('src') || '',loaded:el.complete && el.naturalWidth > 0})));
          if(gallery.length < 2 || gallery.some(img=>!img.loaded)) failures.push(width+'px project detail images are missing or broken');
        }
        const metrics = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth
        }));
        if (metrics.scroll > metrics.viewport + 2) failures.push(width+'px '+label+' horizontal overflow '+(metrics.scroll-metrics.viewport)+'px');
        if (['projects','project-detail','about','blog','article','sale'].includes(label)) {
          await page.screenshot({path:outputs+'/'+label+'-'+width+'.png',fullPage:true,animations:'disabled'});
        }
      }
    }
    await page.close();
  }
  // A real logged-in member must see their authorized project timeline and report-only feed.
  const member=await browser.newPage({viewport:{width:375,height:780},deviceScaleFactor:1});
  member.on('pageerror', error=>failures.push('375px logged-in uncaught JS on '+member.url()+': '+(error.stack||error.message)));
  await member.goto(base+'/login/',{waitUntil:'networkidle'});
  await member.locator('#user_login').fill('moj_demo_owner');
  await member.locator('#user_pass').fill('ci-owner-password-only');
  await Promise.all([member.waitForURL('**/dashboard/',{timeout:20000}),member.locator('#wp-submit').click()]);
  const timelineLink=member.locator('a[href*="/timeline/?project="]').first();
  if(!(await timelineLink.count())) {
    failures.push('Owner dashboard is missing the timeline link');
  } else {
    await Promise.all([member.waitForURL('**/timeline/?project=*',{timeout:20000}),timelineLink.click()]);
    await member.locator('.moj-event').first().waitFor({state:'visible',timeout:20000});
    const texts=await member.locator('#moj-events').innerText();
    if(!texts.includes('گزارش رسمی پیشرفت (نمونه)')) failures.push('Official report missing in owner mobile timeline');
    if(texts.includes('بازدید داخلی اصلاح‌شده')) failures.push('Internal non-report leaked to owner timeline');
    if(await member.locator('#moj-open-create').isVisible()) failures.push('Owner received event creation button');
    await member.screenshot({path:outputs+'/timeline-owner-375.png',fullPage:true,animations:'disabled'});

    const officeUrl=base+'/office/?project='+new URL(member.url()).searchParams.get('project')+'&section=references';
    await member.goto(officeUrl,{waitUntil:'networkidle'});
    await member.locator('.moj-office-card').first().waitFor({state:'visible',timeout:20000});
    if(!(await member.locator('.moj-office-card').first().innerText()).includes('رفرنس')) failures.push('Owner reference is not displayed in office');
    if(await member.locator('.moj-office-tabs a[href*="section=workers"]').count()) failures.push('Owner was shown forbidden worker tool');
    const officeDims=await member.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
    if(officeDims.sw>officeDims.vw+2) failures.push('Mobile project office has horizontal overflow');
    await member.screenshot({path:outputs+'/office-owner-375.png',fullPage:true,animations:'disabled'});

  }
  await member.close();
} finally { await browser.close(); }
if (failures.length) {
  console.error('MOBILE BROWSER FAILURES:\n'+failures.join('\n'));
  process.exitCode=1;
} else {
  console.log('Responsive checks passed at 320,360,375,430,768,1024,1365 CSS pixels.');
  console.log('Mobile login, menu, Escape, horizontal overflow, authentication and form checked.');
}
