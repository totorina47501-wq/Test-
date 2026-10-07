import crypto from "node:crypto";

function sortValue(value){
  if(Array.isArray(value))return value.map(sortValue);
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortValue(value[key])]));
  }
  return value;
}

export function canonicalJson(value){
  return JSON.stringify(sortValue(value));
}

export function hashPaymentRequirements(requirements){
  return crypto.createHash("sha256").update(canonicalJson(requirements)).digest("hex");
}

export function buildPaymentRequirements({
  protocolVersion=2,
  scheme="exact",
  network,
  amountAtomic,
  asset,
  payTo,
  maxTimeoutSeconds=60,
  extra
}={}){
  const normalized={
    scheme:String(scheme||"exact").trim(),
    network:String(network||"").trim(),
    asset:String(asset||"").trim(),
    payTo:String(payTo||"").trim()
  };
  if(!normalized.network||!normalized.asset||!normalized.payTo)throw new Error("network, asset et payTo sont requis.");
  if(!/^\\d+$/.test(String(amountAtomic||"")))throw new Error("amountAtomic doit être un entier positif en unités atomiques.");
  if(BigInt(amountAtomic)<=0n)throw new Error("amountAtomic doit être strictement positif.");
  const timeout=Number(maxTimeoutSeconds);
  if(!Number.isInteger(timeout)||timeout<1||timeout>3600)throw new Error("maxTimeoutSeconds invalide.");
  if(Number(protocolVersion)===1){
    return {
      scheme:normalized.scheme,
      network:normalized.network,
      maxAmountRequired:String(amountAtomic),
      asset:normalized.asset,
      payTo:normalized.payTo
    };
  }
  const requirements={
    scheme:normalized.scheme,
    network:normalized.network,
    amount:String(amountAtomic),
    asset:normalized.asset,
    payTo:normalized.payTo,
    maxTimeoutSeconds:timeout
  };
  if(extra!==undefined)requirements.extra=sortValue(extra);
  return requirements;
}

export function requirementsMatch(expected,actual){
  return hashPaymentRequirements(expected)===hashPaymentRequirements(actual);
}

export function acceptedMatchesRequirements(paymentPayload,requirements){
  return Boolean(paymentPayload?.accepted)&&requirementsMatch(requirements,paymentPayload.accepted);
}
