import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('public content avoids long dashes without changing technical times or URLs',()=>{
 for(const name of ['invitation.ts','public-sections.ts','dress-code.ts','guests.mock.ts','questions.ts','venue-rules.ts']){
  const source=ts.createSourceFile(name,fs.readFileSync('src/content/'+name,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(node){if(ts.isStringLiteral(node)){assert.doesNotMatch(node.text,/[—–]/,name);if(/[А-Яа-яЁё]/.test(node.text)&&!node.text.includes('://')&&!/фотограф|фотографи|Усадьба:/.test(node.text))assert.doesNotMatch(node.text,/[а-яё]:\s/i,name+' enumeration');}ts.forEachChild(node,visit);}visit(source);
 }
});
