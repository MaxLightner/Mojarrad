import { chromium } from 'playwright';
import fs from 'node:fs';

const base = 'http://127.0.0.1:8081';
const outputs = '/tmp/mojarrad-mobile-captures';
fs.mkdirSync(outputs,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const failures = [];
try {
  for (const width of [320,360,375,430,768,1024,1365]) {
    const page = await browser.newPage({viewport:{width,height:780},deviceScaleFactor:1});
    page.on('pageerror', error => failures.push(width+'px uncaught JS: '+error.message));
    const response = await page.goto(base+'/',{waitUntil:'networkidle',timeout:30000});
    if (response?.status()!==200) failures.push(width+'px homepage status '+response?.status());
    await page.evaluate(() => document.fonts.ready);
    const dims = await page.evaluate(() => ({
      viewport:innerWidth, scroll:document.documentElement.scrollWidth,
      brand:!!document.querySelector('.site-brand'), hero:!!document.querySelector('.hero-home')
    }));
    if (!dims.brand || !dims.hero) failures.push(width+'px missing header/hero');
    if (dims.scroll>dims.viewport+2) failures.push(width+'px page overflow '+(dims.scroll-dims.viewport)+'px');
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
    await page.close();
  }
  // A real logged-in member must see their authorized project timeline and report-only feed.
  const member=await browser.newPage({viewport:{width:375,height:780},deviceScaleFactor:1});
  member.on('pageerror', error=>failures.push('375px timeline uncaught JS: '+error.message));
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
