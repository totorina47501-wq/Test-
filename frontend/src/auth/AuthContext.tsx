import {createContext,useContext,useMemo,useState,type ReactNode} from "react";

const STORAGE_KEY="bitgold-token";
type AuthStatus="guest"|"authenticating"|"authenticated"|"twoFactor"|"expired";
type SignupPayload={email:string;password:string;first_name:string;last_name:string;country:string;city:string;postal_code:string};
type AuthContextValue={
  status:AuthStatus; token:string; error:string; challengeToken:string;
  login:(email:string,password:string)=>Promise<void>;
  signup:(payload:SignupPayload)=>Promise<void>;
  verify2FA:(code:string)=>Promise<void>;
  logout:()=>void; expireSession:()=>void; clearError:()=>void;
};
const AuthContext=createContext<AuthContextValue|null>(null);
function readToken(){try{return localStorage.getItem(STORAGE_KEY)||""}catch{return ""}}
function persistToken(token:string){try{if(token)localStorage.setItem(STORAGE_KEY,token);else localStorage.removeItem(STORAGE_KEY)}catch{}}
async function postJson(path:string,body:unknown){
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:`Erreur API (${response.status})`);
  return data as Record<string,unknown>;
}
export function AuthProvider({children}:{children:ReactNode}){
  const initial=readToken();
  const [token,setToken]=useState(initial);
  const [status,setStatus]=useState<AuthStatus>(initial?"authenticated":"guest");
  const [error,setError]=useState("");
  const [challengeToken,setChallengeToken]=useState("");
  const acceptToken=(next:string)=>{persistToken(next);setToken(next);setChallengeToken("");setError("");setStatus("authenticated")};
  const login=async(email:string,password:string)=>{setStatus("authenticating");setError("");try{const data=await postJson("/api/auth/login",{email,password});if(data.requires2FA===true&&typeof data.challengeToken==="string"){setChallengeToken(data.challengeToken);setStatus("twoFactor");return}if(typeof data.token!=="string")throw new Error("Réponse de connexion invalide.");acceptToken(data.token)}catch(e){setStatus("guest");setError(e instanceof Error?e.message:"Connexion impossible.");throw e}};
  const signup=async(payload:SignupPayload)=>{setStatus("authenticating");setError("");try{const data=await postJson("/api/auth/signup",payload);if(typeof data.token!=="string")throw new Error("Réponse d'inscription invalide.");acceptToken(data.token)}catch(e){setStatus("guest");setError(e instanceof Error?e.message:"Inscription impossible.");throw e}};
  const verify2FA=async(code:string)=>{if(!challengeToken)return;setStatus("authenticating");setError("");try{const data=await postJson("/api/auth/2fa/verify",{challengeToken,code});if(typeof data.token!=="string")throw new Error("Réponse 2FA invalide.");acceptToken(data.token)}catch(e){setStatus("twoFactor");setError(e instanceof Error?e.message:"Code 2FA invalide.");throw e}};
  const logout=()=>{persistToken("");setToken("");setChallengeToken("");setError("");setStatus("guest")};
  const expireSession=()=>{persistToken("");setToken("");setChallengeToken("");setError("");setStatus("expired")};
  const value=useMemo<AuthContextValue>(()=>({status,token,error,challengeToken,login,signup,verify2FA,logout,expireSession,clearError:()=>setError("")}),[status,token,error,challengeToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}
