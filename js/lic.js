/* Hourly - GPL-3.0 (vedi LICENSE). Licenze, inviti e fogli ore: firme con WebCrypto, nessun server.
   Catena di fiducia: autore (HLY_PUB) firma la licenza -> la licenza contiene la chiave pubblica dell'azienda
   -> l'azienda firma gli inviti dei dipendenti -> il dipendente firma (HMAC) i fogli ore con il suo segreto. */
const TE=new TextEncoder(),TD=new TextDecoder();
const b64=u=>btoa(String.fromCharCode(...u)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64=s=>{s=String(s).replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
const EC={name:"ECDSA",namedCurve:"P-256"},SG={name:"ECDSA",hash:"SHA-256"},HM={name:"HMAC",hash:"SHA-256"};
const jOf=b=>JSON.parse(TD.decode(unb64(b)));
async function verifyWith(jwk,payload,sig){
  try{
    const k=await crypto.subtle.importKey("jwk",{kty:"EC",crv:"P-256",x:jwk.x,y:jwk.y,ext:true},EC,false,["verify"]);
    return await crypto.subtle.verify(SG,k,unb64(sig),TE.encode(payload));
  }catch(e){return false}
}
/* Licenza: HLY1.<payload>.<firma>[.<d>]  (d = chiave privata dell'azienda, presente solo nel codice dell'azienda) */
async function checkLic(code){
  const a=String(code||"").trim().split(".");
  if(a[0]!=="HLY1"||a.length<3||a.length>4)return{ok:false,err:"fmt"};
  if(!window.HLY_PUB)return{ok:false,err:"nokey"};
  if(!await verifyWith(window.HLY_PUB,a[1],a[2]))return{ok:false,err:"sig"};
  let P;try{P=jOf(a[1])}catch(e){return{ok:false,err:"fmt"}}
  if(!P||!P.i||!P.k||!P.k.x||!P.k.y)return{ok:false,err:"fmt"};
  return{ok:true,P,p:a[1],s:a[2],d:a[3]||null};
}
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const expired=P=>!!P.e&&today()>P.e;
const coKey=L=>crypto.subtle.importKey("jwk",{kty:"EC",crv:"P-256",x:L.P.k.x,y:L.P.k.y,d:L.d,ext:true},EC,false,["sign"]);
/* Invito dipendente: HLE1.<payload>.<firma azienda> */
async function makeInvite(L,e){
  const pl=b64(TE.encode(JSON.stringify({v:1,l:L.p,ls:L.s,i:e.id,n:e.n,s:e.s})));
  const sig=b64(new Uint8Array(await crypto.subtle.sign(SG,await coKey(L),TE.encode(pl))));
  return"HLE1."+pl+"."+sig;
}
async function checkInvite(code){
  const a=String(code||"").trim().split(".");
  if(a[0]!=="HLE1"||a.length!==3)return{ok:false,err:"fmt"};
  let I;try{I=jOf(a[1])}catch(e){return{ok:false,err:"fmt"}}
  if(!I||!I.l||!I.ls||!I.i||!I.s)return{ok:false,err:"fmt"};
  const L=await checkLic("HLY1."+I.l+"."+I.ls);
  if(!L.ok)return{ok:false,err:L.err};
  if(!await verifyWith(L.P.k,a[1],a[2]))return{ok:false,err:"sig"};
  return{ok:true,co:L.P.n,lic:L.P.i,emp:I.i,name:I.n,secret:I.s};
}
/* Foglio ore: HLS1.<payload>.<mac> */
const hk=s=>crypto.subtle.importKey("raw",unb64(s),HM,false,["sign","verify"]);
async function makeSheet(e,month,days,names){
  const pl=b64(TE.encode(JSON.stringify({v:1,li:e.lic,e:e.emp,n:e.name,m:month,d:days,a:names,t:new Date().toISOString()})));
  const mac=b64(new Uint8Array(await crypto.subtle.sign("HMAC",await hk(e.secret),TE.encode(pl))));
  return"HLS1."+pl+"."+mac;
}
const TIME=/^(\d{2}:\d{2})?$/;
async function checkSheet(code,emps,licId){
  const a=String(code||"").trim().split(".");
  if(a[0]!=="HLS1"||a.length!==3)return{ok:false,err:"fmt"};
  let S;try{S=jOf(a[1])}catch(e){return{ok:false,err:"fmt"}}
  if(!S||S.li!==licId||!/^\d{4}-\d{2}$/.test(S.m||"")||typeof S.d!=="object"||!S.d)return{ok:false,err:"fmt"};
  const e=emps.find(x=>x.id===S.e);if(!e)return{ok:false,err:"unknown"};
  let good=false;try{good=await crypto.subtle.verify("HMAC",await hk(e.s),unb64(a[2]),TE.encode(a[1]))}catch(x){}
  if(!good)return{ok:false,err:"sig"};
  const d={};
  for(const k in S.d){const v=S.d[k];
    if(!/^\d{1,2}$/.test(k)||+k<1||+k>31||!Array.isArray(v)||v.length!==4||!v.every(t=>typeof t==="string"&&TIME.test(t)))return{ok:false,err:"fmt"};
    if(v.some(x=>x))d[k]=v}
  const nm=Array.isArray(S.a)?S.a.slice(0,2).map(x=>String(x).slice(0,24)):["Turno 1","Turno 2"];
  return{ok:true,S:{e:S.e,m:S.m,d,a:nm,t:String(S.t||"")}};
}
const pull=(t,re)=>{const m=String(t||"").match(re);return m?m[0]:null};
