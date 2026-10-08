import {spawnSync} from 'node:child_process';
try{
  const url=new URL(process.env.DATABASE_URL);
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||process.env.NODE_ENV==='production')throw new Error('Local DB required');
  const result=spawnSync(process.execPath,['--test','tests/stage-b.test.mjs'],{stdio:'inherit',env:{...process.env,TEST_POSTGRES:'1'}});
  process.exitCode=result.status??1;
}catch{console.error('PostgreSQL integration tests require a local Docker DATABASE_URL. Details hidden.');process.exitCode=1;}
