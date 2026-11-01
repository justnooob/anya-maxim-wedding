import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages:["pdfkit"], outputFileTracingIncludes:{"/api/rsvp/invitation":["./public/fonts/*.ttf","./public/fonts/royal-kaynin.otf","./public/images/ticket/*.png"]}, devIndicators: false, agentRules: false };
export default config;
