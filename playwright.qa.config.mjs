import {defineConfig} from 'playwright/test';
import base from './playwright.config.mjs';
export default defineConfig({...base,testDir:'./tests/qa',timeout:180000,outputDir:'qa-artifacts/results',reporter:[['list'],['json',{outputFile:'qa-artifacts/playwright.json'}]],use:{...base.use,trace:'retain-on-failure'},webServer:base.webServer});
