import {test,expect} from '@playwright/test';
test('bot audit routes require authentication',async({request})=>{for(const path of ['/api/bots/executions/history','/api/bots/decisions/history']){const response=await request.get(path);expect([401,403]).toContain(response.status());}});
