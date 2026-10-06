import test from "node:test";
import assert from "node:assert/strict";
import { generateSecret, generate, verify, generateURI } from "otplib";
import QRCode from "qrcode";

test("otplib v13 TOTP setup and verification are compatible",async()=>{
  const secret=generateSecret();
  assert.match(secret,/^[A-Z2-7]+=*$/);
  const uri=generateURI({issuer:"BitGold",label:"test@example.com",secret});
  assert.match(uri,/^otpauth:\/\/totp\//);
  assert.match(uri,/issuer=BitGold/);
  const qr=await QRCode.toDataURL(uri,{width:260,margin:1,errorCorrectionLevel:"M"});
  assert.match(qr,/^data:image\/png;base64,/);
  const token=await generate({secret});
  assert.match(token,/^\d{6}$/);
  assert.equal((await verify({secret,token})).valid,true);
  assert.equal((await verify({secret,token:"000000"})).valid,false);
});
