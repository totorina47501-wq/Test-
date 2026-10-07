import crypto from "node:crypto";

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}

export function mapBitGoldMandateToAp2(mandate){
  if(!mandate||mandate.vct!=="bitgold.agent-payment-mandate.0.2")throw new Error("Mandat BitGold incompatible.");
  const checkoutMandate={
    type:"checkout_mandate",
    subject:String(mandate.user_id),
    agent:String(mandate.bot_id),
    constraints:{
      allowedAssets:[...mandate.allowed_assets],
      maxTransactionEur:Number(mandate.max_transaction_eur),
      dailyBudgetEur:Number(mandate.daily_budget_eur),
      humanApprovalThresholdEur:Number(mandate.human_approval_threshold_eur)
    },
    issuedAt:mandate.issued_at,
    expiresAt:mandate.expires_at
  };
  const paymentMandate={
    type:"payment_mandate",
    checkoutMandateHash:crypto.createHash("sha256").update(JSON.stringify(stable(checkoutMandate))).digest("hex"),
    rail:{type:String(mandate.rail_mode),protocol:mandate.rail_mode==="openfacilitator"?"x402":"internal"},
    compliance:{provider:"bitgold",decision:"required-before-execution"}
  };
  return {checkoutMandate,paymentMandate};
}

export function validateAp2Boundary({checkoutMandate,paymentMandate}={}){
  if(checkoutMandate?.type!=="checkout_mandate"||paymentMandate?.type!=="payment_mandate")return {valid:false,reason:"AP2_MANDATE_SHAPE"};
  const hash=crypto.createHash("sha256").update(JSON.stringify(stable(checkoutMandate))).digest("hex");
  if(paymentMandate.checkoutMandateHash!==hash)return {valid:false,reason:"AP2_MANDATE_BINDING"};
  if(paymentMandate.compliance?.provider!=="bitgold")return {valid:false,reason:"AP2_COMPLIANCE_BOUNDARY"};
  return {valid:true};
}

export const AP2_INTEROP_STATUS=Object.freeze({
  profile:"BitGold AP2 interoperability mapping",
  completeImplementation:false,
  authorization:"BitGold signed mandate",
  paymentRail:"x402/OpenFacilitator or simulation",
  compliance:"BitGold KYC/AML boundary",
  note:"Mapping préparatoire uniquement; aucune revendication de conformité AP2 complète."
});
