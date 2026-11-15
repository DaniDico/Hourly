/* Hourly - GPL-3.0 (vedi LICENSE). Ingresso, modalità azienda, invio ore e avvio dell'app. */
const VER="1.0.0",TERMS="1";
const LSget=(k,d=null)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let co=LSget("hly-co"),emp=LSget("hly-emp"),LIC=null,cm=mk(),openE=null,ctab="d",gstep="choose";
const saveCo=()=>LSset("hly-co",co);
const rndId=n=>b64(crypto.getRandomValues(new Uint8Array(n)));
const mname=k=>MESI[+k.slice(5)-1]+" "+k.slice(0,4);
const fdate=s=>s.split("-").reverse().join("/");
const fdt=iso=>{try{return new Date(iso).toLocaleDateString("it-IT")}catch(e){return""}};
const base=()=>location.href.split("#")[0];
const mshift=(k,n)=>{let y=+k.slice(0,4),m=+k.slice(5)-1+n;while(m<0){m+=12;y--}while(m>11){m-=12;y++}return y+"-"+pad(m+1)};
const mtot=s=>{let t=0,g=0;for(const d in s.d){const x=totV(s.d[d]);t+=x;if(x)g++}return{t,g}};
async function copyTxt(t){try{await navigator.clipboard.writeText(t);toast("Copiato")}catch(e){window.prompt("Copia da qui:",t)}}
async function shareTxt(title,text){if(navigator.share){try{await navigator.share({title,text});return}catch(e){if(e&&e.name==="AbortError")return}}copyTxt(text)}
function modal(html){
  const o=document.createElement("div");o.className="ov";
  o.innerHTML='<div class="mo">'+html+'<button class="btn2 mc" id="mclose">Chiudi</button></div>';
  document.body.appendChild(o);
  o.onclick=e=>{if(e.target===o||e.target.id==="mclose")o.remove()};
  return o;
}
const infoHtml=()=>'<div class="gp"><h3>Informazioni</h3><div class="lnk"><a href="termini.html" target="_blank" rel="noopener">Termini d’uso</a><a href="privacy.html" target="_blank" rel="noopener">Informativa privacy</a><a href="https://github.com/DaniDico/Hourly" target="_blank" rel="noopener">Codice sorgente e licenza GPL-3.0</a></div><p class="note">Hourly '+VER+'. L’app non ha server né account: i dati restano sul tuo dispositivo. Non sostituisce i registri obbligatori previsti dalla legge.</p></div>';
const errTxt=e=>({fmt:"Il codice non è nel formato corretto.",sig:"Codice non valido.",nokey:"L’app non è ancora configurata (manca la chiave di verifica). Contatta chi ti ha fornito l’app."}[e]||"Codice non valido.");

/* ---------- Ingresso ---------- */
const ge=m=>{const e=$("gerr");if(e)e.textContent=m||""};
function gate(step,msg,pre){
  gstep=step;const g=$("gate");g.hidden=false;document.body.classList.add("gated");
  const cons='<label class="ck"><input type="checkbox" id="acc"><span>Ho letto e accetto i <a href="termini.html" target="_blank" rel="noopener">Termini d’uso</a> e l’<a href="privacy.html" target="_blank" rel="noopener">Informativa privacy</a>.</span></label>';
  const links='<div class="lk"><a href="termini.html" target="_blank" rel="noopener">Termini d’uso</a><a href="privacy.html" target="_blank" rel="noopener">Informativa privacy</a></div>';
  const err='<div class="err" id="gerr">'+esc(msg||"")+'</div>';
  let h="";
  if(step==="choose")h='<h2>Hourly</h2><p>Registra le tue ore di lavoro e invia i fogli ore alla tua azienda, oppure gestisci i dipendenti della tua attività.</p><button class="bigb" id="g-emp">Sono un dipendente</button><button class="bigb s" id="g-co">Sono un’azienda</button>'+links;
  else if(step==="emp")h='<button class="back" id="g-back">‹ Indietro</button><h2>Codice dell’azienda</h2><p>Incolla il codice (o apri il link) che ti ha dato il tuo datore di lavoro. Serve per usare l’app.</p><textarea id="gc" placeholder="HLE1…" spellcheck="false" autocapitalize="off" autocorrect="off">'+esc(pre||"")+'</textarea>'+cons+err+'<button class="bigb" id="gok">Attiva</button>'+links;
  else if(step==="co")h='<button class="back" id="g-back">‹ Indietro</button><h2>Licenza aziendale</h2><p>Incolla il codice di licenza che hai acquistato. Sarà salvato su questo dispositivo insieme ai dati della tua azienda.</p><textarea id="gc" placeholder="HLY1…" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>'+cons+err+'<button class="bigb" id="gok">Attiva licenza</button>'+links;
  else h='<h2>Licenza non valida o scaduta</h2><p>'+esc(msg||"")+' I dati dell’azienda restano salvati su questo dispositivo e tornano disponibili con una licenza valida.</p><textarea id="gc" placeholder="HLY1… (nuovo codice di licenza)" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>'+err+'<button class="bigb" id="gren">Aggiorna licenza</button><button class="bigb s" id="gexp">Esporta i dati (backup)</button>'+links;
  g.innerHTML='<div class="in">'+h+'</div>';
}
async function actEmp(){
  const raw=pull($("gc").value,/HLE1\.[\w-]+\.[\w-]+/);
  if(!$("acc").checked)return ge("Per continuare devi accettare i Termini d’uso e l’Informativa privacy.");
  if(!raw)return ge("Codice non trovato: controlla di averlo incollato per intero.");
  const I=await checkInvite(raw);if(!I.ok)return ge(errTxt(I.err));
  emp={code:raw,co:I.co,lic:I.lic,emp:I.emp,name:I.name,secret:I.secret,acc:new Date().toISOString(),v:TERMS};
  LSset("hly-emp",emp);LSset("hly-mode","emp");
  if(!cfg.name){cfg.name=I.name;saveCfg()}
  startEmp();
}
async function actCo(){
  const raw=pull($("gc").value,/HLY1\.[\w-]+\.[\w-]+(\.[\w-]+)?/);
  if(!$("acc").checked)return ge("Per continuare devi accettare i Termini d’uso e l’Informativa privacy.");
  if(!raw)return ge("Codice non trovato: controlla di averlo incollato per intero.");
  const L=await checkLic(raw);if(!L.ok)return ge(errTxt(L.err));
  if(!L.d)return ge("Questo non è un codice di licenza aziendale.");
  if(expired(L.P))return ge("La licenza è scaduta il "+fdate(L.P.e)+".");
  let same=false;
  if(co&&co.lic){
    const O=await checkLic(co.lic);same=O.ok&&O.P.i===L.P.i;
    if(!same&&(co.emps.length||Object.keys(co.sh).length)&&!confirm("Su questo dispositivo ci sono i dati di un’altra azienda. Se continui verranno sostituiti. Hai fatto un backup?"))return;
  }
  co=same?{...co,lic:raw}:{lic:raw,emps:[],sh:{},pdfT:"",note:""};
  co.acc=new Date().toISOString();co.v=TERMS;saveCo();LSset("hly-mode","co");LIC=L;startCo();
}
async function renew(){
  const raw=pull($("gc").value,/HLY1\.[\w-]+\.[\w-]+(\.[\w-]+)?/);
  if(!raw)return ge("Codice non trovato.");
  const L=await checkLic(raw);if(!L.ok)return ge(errTxt(L.err));
  if(!L.d)return ge("Questo non è un codice di licenza aziendale.");
  if(expired(L.P))return ge("Anche questa licenza è scaduta il "+fdate(L.P.e)+".");
  const O=await checkLic(co.lic);
  if(O.ok&&O.P.i!==L.P.i)return ge("Questo codice appartiene a un’altra azienda.");
  co.lic=raw;saveCo();LIC=L;startCo();
}
$("gate").addEventListener("click",e=>{
  const id=e.target.id;
  if(id==="g-emp")gate("emp");else if(id==="g-co")gate("co");else if(id==="g-back")gate("choose");
  else if(id==="gok")gstep==="emp"?actEmp():actCo();
  else if(id==="gren")renew();
  else if(id==="gexp")saveFile("backup-hourly-azienda.json",JSON.stringify({v:3,co}));
});

/* ---------- Dipendente ---------- */
function sendBar(){
  const el=$("sendbar");if(!el)return;
  el.innerHTML=MODE==="emp"&&emp?'<button class="btn2 sb" id="send">Invia le ore di '+esc(MESI[cur.m].toLowerCase())+' a '+esc(emp.co)+'</button>':"";
}
$("vm").addEventListener("click",e=>{if(e.target.id==="send")sendMonth(mk())});
async function sendMonth(k){
  const days={},o=data[k]||{};
  for(const d in o)if(o[d].some(x=>x))days[d]=o[d];
  if(!Object.keys(days).length){toast("Nessun orario da inviare per questo mese");return}
  const code=await makeSheet(emp,k,days,[sn(0),sn(1)]),link=base()+"#f="+code;
  const txt="Ore di "+emp.name+" - "+mname(k)+"\n"+link+"\n\nCodice (se il link non si apre):\n"+code;
  const m=modal('<h3>Invia le ore di '+esc(mname(k))+'</h3><p class="note">Invierai a <b>'+esc(emp.co)+'</b> i tuoi orari di questo mese. I dati partono solo se scegli un’app di condivisione. Puoi reinviarli quando vuoi: il foglio nuovo sostituisce il precedente.</p><div class="acts2"><button class="btn2" id="s1">Condividi</button><button class="btn2" id="s2">Copia</button></div><div class="acts2"><button class="btn2" id="s3">Salva file</button></div>');
  m.querySelector("#s1").onclick=()=>shareTxt("Ore di "+emp.name+" - "+mname(k),txt);
  m.querySelector("#s2").onclick=()=>copyTxt(txt);
  m.querySelector("#s3").onclick=()=>saveFile("ore-"+k+".hly",code);
}
function unlinkEmp(){
  if(!confirm("Scollegarti dall’azienda? Le tue ore restano sul telefono, ma per usare l’app dovrai inserire un nuovo codice."))return;
  try{localStorage.removeItem("hly-emp");localStorage.removeItem("hly-mode")}catch(e){}
  location.reload();
}
function wipeAll(){
  if(!confirm("Cancellare TUTTI i dati di questo dispositivo (ore, impostazioni, collegamento all’azienda)? L’operazione non si può annullare."))return;
  try{["ore-lavoro-v1","ore-lavoro-cfg","hly-emp","hly-co","hly-mode"].forEach(k=>localStorage.removeItem(k))}catch(e){}
  location.reload();
}

/* ---------- Azienda ---------- */
const NAVCO='<button data-tab="d" class="on"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17.5" cy="9" r="2.4"/><path d="M17 14.5c2.4.2 4 1.9 4 4.5"/></svg>Dipendenti</button><button data-tab="r"><svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>Archivio</button><button data-tab="s"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>Impostazioni</button>';
const CT={d:"Dipendenti",r:"Archivio",s:"Impostazioni"};
function showCo(keep){
  $("vm").style.display=$("va").style.display="none";
  [["d","vd"],["r","vr"],["s","vs"]].forEach(a=>$(a[1]).style.display=ctab===a[0]?"":"none");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.tab===ctab));
  $("title").textContent=CT[ctab];
  if(ctab==="d")dip();else if(ctab==="r")arc();else setsCo();
  if(!keep)window.scrollTo(0,0);
}
const active=()=>co.emps.filter(e=>e.a);
function dip(){
  const act=active(),max=LIC.P.m,old=co.emps.filter(e=>!e.a),got=e=>Object.keys(co.sh[e.id]||{}).length;
  let h='<div class="sm"><div><b class="num">'+act.length+' / '+max+'</b><span>dipendenti attivi</span></div><div><b class="num">'+Math.max(0,max-act.length)+'</b><span>posti liberi</span></div></div>';
  h+='<div class="gp"><h3>Nuovo dipendente</h3><div class="rowf"><label for="en">Nome</label><input type="text" id="en" maxlength="40" placeholder="Nome e cognome" autocomplete="off"></div><div class="acts2"><button class="btn2" id="eadd">Aggiungi e crea codice</button></div></div>';
  if(!act.length)h+='<p class="none">Nessun dipendente.<br>Aggiungine uno per creare il suo codice di accesso.</p>';
  act.forEach(e=>{h+='<div class="er"><div><b>'+esc(e.n)+'</b><small>'+(got(e)?got(e)+(got(e)===1?" mese ricevuto":" mesi ricevuti"):"Nessun foglio ricevuto")+'</small></div><div class="r"><button class="ap" data-ic="'+e.id+'">Codice</button><button class="ap" data-rm="'+e.id+'">Rimuovi</button></div></div>'});
  if(old.length){h+='<div class="yh"><b>Ex dipendenti</b></div>';old.forEach(e=>{h+='<div class="er"><div><b class="mut">'+esc(e.n)+'</b><small>'+got(e)+' mesi in archivio</small></div><div class="r"><button class="ap" data-ra="'+e.id+'">Riattiva</button><button class="ap" data-del="'+e.id+'">Elimina</button></div></div>'})}
  $("vd").innerHTML=h;
}
async function showInvite(e){
  const code=await makeInvite(LIC,e),link=base()+"#j="+code;
  const m=modal('<h3>Codice di '+esc(e.n)+'</h3><p class="note">Invia questo codice al dipendente (messaggio o email). È personale: non va condiviso con altri. Il dipendente lo inserisce nell’app, oppure apre il link.</p><div class="code">'+code+'</div><div class="acts2"><button class="btn2" id="ish">Condividi link</button><button class="btn2" id="icp">Copia codice</button></div>');
  m.querySelector("#icp").onclick=()=>copyTxt(code);
  m.querySelector("#ish").onclick=()=>shareTxt("Accesso a Hourly","Ciao "+e.n+", ecco il tuo accesso a Hourly per "+LIC.P.n+":\n"+link+"\n\nCodice (se il link non si apre):\n"+code);
}
$("vd").addEventListener("click",e=>{
  const T=e.target,id=T.id;
  if(id==="eadd"){
    const n=$("en").value.trim();
    if(!n)return toast("Scrivi il nome del dipendente");
    if(active().length>=LIC.P.m)return toast("Hai raggiunto il limite di "+LIC.P.m+" dipendenti della licenza");
    const x={id:rndId(6),n,s:rndId(16),c:new Date().toISOString(),a:true};
    co.emps.push(x);saveCo();dip();showInvite(x);return;
  }
  const f=a=>co.emps.find(x=>x.id===T.dataset[a]);
  if(T.dataset.ic)showInvite(f("ic"));
  else if(T.dataset.rm){const x=f("rm");if(confirm("Rimuovere "+x.n+"? Le ore già archiviate restano consultabili, ma non potrà più inviare nuovi fogli."))if(x){x.a=false;saveCo();dip()}}
  else if(T.dataset.ra){if(active().length>=LIC.P.m)return toast("Hai raggiunto il limite di "+LIC.P.m+" dipendenti");f("ra").a=true;saveCo();dip()}
  else if(T.dataset.del){const x=f("del");if(confirm("Eliminare definitivamente "+x.n+" e tutte le sue ore archiviate?")){co.emps=co.emps.filter(y=>y.id!==x.id);delete co.sh[x.id];saveCo();dip()}}
});

async function importCodes(text){
  const codes=[...new Set([...String(text).matchAll(/HLS1\.[\w-]+\.[\w-]+/g)].map(m=>m[0]))];
  if(!codes.length){toast("Nessun foglio ore trovato");return}
  let ok=0,bad=0,old=0;
  for(const c of codes){
    const r=await checkSheet(c,active(),LIC.P.i);
    if(!r.ok){bad++;continue}
    const S=r.S,cur0=(co.sh[S.e]||{})[S.m];
    if(cur0&&cur0.t>S.t){old++;continue}
    (co.sh[S.e]=co.sh[S.e]||{})[S.m]={d:S.d,a:S.a,t:S.t,r:new Date().toISOString()};ok++;
  }
  saveCo();
  toast((ok?ok+(ok===1?" foglio importato":" fogli importati"):"Nessun foglio importato")+(bad?" · "+bad+" non validi":"")+(old?" · "+old+" già presenti più recenti":""));
  if(ctab==="r")arc();
}
function detail(e,k,s){
  const ms=Object.keys(co.sh[e.id]||{}).sort().reverse();
  let h='<div class="det">';
  if(s){
    Object.keys(s.d).map(Number).sort((a,b)=>a-b).forEach(d=>{
      const v=s.d[d],w=GG[new Date(+k.slice(0,4),+k.slice(5)-1,d).getDay()];
      h+='<div class="drw num"><span>'+w+" "+d+'</span><span>'+[[v[0],v[1]],[v[2],v[3]]].filter(p=>p[0]||p[1]).map(p=>(p[0]||"--:--")+"–"+(p[1]||"--:--")).join("  ·  ")+'</span><b>'+fmt(totV(v))+'</b></div>';
    });
    h+='<div class="acts2" style="margin-top:10px"><button class="btn2" data-ep="'+e.id+'">PDF di '+esc(e.n)+'</button></div>';
  }
  if(ms.length)h+='<div class="hist">'+ms.map(m=>'<button data-hm="'+m+'" class="'+(m===k?"on":"")+'">'+MESI[+m.slice(5)-1].slice(0,3)+" "+m.slice(2,4)+" · "+fmt(mtot(co.sh[e.id][m]).t)+'</button>').join("")+'</div>';
  return h+'</div>';
}
function arc(){
  const k=cm,sh=e=>(co.sh[e.id]||{})[k],list=co.emps.filter(e=>e.a||sh(e));
  let T=0,N=0,miss=0;
  list.forEach(e=>{const s=sh(e);if(s){T+=mtot(s).t;N++}else if(e.a)miss++});
  let h='<div class="mnav"><button class="ib" id="cpv" aria-label="Mese precedente">‹</button><b>'+esc(mname(k))+'</b><button class="ib" id="cnx" aria-label="Mese successivo">›</button></div>';
  h+='<div class="sm f3"><div><b class="num">'+fmt(T)+'</b><span>ore totali</span></div><div><b class="num">'+N+'</b><span>fogli ricevuti</span></div><div><b class="num">'+miss+'</b><span>mancanti</span></div></div>';
  h+='<div class="acts2"><button class="btn2" id="imf">Importa da file</button><button class="btn2" id="imp">Incolla codici</button></div>';
  if(list.length)h+='<div class="acts2"><button class="btn2" id="psum">PDF riepilogo del mese</button></div>';
  else h+='<p class="none">Nessun dipendente.<br>Aggiungili dalla scheda Dipendenti.</p>';
  list.forEach(e=>{
    const s=sh(e),x=s?mtot(s):null;
    h+='<div class="er"><button class="ao" data-ex="'+e.id+'"><b>'+esc(e.n)+(e.a?"":' <span class="mut">(ex)</span>')+'</b><small>'+(s?x.g+(x.g===1?" giorno":" giorni")+", ricevuto il "+fdt(s.r):"Nessun foglio ricevuto")+'</small></button><span class="tt num" style="font-size:20px;font-weight:700">'+(s?fmt(x.t):"—")+'</span>'+(openE===e.id?detail(e,k,s):"")+'</div>';
  });
  $("vr").innerHTML=h;
}
$("vr").addEventListener("click",e=>{
  const T=e.target.closest("button");if(!T)return;
  const id=T.id;
  if(id==="cpv"){cm=mshift(cm,-1);arc()}
  else if(id==="cnx"){cm=mshift(cm,1);arc()}
  else if(id==="imf")$("mfile").click();
  else if(id==="imp"){
    const m=modal('<h3>Incolla i fogli ore</h3><p class="note">Incolla uno o più codici (o link) ricevuti dai dipendenti.</p><textarea id="ptx" placeholder="HLS1…" spellcheck="false"></textarea><div class="acts2"><button class="btn2" id="pgo">Importa</button></div>');
    m.querySelector("#pgo").onclick=async()=>{await importCodes(m.querySelector("#ptx").value);m.remove()};
  }
  else if(id==="psum")pdfSummary();
  else if(T.dataset.ex){openE=openE===T.dataset.ex?null:T.dataset.ex;arc()}
  else if(T.dataset.hm){cm=T.dataset.hm;arc()}
  else if(T.dataset.ep){
    const x=co.emps.find(y=>y.id===T.dataset.ep),s=(co.sh[x.id]||{})[cm];if(!s)return;
    pdfMonth({k:cm,get:d=>s.d[d]||EMPTY(),title:co.pdfT||"Ore dipendenti",sub:x.n+" - "+LIC.P.n,n1:s.a[0],n2:s.a[1],all:false,zebra:cfg.pdfZebra,avg:cfg.pdfAvg,note:co.note,file:"ore-"+x.n.replace(/[^\w]+/g,"-")+"-"+cm+".pdf"});
  }
});
$("mfile").onchange=async e=>{
  let t="";for(const f of e.target.files)t+=await f.text()+"\n";
  e.target.value="";await importCodes(t);
};
async function pdfSummary(){
  try{
    if(!await pdfLib().catch(()=>false)){toast("Libreria PDF non disponibile: serve la connessione");return}
    const rows=[];let T=0,G=0;
    co.emps.forEach(e=>{const s=(co.sh[e.id]||{})[cm];if(!s&&!e.a)return;if(s){const x=mtot(s);T+=x.t;G+=x.g;rows.push([e.n,x.g,fmt(x.t)])}else rows.push([e.n,"-","non ricevuto"])});
    const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"}),hx=acc(),rgb=[1,3,5].map(i=>parseInt(hx.substr(i,2),16)),tint=f=>rgb.map(x=>Math.round(255-(255-x)*f));
    doc.setFontSize(16);doc.text((co.pdfT||"Ore dipendenti")+" - "+mname(cm),14,16);
    doc.setFontSize(10);doc.text(LIC.P.n,14,22);
    doc.autoTable({startY:26,theme:"grid",head:[["Dipendente","Giorni lavorati","Ore totali"]],body:rows,foot:[["TOTALE",G,fmt(T)]],
      styles:{fontSize:10,cellPadding:2.4,halign:"center",lineColor:[205,210,222],lineWidth:0.15,textColor:30,fillColor:[255,255,255]},
      alternateRowStyles:cfg.pdfZebra?{fillColor:tint(0.13)}:{},columnStyles:{0:{halign:"left",fontStyle:"bold"},2:{fontStyle:"bold"}},
      headStyles:{fillColor:rgb,textColor:255},footStyles:{fillColor:tint(0.3),textColor:20,fontStyle:"bold"}});
    doc.setFontSize(8);doc.setTextColor(120);doc.text(co.note||PDFNOTE,14,doc.internal.pageSize.getHeight()-8);
    await saveFile("riepilogo-"+cm+".pdf",doc.output("arraybuffer"));
  }catch(e){toast("Esportazione non riuscita")}
}
const txtL=(id,l,v,ph,max)=>'<div class="rowf"><label for="'+id+'">'+l+'</label><input type="text" id="'+id+'" placeholder="'+ph+'" value="'+esc(v)+'" maxlength="'+max+'"></div>';
function setsCo(){
  const P=LIC.P;
  $("vs").innerHTML=
  '<div class="gp"><h3>Licenza</h3><div class="rowf"><label>Azienda</label><span class="v">'+esc(P.n)+'</span></div><div class="rowf"><label>Scadenza</label><span class="v">'+(P.e?fdate(P.e):"Nessuna")+'</span></div><div class="rowf"><label>Dipendenti</label><span class="v">'+active().length+' / '+P.m+'</span></div><p class="sub">Per rinnovare o aggiornare la licenza incolla il nuovo codice.</p><textarea id="rl" placeholder="HLY1…" spellcheck="false" style="min-height:80px"></textarea><div class="acts2"><button class="btn2" id="rlb">Aggiorna licenza</button><button class="btn2" id="clc">Copia codice licenza</button></div></div>'+
  '<div class="gp"><h3>Documenti PDF</h3>'+txtL("ct","Titolo",co.pdfT||"","Ore dipendenti",40)+txtL("cn","Nota a piè di pagina",co.note||"","Facoltativa",110)+tgl("pdfZebra","Righe a colori alternati")+tgl("pdfAvg","Riga con la media")+'</div>'+
  '<div class="gp"><h3>Formato delle ore</h3>'+seg("dec",[["false","7:30"],["true","7,50"]])+'</div>'+
  '<div class="gp"><h3>Aspetto</h3>'+seg("theme",[["auto","Auto"],["light","Chiaro"],["dark","Scuro"]])+'<p class="sub">Colore dell’app</p><div class="sw tight">'+PAL.map((p,i)=>'<button data-pal="'+i+'" class="'+(i===cfg.pal?"on":"")+'" style="background:'+p[0]+'" aria-label="Colore '+(i+1)+'"></button>').join("")+'<label class="cs'+(cfg.pal<0?" on":"")+'" style="'+(cfg.pal<0?"background:"+cfg.col:"")+'"><input type="color" id="cc" value="'+cfg.col+'" aria-label="Colore personalizzato"></label></div><div style="height:10px"></div></div>'+
  '<div class="gp"><h3>I dati dell’azienda</h3><p class="note">Dipendenti, fogli ore e licenza sono salvati solo su questo dispositivo. Il backup contiene anche il codice di licenza: conservalo con cura e fallo spesso.</p><div class="acts2"><button class="btn2" id="cbk">Salva backup</button><button class="btn2" id="crs">Ripristina backup</button></div><div class="acts2"><button class="btn2" id="wipe">Cancella tutti i dati</button></div></div>'+infoHtml();
}
$("vs").addEventListener("input",e=>{
  if(MODE!=="co")return;
  if(e.target.id==="ct"){co.pdfT=e.target.value;saveCo()}
  else if(e.target.id==="cn"){co.note=e.target.value;saveCo()}
});
$("vs").addEventListener("click",async e=>{
  if(MODE!=="co")return;
  const id=e.target.id;
  if(id==="clc")copyTxt(co.lic);
  else if(id==="cbk")saveFile("backup-hourly-azienda.json",JSON.stringify({v:3,co}));
  else if(id==="crs")$("cfile").click();
  else if(id==="rlb"){
    const raw=pull($("rl").value,/HLY1\.[\w-]+\.[\w-]+(\.[\w-]+)?/);
    if(!raw)return toast("Incolla il nuovo codice di licenza");
    const L=await checkLic(raw);
    if(!L.ok||!L.d)return toast(errTxt(L.ok?"fmt":L.err));
    if(L.P.i!==LIC.P.i)return toast("Questo codice appartiene a un’altra azienda");
    if(expired(L.P))return toast("Questa licenza è scaduta");
    co.lic=raw;saveCo();LIC=L;setsCo();toast("Licenza aggiornata");
  }
});
$("cfile").onchange=async e=>{
  try{
    const f=e.target.files[0];if(!f)return;const o=JSON.parse(await f.text());
    const L=o&&o.co&&await checkLic(o.co.lic);
    if(!L||!L.ok||!L.d)throw 0;
    if(L.P.i!==LIC.P.i){toast("Il backup appartiene a un’altra azienda");return}
    co=o.co;saveCo();toast("Backup ripristinato");showCo(true);
  }catch(err){toast("File di backup non valido")}
  e.target.value="";
};
async function checkHash(){
  const f=/#f=(HLS1\.[\w-]+\.[\w-]+)/.exec(location.hash);
  if(!f)return;
  if(MODE==="co"){await importCodes(f[1]);ctab="r";showCo(true)}
  else toast("Questo link va aperto nell’app dell’azienda");
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
}

/* ---------- Avvio ---------- */
const persist=()=>{try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}};
function startEmp(){
  MODE="emp";$("gate").hidden=true;document.body.classList.remove("gated");
  tab="m";applyCfg();show();persist();checkHash();
}
function startCo(){
  MODE="co";tab="x";$("gate").hidden=true;document.body.classList.remove("gated");
  const nav=document.querySelector("nav");nav.querySelector("div").innerHTML=NAVCO;
  nav.onclick=e=>{const b=e.target.closest("[data-tab]");if(b){ctab=b.dataset.tab;showCo()}};
  $("hc").style.display="none";ctab="d";applyCfg();showCo();persist();checkHash();
}
async function boot(){
  applyCfg();
  const j=/#j=(HLE1\.[\w-]+\.[\w-]+)/.exec(location.hash),mode=LSget("hly-mode");
  if(j&&mode!=="co"){gate("emp","",j[1]);try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}return}
  if(mode==="co"&&co&&co.lic){
    const L=await checkLic(co.lic);
    if(L.ok&&L.d&&!expired(L.P)){LIC=L;startCo();return}
    gate("locked",L.ok?"La licenza è scaduta il "+fdate(L.P.e)+".":errTxt(L.err));return;
  }
  if(mode==="emp"&&emp&&emp.code){
    const I=await checkInvite(emp.code);
    if(I.ok){startEmp();return}
    gate("emp","Il codice dell’azienda non è più valido: inserisci un nuovo codice.");return;
  }
  gate("choose");
}
boot();
