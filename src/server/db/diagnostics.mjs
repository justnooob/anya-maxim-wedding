const messages={
  '28P01':'Password authentication failed.', '28000':'Database authorization failed.',
  '3D000':'Database does not exist.', '42501':'Insufficient database privileges.',
  '42P07':'Database relation already exists (identifier hidden).',
  '42710':'Database object already exists (identifier hidden).',
  '42703':'Database column does not exist (identifier hidden).',
  '42P01':'Database relation does not exist (identifier hidden).',
  '42601':'SQL syntax error.', '23505':'Unique constraint violation.',
  '23514':'Check constraint violation.', '23502':'Not-null constraint violation.',
  '40P01':'Database deadlock detected.', '40001':'Transaction serialization failure.',
  '57014':'Database statement cancelled or timed out.', '53300':'Too many database connections.',
  '57P03':'Database is not ready for connections.',
  ECONNREFUSED:'Database connection refused.', ECONNRESET:'Database connection reset.',
  ENOTFOUND:'Database hostname could not be resolved.', EAI_AGAIN:'Database DNS lookup temporarily unavailable.',
  ETIMEDOUT:'Database connection timed out.', ENOENT:'Migration file or directory not found.',
  EACCES:'Migration file access denied.',
  DEPTH_ZERO_SELF_SIGNED_CERT:'Database TLS certificate is self-signed.',
  SELF_SIGNED_CERT_IN_CHAIN:'Database TLS certificate chain is not trusted.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE:'Database TLS certificate could not be verified.',
  CERT_HAS_EXPIRED:'Database TLS certificate expired.',
};
const fixedMessages=new Map([
  ['Migration changed','Applied migration checksum differs from the current file.'],
  ['Database configuration missing','DATABASE_URL environment variable is missing (value hidden).'],
  ['Connection terminated due to connection timeout','Database connection timed out.'],
  ['Connection terminated unexpectedly','Database connection terminated unexpectedly.'],
  ['The server does not support SSL connections','Database server does not support the requested TLS connection.'],
]);
// Do not print arbitrary server text: SQL errors may quote credentials or row data.
export function safeDatabaseDiagnostic(error,context={stage:'connection'}){
  const rawCode=typeof error?.code==='string'?error.code:'';
  const code=Object.hasOwn(messages,rawCode)||/^[0-9A-Z]{5}$/.test(rawCode)?rawCode:'unavailable';
  const name=['error','Error','TypeError','RangeError','DatabaseError','AggregateError'].includes(error?.name)?error.name:'Error';
  const message=messages[code]||fixedMessages.get(error?.message)||'Unrecognized database error; original message withheld to protect secrets.';
  const stage=['connection','metadata table','checksum','applying migration'].includes(context.stage)?context.stage:'connection';
  const filename=typeof context.filename==='string'&&/^\d+[A-Za-z0-9_.-]*\.sql$/.test(context.filename)?context.filename:undefined;
  return {name,code,message,stage,...(filename?{filename}:{})};
}
export async function checkDatabaseConnection(source){await source.query('SELECT 1');}
