import {useEffect,useState,type FormEvent} from "react";
import {X} from "lucide-react";
import {Button} from "./ui";
import {useAuth} from "../auth/AuthContext";

type Mode="login"|"signup";
const inputClass="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20";
export function AuthDialog({open,onClose}:{open:boolean;onClose:()=>void}){
  const auth=useAuth();
  const [mode,setMode]=useState<Mode>("login");
  const [form,setForm]=useState({email:"",password:"",first_name:"",last_name:"",country:"France",city:"",postal_code:"",code:""});
  useEffect(()=>{if(open)auth.clearError()},[open]);
  useEffect(()=>{if(auth.status==="authenticated"&&open)onClose()},[auth.status,open,onClose]);
  if(!open)return null;
  const update=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));
  const submit=async(e:FormEvent)=>{e.preventDefault();try{if(auth.status==="twoFactor"){await auth.verify2FA(form.code);return}if(mode==="login"){await auth.login(form.email,form.password)}else{await auth.signup({email:form.email,password:form.password,first_name:form.first_name,last_name:form.last_name,country:form.country,city:form.city,postal_code:form.postal_code})}}catch{}};
  const busy=auth.status==="authenticating";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}>
    <div role="dialog" aria-modal="true" aria-label="Authentification BitGold" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111419] p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Espace sécurisé</p><h2 className="mt-1 text-2xl font-bold">{auth.status==="twoFactor"?"Vérification en deux étapes":"Bienvenue sur BitGold"}</h2></div><button aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={onClose}><X size={20}/></button></div>
      {auth.status!=="twoFactor"&&<div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1"><button className={`rounded-lg px-3 py-2 text-sm font-medium ${mode==="login"?"bg-white/10 text-white":"text-slate-400"}`} onClick={()=>{setMode("login");auth.clearError()}}>Connexion</button><button className={`rounded-lg px-3 py-2 text-sm font-medium ${mode==="signup"?"bg-white/10 text-white":"text-slate-400"}`} onClick={()=>{setMode("signup");auth.clearError()}}>Créer un compte</button></div>}
      <form className="mt-5 space-y-4" onSubmit={submit}>
        {auth.status==="twoFactor"?<>
          <p className="text-sm leading-6 text-slate-400">Saisissez le code Google Authenticator ou un code de récupération. Le jeton de challenge ne donne pas accès au cockpit.</p>
          <label className="block text-sm font-medium">Code Google Authenticator ou récupération<input autoComplete="one-time-code" className={inputClass} value={form.code} onChange={e=>update("code",e.target.value)} required/></label>
        </>:<>
          <label className="block text-sm font-medium">E-mail<input type="email" autoComplete="email" className={inputClass} value={form.email} onChange={e=>update("email",e.target.value)} required/></label>
          <label className="block text-sm font-medium">Mot de passe<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={8} className={inputClass} value={form.password} onChange={e=>update("password",e.target.value)} required/></label>
          {mode==="signup"&&<div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Prénom<input className={inputClass} value={form.first_name} onChange={e=>update("first_name",e.target.value)} required/></label>
            <label className="block text-sm font-medium">Nom<input className={inputClass} value={form.last_name} onChange={e=>update("last_name",e.target.value)} required/></label>
            <label className="block text-sm font-medium">Pays<input className={inputClass} value={form.country} onChange={e=>update("country",e.target.value)} required/></label>
            <label className="block text-sm font-medium">Ville<input className={inputClass} value={form.city} onChange={e=>update("city",e.target.value)} required/></label>
            <label className="block text-sm font-medium sm:col-span-2">Code postal<input className={inputClass} value={form.postal_code} onChange={e=>update("postal_code",e.target.value)} required/></label>
          </div>}
        </>}
        {auth.error&&<p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{auth.error}</p>}
        <Button className="w-full justify-center" disabled={busy}>{busy?"Connexion sécurisée…":auth.status==="twoFactor"?"Vérifier":mode==="login"?"Connexion":"Créer mon compte"}</Button>
      </form>
    </div>
  </div>;
}
