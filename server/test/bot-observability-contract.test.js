import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('bot observatory exists in account',()=>{const source=readFileSync(new URL('../../frontend/src/components/AccountPage.tsx',import.meta.url),'utf8');assert.ok(source.includes('BotObservabilityPanel'));});
