import crypto from "node:crypto";

const KYC_STATUSES = new Set(["pending","verified","rejected"]);
const AML_STATUSES = new Set(["pending","clear","review","blocked"]);
const RISK_LEVELS = new Set(["unknown","low","medium","high"]);
const KYC_LEVELS = new Set(["standard","enhanced"]);

export const COMPLIANCE_PLAN_POLICY = Object.freeze({
  free: { label:"Free", requiredKycLevel:"standard", maxTransactionEur:2000, dailyLimitEur:2000, reviewThresholdEur:1500 },
  pro: { label:"Pro", requiredKycLevel:"standard", maxTransactionEur:10000, dailyLimitEur:10000, reviewThresholdEur:5000 },
  elite: { label:"Elite", requiredKycLevel:"enhanced", maxTransactionEur:50000, dailyLimitEur:50000, reviewThresholdEur:15000 }
});

function normalizeStatus(value, allowed, fallback){
  const normalized=String(value??"").trim().toLowerCase();
  return allowed.has(normalized)?normalized:fallback;
}
function normalizePlan(value){
  const normalized=String(value??"").trim().toLowerCase();
  return normalized==="elite"||normalized==="pro"?normalized:"free";
}
function safeEqualHex(a,b){
  if(!a||!b||a.length!==b.length)return false;
  try{return crypto.timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"))}catch{return false}
}

export function createCompliance(pool,{isProduction=false,enforcement=false,webhookSecret=""}={}){
  async function init(){
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_compliance(
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        kyc_status TEXT NOT NULL DEFAULT 'pending',
        kyc_level TEXT NOT NULL DEFAULT 'standard',
        aml_status TEXT NOT NULL DEFAULT 'pending',
        risk_level TEXT NOT NULL DEFAULT 'unknown',
        provider TEXT,
        external_reference TEXT,
        reason TEXT,
        last_checked_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE user_compliance ADD COLUMN IF NOT EXISTS kyc_level TEXT NOT NULL DEFAULT 'standard';
      CREATE INDEX IF NOT EXISTS idx_user_compliance_aml_status ON user_compliance(aml_status);
      CREATE INDEX IF NOT EXISTS idx_user_compliance_kyc_status ON user_compliance(kyc_status);
      CREATE TABLE IF NOT EXISTS compliance_events(
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        kyc_status TEXT,
        kyc_level TEXT,
        aml_status TEXT,
        risk_level TEXT,
        external_reference TEXT,
        reason TEXT,
        payload_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE compliance_events ADD COLUMN IF NOT EXISTS kyc_level TEXT;
      CREATE INDEX IF NOT EXISTS idx_compliance_events_user_created ON compliance_events(user_id,created_at DESC);
    `);
    await pool.query(`
      INSERT INTO user_compliance(user_id)
      SELECT id FROM users
      ON CONFLICT(user_id) DO NOTHING
    `);
  }

  async function getUserStatus(userId){
    const row=(await pool.query(`
      SELECT u.plan, c.kyc_status,c.kyc_level,c.aml_status,c.risk_level,c.provider,c.external_reference,c.reason,c.last_checked_at,c.updated_at
      FROM users u LEFT JOIN user_compliance c ON c.user_id=u.id WHERE u.id=$1
    `,[userId])).rows[0];
    const plan=normalizePlan(row?.plan);
    const policy=COMPLIANCE_PLAN_POLICY[plan];
    if(!row)return {
      plan,plan_label:policy.label,required_kyc_level:policy.requiredKycLevel,
      max_transaction_eur:policy.maxTransactionEur,daily_limit_eur:policy.dailyLimitEur,review_threshold_eur:policy.reviewThresholdEur,
      kyc_status:"pending",kyc_level:"standard",aml_status:"pending",risk_level:"unknown",
      transaction_clear:false,production_enforcement:enforcement
    };
    return {
      plan,plan_label:policy.label,required_kyc_level:policy.requiredKycLevel,
      max_transaction_eur:policy.maxTransactionEur,daily_limit_eur:policy.dailyLimitEur,review_threshold_eur:policy.reviewThresholdEur,
      kyc_status:row.kyc_status||"pending",kyc_level:normalizeStatus(row.kyc_level,KYC_LEVELS,"standard"),
      aml_status:row.aml_status||"pending",risk_level:row.risk_level||"unknown",
      provider:row.provider,external_reference:row.external_reference,reason:row.reason,last_checked_at:row.last_checked_at,updated_at:row.updated_at,
      transaction_clear:(row.kyc_status==="verified"&&normalizeStatus(row.kyc_level,KYC_LEVELS,"standard")===policy.requiredKycLevel&&row.aml_status==="clear"&&row.risk_level!=="high"),
      production_enforcement:enforcement
    };
  }

  function denialReason(status){
    if(status.kyc_status!=="verified")return "KYC non validé.";
    if(status.kyc_level!==status.required_kyc_level)return "Niveau de vérification KYC insuffisant pour ce plan.";
    if(status.aml_status==="blocked")return "Opération bloquée par le contrôle AML.";
    if(status.aml_status==="review")return "Contrôle AML en revue manuelle.";
    if(status.aml_status!=="clear")return "Contrôle AML non validé.";
    if(status.risk_level==="high")return "Profil de risque élevé : opération suspendue.";
    return "Contrôle de conformité requis.";
  }

  async function checkTransactionLimits(status,amount){
    const value=Number(amount);
    if(!Number.isFinite(value)||value<=0)return {allowed:true};
    if(value>status.max_transaction_eur)return {allowed:false,reason:`Montant supérieur à la limite ${status.plan_label} de ${status.max_transaction_eur} €.`};
    const r=await pool.query(
      "SELECT COALESCE(SUM(amount_eur),0) AS total FROM trades WHERE user_id=$1 AND created_at>=CURRENT_DATE",
      [status.user_id]
    );
    const used=Number(r.rows[0]?.total||0);
    if(used+value>status.daily_limit_eur)return {allowed:false,reason:`Limite quotidienne ${status.plan_label} atteinte (${status.daily_limit_eur} €).`};
    if(value>=status.review_threshold_eur)return {allowed:false,reason:"Opération soumise à une revue AML manuelle pour son montant."};
    return {allowed:true};
  }

  async function requireTransactionClearance(req,res,next){
    if(!enforcement)return next();
    try{
      const status=await getUserStatus(req.user.sub);
      status.user_id=Number(req.user.sub);
      if(!status.transaction_clear){
        return res.status(403).json({error:"Opération indisponible tant que les contrôles KYC/AML ne sont pas validés.",code:"COMPLIANCE_REQUIRED",compliance:status,reason:denialReason(status)});
      }
      const limits=await checkTransactionLimits(status,req.body?.amount);
      if(!limits.allowed)return res.status(403).json({error:limits.reason,code:"COMPLIANCE_REVIEW_REQUIRED",compliance:status,reason:limits.reason});
      return next();
    }catch(e){
      console.error("[COMPLIANCE] gate error",e.message);
      return res.status(503).json({error:"Contrôle de conformité indisponible. Opération bloquée.",code:"COMPLIANCE_UNAVAILABLE"});
    }
  }

  async function assertTransactionAllowed(userId){
    if(!enforcement)return;
    const status=await getUserStatus(userId);
    if(!status.transaction_clear){
      const error=new Error(denialReason(status)); error.code="COMPLIANCE_REQUIRED"; error.statusCode=403; throw error;
    }
  }

  async function audit({userId=null,eventType,source,kycStatus=null,kycLevel=null,amlStatus=null,riskLevel=null,externalReference=null,reason=null,payload=null}){
    const payloadHash=payload==null?null:crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await pool.query(`
      INSERT INTO compliance_events(user_id,event_type,source,kyc_status,kyc_level,aml_status,risk_level,external_reference,reason,payload_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `,[userId,eventType,source,kycStatus,kycLevel,amlStatus,riskLevel,externalReference,reason,payloadHash]);
  }

  async function handleProviderWebhook(req){
    if(!webhookSecret){const error=new Error("COMPLIANCE_WEBHOOK_SECRET non configuré.");error.statusCode=503;throw error;}
    const signature=String(req.headers["x-compliance-signature"]||"").replace(/^sha256=/i,"").trim();
    const raw=JSON.stringify(req.body||{});
    const expected=crypto.createHmac("sha256",webhookSecret).update(raw).digest("hex");
    if(!safeEqualHex(signature,expected)){const error=new Error("Signature du fournisseur conformité invalide.");error.statusCode=401;throw error;}
    const body=req.body||{},userId=Number(body.userId);
    if(!Number.isInteger(userId)||userId<1)throw new Error("userId invalide.");
    const exists=await pool.query("SELECT id FROM users WHERE id=$1",[userId]);
    if(!exists.rows.length)throw new Error("Utilisateur introuvable.");
    const kycStatus=normalizeStatus(body.kycStatus,KYC_STATUSES,"pending");
    const kycLevel=normalizeStatus(body.kycLevel,KYC_LEVELS,"standard");
    const amlStatus=normalizeStatus(body.amlStatus,AML_STATUSES,"pending");
    const riskLevel=normalizeStatus(body.riskLevel,RISK_LEVELS,"unknown");
    const provider=String(body.provider||"external").trim().slice(0,80);
    const externalReference=String(body.externalReference||"").trim().slice(0,180)||null;
    const reason=String(body.reason||"").trim().slice(0,500)||null;
    await pool.query(`
      INSERT INTO user_compliance(user_id,kyc_status,kyc_level,aml_status,risk_level,provider,external_reference,reason,last_checked_at,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        kyc_status=EXCLUDED.kyc_status,kyc_level=EXCLUDED.kyc_level,aml_status=EXCLUDED.aml_status,risk_level=EXCLUDED.risk_level,
        provider=EXCLUDED.provider,external_reference=EXCLUDED.external_reference,reason=EXCLUDED.reason,
        last_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    `,[userId,kycStatus,kycLevel,amlStatus,riskLevel,provider,externalReference,reason]);
    await audit({userId,eventType:"provider_update",source:provider,kycStatus,kycLevel,amlStatus,riskLevel,externalReference,reason,payload:body});
    return {ok:true,userId,kyc_status:kycStatus,kyc_level:kycLevel,aml_status:amlStatus,risk_level:riskLevel};
  }

  return {init,getUserStatus,requireTransactionClearance,assertTransactionAllowed,handleProviderWebhook,audit,config:{
    enforcement,isProduction,providerConfigured:Boolean(process.env.KYC_PROVIDER_URL||process.env.AML_PROVIDER_URL)
  }};
}
