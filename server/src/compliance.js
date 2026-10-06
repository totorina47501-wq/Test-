import crypto from "node:crypto";

const KYC_STATUSES = new Set(["pending","verified","rejected"]);
const AML_STATUSES = new Set(["pending","clear","review","blocked"]);
const RISK_LEVELS = new Set(["unknown","low","medium","high"]);

function normalizeStatus(value, allowed, fallback){
  const normalized=String(value??"").trim().toLowerCase();
  return allowed.has(normalized)?normalized:fallback;
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
        aml_status TEXT NOT NULL DEFAULT 'pending',
        risk_level TEXT NOT NULL DEFAULT 'unknown',
        provider TEXT,
        external_reference TEXT,
        reason TEXT,
        last_checked_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_compliance_aml_status ON user_compliance(aml_status);
      CREATE INDEX IF NOT EXISTS idx_user_compliance_kyc_status ON user_compliance(kyc_status);
      CREATE TABLE IF NOT EXISTS compliance_events(
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        kyc_status TEXT,
        aml_status TEXT,
        risk_level TEXT,
        external_reference TEXT,
        reason TEXT,
        payload_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
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
      SELECT kyc_status,aml_status,risk_level,provider,external_reference,reason,last_checked_at,updated_at
      FROM user_compliance WHERE user_id=$1
    `,[userId])).rows[0];
    if(!row)return {
      kyc_status:"pending",aml_status:"pending",risk_level:"unknown",
      transaction_clear:false,production_enforcement:enforcement
    };
    return {
      ...row,
      transaction_clear:row.kyc_status==="verified"&&row.aml_status==="clear"&&row.risk_level!=="high",
      production_enforcement:enforcement
    };
  }

  function denialReason(status){
    if(status.kyc_status!=="verified")return "KYC non validé.";
    if(status.aml_status==="blocked")return "Opération bloquée par le contrôle AML.";
    if(status.aml_status==="review")return "Contrôle AML en revue manuelle.";
    if(status.aml_status!=="clear")return "Contrôle AML non validé.";
    if(status.risk_level==="high")return "Profil de risque élevé : opération suspendue.";
    return "Contrôle de conformité requis.";
  }

  async function requireTransactionClearance(req,res,next){
    if(!enforcement)return next();
    try{
      const status=await getUserStatus(req.user.sub);
      if(status.transaction_clear)return next();
      return res.status(403).json({
        error:"Opération indisponible tant que les contrôles KYC/AML ne sont pas validés.",
        code:"COMPLIANCE_REQUIRED",
        compliance:status,
        reason:denialReason(status)
      });
    }catch(e){
      console.error("[COMPLIANCE] gate error",e.message);
      return res.status(503).json({error:"Contrôle de conformité indisponible. Opération bloquée.",code:"COMPLIANCE_UNAVAILABLE"});
    }
  }

  async function audit({userId=null,eventType,source,kycStatus=null,amlStatus=null,riskLevel=null,externalReference=null,reason=null,payload=null}){
    const payloadHash=payload==null?null:crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    await pool.query(`
      INSERT INTO compliance_events(user_id,event_type,source,kyc_status,aml_status,risk_level,external_reference,reason,payload_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,[userId,eventType,source,kycStatus,amlStatus,riskLevel,externalReference,reason,payloadHash]);
  }

  async function handleProviderWebhook(req){
    if(!webhookSecret){
      const error=new Error("COMPLIANCE_WEBHOOK_SECRET non configuré.");
      error.statusCode=503;
      throw error;
    }
    const signature=String(req.headers["x-compliance-signature"]||"").replace(/^sha256=/i,"").trim();
    const raw=JSON.stringify(req.body||{});
    const expected=crypto.createHmac("sha256",webhookSecret).update(raw).digest("hex");
    if(!safeEqualHex(signature,expected)){
      const error=new Error("Signature du fournisseur conformité invalide.");
      error.statusCode=401;
      throw error;
    }
    const body=req.body||{};
    const userId=Number(body.userId);
    if(!Number.isInteger(userId)||userId<1)throw new Error("userId invalide.");
    const exists=await pool.query("SELECT id FROM users WHERE id=$1",[userId]);
    if(!exists.rows.length)throw new Error("Utilisateur introuvable.");

    const kycStatus=normalizeStatus(body.kycStatus,KYC_STATUSES,"pending");
    const amlStatus=normalizeStatus(body.amlStatus,AML_STATUSES,"pending");
    const riskLevel=normalizeStatus(body.riskLevel,RISK_LEVELS,"unknown");
    const provider=String(body.provider||"external").trim().slice(0,80);
    const externalReference=String(body.externalReference||"").trim().slice(0,180)||null;
    const reason=String(body.reason||"").trim().slice(0,500)||null;

    await pool.query(`
      INSERT INTO user_compliance(user_id,kyc_status,aml_status,risk_level,provider,external_reference,reason,last_checked_at,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        kyc_status=EXCLUDED.kyc_status,aml_status=EXCLUDED.aml_status,risk_level=EXCLUDED.risk_level,
        provider=EXCLUDED.provider,external_reference=EXCLUDED.external_reference,reason=EXCLUDED.reason,
        last_checked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    `,[userId,kycStatus,amlStatus,riskLevel,provider,externalReference,reason]);

    await audit({
      userId,eventType:"provider_update",source:provider,kycStatus,amlStatus,riskLevel,
      externalReference,reason,payload:body
    });
    return {ok:true,userId,kyc_status:kycStatus,aml_status:amlStatus,risk_level:riskLevel};
  }

  return {
    init,
    getUserStatus,
    requireTransactionClearance,
    handleProviderWebhook,
    audit,
    config:{
      enforcement,
      isProduction,
      providerConfigured:Boolean(process.env.KYC_PROVIDER_URL||process.env.AML_PROVIDER_URL)
    }
  };
}
