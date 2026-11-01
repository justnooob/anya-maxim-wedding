import {defineConfig} from 'playwright/test';
import base from './playwright.config.mjs';
// Run after the single release production build. All /api requests use the
// isolated QA proxy/PGlite, never production PostgreSQL or real Telegram.
export default defineConfig({...base,
 outputDir:'qa-artifacts/release-browser',
 reporter:[['list'],['json',{outputFile:'qa-artifacts/release-browser.json'}]],
 projects:[
  {name:'chrome',testDir:'./tests/browser',use:{browserName:'chromium',channel:'chrome'}},
  {name:'webkit',testDir:'./tests',testMatch:['**/browser/ticket.spec.ts','**/release/*.spec.ts'],use:{browserName:'webkit'}},
 ],
});
