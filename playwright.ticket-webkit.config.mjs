import {defineConfig} from 'playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'ticket.spec.ts',grep:/ticket success|five saved|public HTML/,
 fullyParallel:false,workers:1,timeout:60000,retries:0,reporter:'list',outputDir:'qa-artifacts/ticket-webkit',
 globalTeardown:'./tests/helpers/ticket-webkit-teardown.mjs',
 use:{baseURL:'http://localhost:3312',browserName:'webkit',reducedMotion:'reduce',locale:'ru-RU',timezoneId:'Europe/Moscow',screenshot:'only-on-failure',trace:'retain-on-failure'},
 projects:[{name:'webkit'}],
 webServer:{command:'node scripts/browser-preview.mjs',url:'http://localhost:3312/qa/health',reuseExistingServer:false,timeout:120000,env:{QA_TEST_PORT:'3312',QA_TEST_UPSTREAM_PORT:'3302'}},
});
