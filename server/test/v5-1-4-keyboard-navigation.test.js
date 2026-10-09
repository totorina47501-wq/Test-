import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('keyboard users can skip navigation to the focusable main landmark',()=>{
 assert.match(html,/<a class="skip-link" href="#main-content">Aller au contenu principal<\/a>/);
 assert.match(html,/<main id="main-content" tabindex="-1">/);
 assert.match(html,/\.skip-link:focus\{[^}]*transform:translateY\(0\)/);
});
