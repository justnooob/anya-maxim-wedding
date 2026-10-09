import {defineConfig} from 'playwright/test';
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:false,workers:1,retries:0,timeout:60000,
 outputDir:'test-results',reporter:[['list'],['html',{open:'never'}]],
 snapshotPathTemplate:'{testDir}/__screenshots__/{projectName}/{platform}/{arg}{ext}',
 expect:{timeout:10000,toHaveScreenshot:{animations:'disabled',caret:'hide',maxDiffPixels:100,threshold:0.15}},
 use:{baseURL:'http://localhost:3310',viewport:{width:375,height:812},reducedMotion:'reduce',locale:'ru-RU',timezoneId:'Europe/Moscow',colorScheme:'light',deviceScaleFactor:1,trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'chrome',use:{browserName:'chromium',channel:'chrome'}}],
 webServer:{command:'node scripts/browser-preview.mjs',url:'http://localhost:3310/qa/health',reuseExistingServer:false,timeout:120000},
});
