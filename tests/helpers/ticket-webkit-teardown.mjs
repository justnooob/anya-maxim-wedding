export default async function teardown(){try{await fetch('http://localhost:3312/qa/shutdown',{method:'POST',signal:AbortSignal.timeout(3000)});}catch{}}
