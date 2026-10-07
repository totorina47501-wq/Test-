import test from "node:test";
import assert from "node:assert/strict";
import {blendForecastWithSentiment,scoreNews} from "../src/bot-ai-sentiment.js";

test("le sentiment favorise les nouvelles positives récentes",()=>{
  const now=Date.parse("2026-10-07T12:00:00Z");
  const result=scoreNews([
    {title:"Bitcoin rally with strong institutional inflows",summary:"ETF approval and adoption continue",publishedAt:"2026-10-07T10:00:00Z",source:"CoinDesk"},
    {title:"Bitcoin recovery",summary:"Positive market strength",publishedAt:"2026-10-07T08:00:00Z",source:"Cointelegraph"}
  ],now);
  assert.equal(result.bias,"positive");
  assert.ok(result.score>0);
  assert.ok(result.perAsset.BTC.articles>=2);
});

test("le sentiment négatif ralentit le forecast sans l'inverser brutalement",()=>{
  const forecast={score:.62,upProbability:.65};
  const sentiment={score:-.8,confidence:.9};
  const out=blendForecastWithSentiment(forecast,sentiment);
  assert.ok(out.score<forecast.score);
  assert.ok(out.score>.45);
  assert.ok(out.upProbability<forecast.upProbability);
});

test("absence de news = sentiment neutre",()=>{
  const result=scoreNews([],Date.now());
  assert.equal(result.score,0);
  assert.equal(result.bias,"neutral");
});
