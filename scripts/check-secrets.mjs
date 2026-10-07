import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

// Local heuristic check, without printing matched values or sending files anywhere.
const stagedOnly = process.argv.includes('--staged');
const git = (args, options = {}) => execFileSync('git', args, { encoding: 'utf8', ...options });
const staged = git(['ls-files', '--cached', '-z']).split('\0').filter(Boolean);
const paths = stagedOnly ? staged : [...new Set([...staged, ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)])];
const rules = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
  ['service token', /\b(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/],
  ['database credentials', /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s/:]+:[^\s/@]+@/i],
  ['credential assignment', /(?:password|passwd|secret|api[_-]?key|access[_-]?token|database_url)["']?\s*[=:]\s*["'][^"'\r\n]{8,}["']/i],
  ['environment credential', /^\s*(?:[A-Z_]*(?:PASSWORD|SECRET|TOKEN|API_KEY)|DATABASE_URL)\s*=\s*[^\s#]+/],
];
const placeholder = /(?:example|placeholder|your[_ -]|replace[_ -]|changeme|<[^>]+>)/i;
let failures = 0;
let checked = 0;
function report(path, location, kind) {
  console.error(path + ':' + location + ': ' + kind);
  failures++;
}
function inspect(path, text, source) {
  if (text.includes('\0')) return;
  checked++;
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [kind, expression] of rules) {
      if (expression.test(line) && !(path === '.env.example' && placeholder.test(line))) {
        report(path, (index + 1) + ' (' + source + ')', kind);
        break;
      }
    }
  });
}
// .gitignore does not protect files already in the index.
let ignored = '';
try { ignored = git(['check-ignore', '--no-index', '--stdin', '-z'], { input: staged.join('\0') + (staged.length ? '\0' : '') }); }
catch (error) { if (error.status !== 1) throw error; }
for (const path of ignored.split('\0').filter(Boolean)) report(path, 'index', 'ignored file is staged; remove it from the index');
for (const path of paths) {
  if (!stagedOnly && fs.existsSync(path) && fs.statSync(path).isFile()) inspect(path, fs.readFileSync(path, 'utf8'), 'working tree');
  if (staged.includes(path)) inspect(path, git(['show', ':' + path]), 'staged');
}
if (failures) {
  console.error('Secret check failed: ' + failures + ' finding(s). Values are intentionally hidden.');
  process.exitCode = 1;
} else console.log('Secret check passed: ' + paths.length + ' paths, ' + checked + ' text snapshots.');
