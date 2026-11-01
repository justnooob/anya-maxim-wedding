// Close our owned fixture through its loopback-only test endpoint. Windows
// sandbox process-tree termination may otherwise leave the webServer pipe open.
export default async function teardown(){
 try{await fetch('http://localhost:3310/qa/shutdown',{method:'POST',signal:AbortSignal.timeout(3000)});}catch{/* The server may already be closed after a failed startup. */}
}
