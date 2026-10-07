const DEFAULT_URL="https://pay.openfacilitator.io";

function baseUrl(value){
  return String(value||DEFAULT_URL).trim().replace(/\/$/,"");
}

async function post(url,body,fetchImpl=fetch){
  const response=await fetchImpl(url,{
    method:"POST",
    headers:{accept:"application/json","content-type":"application/json","user-agent":"BitGold-OpenFacilitator/1.0"},
    body:JSON.stringify(body)
  });
  const text=await response.text();
  let data={};
  try{data=text?JSON.parse(text):{};}catch{data={raw:text};}
  if(!response.ok){
    const error=new Error(data.error||data.message||`OpenFacilitator HTTP ${response.status}`);
    error.statusCode=response.status>=500?502:400;
    error.providerResponse=data;
    throw error;
  }
  return data;
}

export function createOpenFacilitator({base=DEFAULT_URL,enabled=false,settlementEnabled=false,fetchImpl=fetch}={}){
  const url=baseUrl(base);
  return {
    config:{baseUrl:url,enabled,settlementEnabled},
    async health(){
      const response=await fetchImpl(`${url}/health`,{headers:{accept:"application/json","user-agent":"BitGold-OpenFacilitator/1.0"}});
      const data=await response.json().catch(()=>({}));
      return {ok:response.ok,status:response.status,data};
    },
    async verify(paymentPayload,paymentRequirements){
      if(!enabled)throw Object.assign(new Error("OpenFacilitator est désactivé."),{statusCode:503,code:"X402_FACILITATOR_DISABLED"});
      return post(`${url}/verify`,{paymentPayload,paymentRequirements},fetchImpl);
    },
    async settle(paymentPayload,paymentRequirements){
      if(!enabled)throw Object.assign(new Error("OpenFacilitator est désactivé."),{statusCode:503,code:"X402_FACILITATOR_DISABLED"});
      if(!settlementEnabled)throw Object.assign(new Error("Le settlement OpenFacilitator n'est pas activé."),{statusCode:503,code:"X402_SETTLEMENT_DISABLED"});
      return post(`${url}/settle`,{paymentPayload,paymentRequirements},fetchImpl);
    }
  };
}
