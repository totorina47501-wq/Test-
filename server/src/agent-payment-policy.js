import crypto from "node:crypto";

export const AGENT_PLAN_POLICY=Object.freeze({
  free:{label:"Free",simulationOnly:true,maxTransactionEur:0,dailyBudgetEur:0,defaultExpiryHours:24,humanApprovalThresholdEur:0},
  pro:{label:"Pro",simulationOnly:false,maxTransactionEur:1000,dailyBudgetEur:5000,defaultExpiryHours:24,humanApprovalThresholdEur:750},
  elite:{label:"Elite",simulationOnly:false,maxTransactionEur:5000,dailyBudgetEur:25000,defaultExpiryHours:12,humanApprovalThresholdEur:2500}
});

const ASSETS=new Set(["BTC","ETH","SOL","USDC","LINK","AVAX"]);
const RAILS=new Set(["simulation","x402-prepared","openfacilitator"]);

function planOf(value){
  const p=String(value||"").toLowerCase();
  return p==="elite"||p==="pro"?p:"free";
}
function canonical(value){
  return JSON.stringify(value,Object.keys(value).sort());
}
function sign(secret,payload){
  return crypto.createHmac("sha256",secret).update(canonical(payload)).digest("hex");
}
function safeEqualHex(a,b){
  if(!a||!b||a.length!==b.length)return false;
  try{return crypto.timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"))}catch{return false}
}

export function createAgentPayments(pool,{compliance,isProduction=false,enforcement=false,secret="",railMode="simulation"}={}){
  async function init(){
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_payment_mandates(
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bot_type TEXT NOT NULL,
        mandate_version TEXT NOT NULL DEFAULT 'bitgold-ap2-compatible-0.2',
        allowed_assets TEXT[] NOT NULL,
        max_transaction_eur DOUBLE PRECISION NOT NULL,
        daily_budget_eur DOUBLE PRECISION NOT NULL,
        human_approval_threshold_eur DOUBLE PRECISION NOT NULL DEFAULT 0,
        rail_mode TEXT NOT NULL DEFAULT 'simulation',
        mandate_payload JSONB NOT NULL,
        mandate_signature TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_agent_mandates_user_active ON agent_payment_mandates(user_id,revoked_at,expires_at);
      CREATE TABLE IF NOT EXISTS agent_payment_events(
        id BIGSERIAL PRIMARY KEY,
        mandate_id BIGINT REFERENCES agent_payment_mandates(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        amount_eur DOUBLE PRECISION,
        asset TEXT,
        bot_type TEXT,
        reason TEXT,
        payload_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_agent_payment_events_user_created ON agent_payment_events(user_id,created_at DESC);
    `);
  }

  async function audit({mandateId=null,userId,eventType,amount=null,asset=null,botType=null,reason=null,payload=null}){
    const hash=payload==null?null:crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await pool.query(`
      INSERT INTO agent_payment_events(mandate_id,user_id,event_type,amount_eur,asset,bot_type,reason,payload_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    `,[mandateId,userId,eventType,amount,asset,botType,reason,hash]);
  }

  async function getMandate(userId,botType){
    const row=(await pool.query(`
      SELECT * FROM agent_payment_mandates
      WHERE user_id=$1 AND bot_type=$2 AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP
      ORDER BY created_at DESC LIMIT 1
    `,[userId,botType])).rows[0];
    if(!row)return null;
    const expected=sign(secret,row.mandate_payload);
    if(!safeEqualHex(row.mandate_signature,expected))return null;
    return row;
  }

  async function createMandate(userId,{botType,allowedAssets=Array.from(ASSETS),maxTransactionEur,dailyBudgetEur,humanApprovalThresholdEur,expiresInHours,railMode:requestedRailMode}={}){
    if(!secret){
      const e=new Error("AGENT_PAYMENT_MANDATE_SECRET non configuré.");e.statusCode=503;throw e;
    }
    const user=(await pool.query("SELECT plan FROM users WHERE id=$1",[userId])).rows[0];
    if(!user){const e=new Error("Utilisateur introuvable.");e.statusCode=404;throw e;}
    const plan=planOf(user.plan),policy=AGENT_PLAN_POLICY[plan];
    const complianceStatus=await compliance.getUserStatus(userId);
    if(isProduction&&!complianceStatus.transaction_clear){
      const e=new Error("KYC/AML requis avant d'autoriser un agent.");e.statusCode=403;e.code="COMPLIANCE_REQUIRED";throw e;
    }
    if(policy.simulationOnly&&isProduction){
      const e=new Error("Le plan Free reste en simulation et ne peut pas autoriser une transaction autonome.");e.statusCode=403;e.code="AGENT_PLAN_RESTRICTED";throw e;
    }
    const assets=[...new Set(allowedAssets.map(x=>String(x).toUpperCase()).filter(x=>ASSETS.has(x)))];
    if(!assets.length)throw new Error("Aucun actif autorisé.");
    const maxTx=Math.min(Number(maxTransactionEur||policy.maxTransactionEur),policy.maxTransactionEur||0);
    const daily=Math.min(Number(dailyBudgetEur||policy.dailyBudgetEur),policy.dailyBudgetEur||0);
    if(!Number.isFinite(maxTx)||!Number.isFinite(daily)||maxTx<=0||daily<=0){
      if(policy.simulationOnly)return {simulationOnly:true,plan,policy};
      throw new Error("Limites de mandat invalides.");
    }
    const threshold=Math.min(Math.max(0,Number(humanApprovalThresholdEur??policy.humanApprovalThresholdEur)),maxTx);
    const hours=Math.min(Math.max(1,Number(expiresInHours||policy.defaultExpiryHours)),72);
    const selectedRail=RAILS.has(requestedRailMode)?requestedRailMode:railMode;
    const payload={
      vct:"bitgold.agent-payment-mandate.0.2",
      mode:"autonomous",
      user_id:Number(userId),
      bot_id:String(botType||"").slice(0,80),
      allowed_assets:assets,
      max_transaction_eur:maxTx,
      daily_budget_eur:daily,
      human_approval_threshold_eur:threshold,
      rail_mode:selectedRail,
      issued_at:new Date().toISOString(),
      expires_at:new Date(Date.now()+hours*3600000).toISOString()
    };
    await pool.query("UPDATE agent_payment_mandates SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=$1 AND bot_type=$2 AND revoked_at IS NULL",[userId,botType]);
    const signature=sign(secret,payload);
    const row=(await pool.query(`
      INSERT INTO agent_payment_mandates(user_id,bot_type,allowed_assets,max_transaction_eur,daily_budget_eur,human_approval_threshold_eur,rail_mode,mandate_payload,mandate_signature,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,expires_at
    `,[userId,botType,assets,maxTx,daily,threshold,selectedRail,payload,signature,payload.expires_at])).rows[0];
    await audit({mandateId:row.id,userId,eventType:"mandate_created",botType,payload});
    return {id:String(row.id),...payload,signature,simulationOnly:false};
  }

  async function revokeMandate(userId,botType){
    const result=await pool.query("UPDATE agent_payment_mandates SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=$1 AND bot_type=$2 AND revoked_at IS NULL",[userId,botType]);
    await audit({userId,eventType:"mandate_revoked",botType,reason:"user_or_admin_revocation"});
    return {revoked:result.rowCount>0};
  }

  async function revokeMandateById(userId,mandateId){
    const result=await pool.query("UPDATE agent_payment_mandates SET revoked_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING bot_type",[mandateId,userId]);
    const botType=result.rows[0]?.bot_type||null;
    if(result.rowCount>0)await audit({mandateId,userId,eventType:"mandate_revoked",botType,reason:"individual_revocation"});
    return {revoked:result.rowCount>0,id:String(mandateId)};
  }

  async function operations(userId){
    const [mandates,events]=await Promise.all([
      pool.query(`SELECT id,bot_type,allowed_assets,max_transaction_eur,daily_budget_eur,human_approval_threshold_eur,rail_mode,expires_at,revoked_at,created_at FROM agent_payment_mandates WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,[userId]),
      pool.query(`SELECT mandate_id,event_type,amount_eur,asset,bot_type,reason,created_at FROM agent_payment_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[userId])
    ]);
    const today=events.rows.filter(row=>row.event_type==="authorized"&&new Date(row.created_at).toDateString()===new Date().toDateString());
    const spentTodayEur=today.reduce((sum,row)=>sum+Number(row.amount_eur||0),0);
    const activeMandates=mandates.rows.filter(row=>!row.revoked_at&&new Date(row.expires_at).getTime()>Date.now());\n    const dailyCapacityEur=activeMandates.reduce((sum,row)=>sum+Number(row.daily_budget_eur||0),0);\n    const utilizationPct=dailyCapacityEur>0?Math.min(100,Math.round((spentTodayEur/dailyCapacityEur)*10000)/100):0;\n    const deniedToday=events.rows.filter(row=>row.event_type==="denied"&&new Date(row.created_at).toDateString()===new Date().toDateString()).length;\n    const alerts=[...(utilizationPct>=80?[{code:"AGENT_BUDGET_HIGH",severity:utilizationPct>=95?"critical":"warning",utilizationPct}]:[]),...(deniedToday>=5?[{code:"AGENT_DENIAL_SPIKE",severity:"warning",count:deniedToday}]:[])];\n    return {rail_mode:railMode,enforcement,spentTodayEur,dailyCapacityEur,utilizationPct,deniedToday,alerts,mandates:mandates.rows.map(row=>({...row,id:String(row.id),active:!row.revoked_at&&new Date(row.expires_at).getTime()>Date.now()})),events:events.rows};
  }

  async function validate({userId,botType,asset,amountEur}){
    const amount=Number(amountEur), symbol=String(asset||"").toUpperCase();
    const user=(await pool.query("SELECT plan FROM users WHERE id=$1",[userId])).rows[0];
    if(!user)throw Object.assign(new Error("Utilisateur introuvable."),{statusCode:404});
    const plan=planOf(user.plan),policy=AGENT_PLAN_POLICY[plan];
    if(!enforcement)return {allowed:true,simulation:true,plan,reason:"Agent payment enforcement désactivé."};
    if(policy.simulationOnly)throw Object.assign(new Error("Le plan Free reste en simulation."),{statusCode:403,code:"AGENT_PLAN_RESTRICTED"});
    if(!Number.isFinite(amount)||amount<=0)throw Object.assign(new Error("Montant agent invalide."),{statusCode:400});
    const mandate=await getMandate(userId,botType);
    if(!mandate)throw Object.assign(new Error("Mandat agent absent, expiré ou invalide."),{statusCode:403,code:"AGENT_MANDATE_REQUIRED"});
    const payload=mandate.mandate_payload;
    if(!payload.allowed_assets.includes(symbol))throw Object.assign(new Error("Actif non autorisé par le mandat agent."),{statusCode:403,code:"AGENT_ASSET_NOT_ALLOWED"});
    if(amount>Number(payload.max_transaction_eur))throw Object.assign(new Error("Montant supérieur à la limite du mandat agent."),{statusCode:403,code:"AGENT_TRANSACTION_LIMIT"});
    if(amount>=Number(payload.human_approval_threshold_eur)&&Number(payload.human_approval_threshold_eur)>0)throw Object.assign(new Error("Validation humaine requise au-delà du seuil du mandat."),{statusCode:403,code:"AGENT_HUMAN_APPROVAL_REQUIRED"});
    const used=Number((await pool.query("SELECT COALESCE(SUM(amount_eur),0) total FROM agent_payment_events WHERE user_id=$1 AND mandate_id=$2 AND event_type='authorized' AND created_at>=CURRENT_DATE",[userId,mandate.id])).rows[0]?.total||0);
    if(used+amount>Number(payload.daily_budget_eur))throw Object.assign(new Error("Budget quotidien du mandat agent atteint."),{statusCode:403,code:"AGENT_DAILY_BUDGET"});
    return {allowed:true,simulation:mandate.rail_mode==="simulation",rail_mode:mandate.rail_mode,mandate_id:String(mandate.id)};
  }

  async function authorize({userId,botType,asset,amountEur}){
    const validation=await validate({userId,botType,asset,amountEur});
    if(!validation.allowed)return validation;
    const mandate=await getMandate(userId,botType);
    await audit({mandateId:mandate?.id||null,userId,eventType:"authorized",amount:Number(amountEur),asset:String(asset||"").toUpperCase(),botType,payload:{amount:Number(amountEur),asset:String(asset||"").toUpperCase(),botType,rail_mode:mandate?.rail_mode||validation.rail_mode}});
    return validation;
  }

  async function status(userId){
    const rows=(await pool.query(`
      SELECT id,bot_type,allowed_assets,max_transaction_eur,daily_budget_eur,human_approval_threshold_eur,rail_mode,expires_at,created_at
      FROM agent_payment_mandates WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP ORDER BY created_at DESC
    `,[userId])).rows;
    return {enforcement,isProduction,rail_mode:railMode,mandates:rows.map(row=>({...row,id:String(row.id)}))};
  }

  return {init,createMandate,revokeMandate,revokeMandateById,validate,authorize,status,operations,config:{enforcement,isProduction,railMode,secretConfigured:Boolean(secret)}};
}
