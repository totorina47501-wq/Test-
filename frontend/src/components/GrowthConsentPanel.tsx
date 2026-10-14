import {useLanguage} from "../i18n";
import {useState} from "react";
type Campaign={source:string;medium:string;campaign:string};
type EventName="market_cta"|"onboarding_cta"|"bots_cta"|"consent_accepted";
const CONSENT="bitgold:growth-consent:v1";
const EVENTS="bitgold:growth-events:v1";
function allowed(){try{return localStorage.getItem(CONSENT)==="yes"}catch{return false}}
export function trackGrowthEvent(event:EventName,campaign:Campaign){
 if(!allowed())return false;
 try{const previous=JSON.parse(localStorage.getItem(EVENTS)||"[]");const list=Array.isArray(previous)?previous:[];list.push({event,campaign:{source:campaign.source,medium:campaign.medium,campaign:campaign.campaign},at:new Date().toISOString()});localStorage.setItem(EVENTS,JSON.stringify(list.slice(-100)));return true}catch{return false}
}
export function GrowthConsentPanel({campaign}:{campaign:Campaign}){
 const {t}=useLanguage();
 const [consent,setConsent]=useState(()=>allowed());
 return <div className="glass" style={{padding:20,borderRadius:16,marginTop:24}}>
 <h3>{t("growthTitle")}</h3>
 <p>{t("growthDesc")}</p>
 <p style={{fontSize:13}}>{t("growthSource")} : {campaign.source.replace(/[<>]/g,"")} · {campaign.medium.replace(/[<>]/g,"")}</p>
 {consent?<button type="button" className="link" onClick={()=>{try{localStorage.removeItem(CONSENT);localStorage.removeItem(EVENTS)}catch{}setConsent(false)}}>{t("growthRevoke")}</button>:<button type="button" className="link" onClick={()=>{try{localStorage.setItem(CONSENT,"yes")}catch{}setConsent(true);trackGrowthEvent("consent_accepted",campaign)}}>{t("growthAccept")}</button>}
 </div>
}
