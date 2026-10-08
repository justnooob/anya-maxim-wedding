// Kept as an explicit guard for older deployment instructions.
console.error('Webhook registration is retired. Deploy the bot application with APP_ROLE=bot; use npm run telegram:production.');
process.exitCode=1;
