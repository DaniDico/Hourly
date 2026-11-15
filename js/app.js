/* Hourly - GPL-3.0 (vedi LICENSE). Parte "dipendente" e funzioni comuni. */
let MODE=null;
const MESI=["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GG=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"],GGF=["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const KEY="ore-lavoro-v1",CFGKEY="ore-lavoro-cfg",EMPTY=()=>["","","",""];
const PAL=[["#0f7b6c","#3cc9ae"],["#2457c5","#7fa6ff"],["#c8452d","#ff8a6b"],["#475569","#a9b6c8"],["#6b7f1e","#b5cc5b"]];
const sn=k=>(cfg[k?"n2":"n1"]||"").trim()||("Turno "+(k+1)),lab=i=>(i%2?"Termina ":"Inizia ")+sn(i>>1).toLowerCase();
const SC=[["#e0a21b","#f0b63a"],["#e4572e","#ff8a6b"],["#3b5bb5","#86a0ee"],["#0f7b6c","#3cc9ae"],["#8b5cf6","#b9a0fb"],["#d946a8","#f27dcb"]];
const DEF={s1:"12:00",s2:"19:00",n1:"Turno 1",n2:"Turno 2",name:"",title:"Ore di lavoro",dec:false,theme:"auto",pal:0,col:"#0f7b6c",c1:0,c2:2,round:0,we:[0,6],pdfAll:false,pdfZebra:true,pdfAvg:true};
let data={},cfg={...DEF};
try{data=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
try{Object.assign(cfg,JSON.parse(localStorage.getItem(CFGKEY)||"{}"))}catch(e){}
delete cfg.rate;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
const saveCfg=()=>{try{localStorage.setItem(CFGKEY,JSON.stringify(cfg))}catch(e){}};
const STD=()=>[cfg.s1,"",cfg.s2,""];
const hex2=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const mixw=(h,f)=>"#"+hex2(h).map(x=>Math.round(x+(255-x)*f).toString(16).padStart(2,"0")).join("");
const lum=h=>{const c=hex2(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const accP=()=>PAL[cfg.pal]||[cfg.col,mixw(cfg.col,.35)],acc=()=>accP()[0];
function applyCfg(){
  const r=document.documentElement,p=accP(),a=SC[cfg.c1]||SC[0],b=SC[cfg.c2]||SC[2];
  r.style.setProperty("--ac-l",p[0]);r.style.setProperty("--ac-d",p[1]);
  r.style.setProperty("--t1-l",a[0]);r.style.setProperty("--t1-d",a[1]);
  r.style.setProperty("--t2-l",b[0]);r.style.setProperty("--t2-d",b[1]);
  const dark=cfg.theme==="dark"||(cfg.theme==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);
  r.setAttribute("data-theme",dark?"dark":"light");
  r.style.setProperty("--on",lum(dark?p[1]:p[0])>.55?"#08130f":"#fff");
  document.querySelector("meta[name=theme-color]").content=dark?"#0f1513":"#f1f3f0";
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>applyCfg());
let now=new Date(),cur={y:now.getFullYear(),m:now.getMonth()},openDay=null,tab="m";
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0");
const keyOf=c=>c.y+"-"+pad(c.m+1),mk=()=>keyOf(cur);
const tm=s=>{const [h,m]=s.split(":").map(Number);return h*60+m};
const dur=(a,b)=>(!a||!b)?0:((tm(b)-tm(a)+1440)%1440);
const fmt=m=>cfg.dec?(m/60).toFixed(2).replace(".",","):Math.floor(m/60)+":"+pad(m%60);
const nowStr=()=>{const d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())};
const stamp=()=>{const d=new Date();let m=d.getHours()*60+d.getMinutes();const r=+cfg.round;if(r>0)m=Math.round(m/r)*r;m%=1440;return pad(Math.floor(m/60))+":"+pad(m%60)};
const dim=(c=cur)=>new Date(c.y,c.m+1,0).getDate();
const getK=(k,d)=>((data[k]||{})[d])||EMPTY();
const get=d=>getK(mk(),d);
function set(d,v){const k=mk();data[k]=data[k]||{};v.every(x=>!x)?delete data[k][d]:data[k][d]=v;save()}
const totV=v=>dur(v[0],v[1])+dur(v[2],v[3]);
const dayTot=d=>totV(get(d));
function mstats(k){let t=0,g=0;const o=data[k]||{};for(const d in o){const s=totV(o[d]);t+=s;if(s)g++}return{t,g}}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),2500)}
const isCur=()=>cur.y===now.getFullYear()&&cur.m===now.getMonth();

const AX0=540,AX1=1620;
const pc=m=>Math.max(0,Math.min(100,(m-AX0)/(AX1-AX0)*100));
const AXH='<div class="ax">'+[[12,"12"],[16,"16"],[20,"20"],[24,"00"]].map(a=>'<span style="left:'+pc(a[0]*60)+'%">'+a[1]+'</span>').join("")+'</div>';
function strip(v,nowMin){
  let h="";
  [0,1].forEach(i=>{
    const a=v[i*2],b=v[i*2+1];if(!a)return;
    let st=tm(a);if(st<AX0)st+=1440;
    const en=b?st+dur(a,b):(nowMin!=null&&nowMin>=st?nowMin:st);
    h+='<i class="s'+(i+1)+'" style="left:'+pc(st)+'%;width:'+Math.max(pc(en)-pc(st),0)+'%"></i>';
  });
  if(nowMin!=null&&nowMin>=AX0&&nowMin<=AX1)h+='<u style="left:'+pc(nowMin)+'%"></u>';
  return h;
}
function hero(){
  const h=$("hero");
  if(!isCur()){h.innerHTML="";return}
  const d=now.getDate(),v=get(d),i=v.findIndex(x=>!x),run=i===1||i===3;
  let nm=tm(nowStr());if(nm<AX0)nm+=1440;
  let st="Non ancora iniziato";
  if(i===-1)st="Giornata completa";
  else if(run)st=esc(sn(i===1?0:1))+" in corso da "+fmt((tm(nowStr())-tm(v[i-1])+1440)%1440);
  else if(i===2)st="In pausa tra i due turni";
  h.innerHTML='<div class="hero"><div class="d">Oggi, '+GGF[now.getDay()].toLowerCase()+" "+d+" "+MESI[cur.m].toLowerCase()+'</div><div class="big num">'+fmt(dayTot(d))+'<small>ore</small></div><div class="st"><span class="dot'+(run?" run":"")+'"></span>'+st+'</div>'+
  '<div class="strip">'+strip(v,nm)+'</div>'+AXH+
  '<button class="punch" id="punch"'+(i===-1?" disabled":"")+'>'+(i===-1?"Fatto per oggi":esc(lab(i))+", "+(i%2?stamp():STD()[i]))+'</button>'+
  (v.some(x=>x)?'<button class="undo" id="undo">Annulla ultimo orario</button>':"")+'</div>';
  if($("punch"))$("punch").onclick=()=>{if(i<0)return;const w=get(d);w[i]=i%2?stamp():STD()[i];set(d,w);render();toast(lab(i)+": registrato")};
  if($("undo"))$("undo").onclick=()=>{const w=get(d);for(let k=3;k>=0;k--)if(w[k]){w[k]="";break}set(d,w);render()};
}
function stats(){
  const s=mstats(mk());
  const a=[[fmt(s.t),"ore totali"],[s.g,"giorni"],[fmt(s.g?Math.round(s.t/s.g):0),"media"]];
  $("stats").innerHTML=a.map(x=>'<div><b class="num">'+x[0]+'</b><span>'+x[1]+'</span></div>').join("");
}
function field(d,i,val,lbl){return '<div><label>'+lbl+'</label><div class="f'+(val?" has":"")+'"><input type="time" data-d="'+d+'" data-i="'+i+'" value="'+val+'"><button class="now" data-d="'+d+'" data-i="'+i+'">'+(i%2?"Ora":STD()[i])+'</button></div></div>'}
function list(){
  let out="";
  for(let d=1;d<=dim();d++){
    const w=new Date(cur.y,cur.m,d).getDay(),v=get(d),s=dayTot(d),any=v.some(x=>x),td=isCur()&&d===now.getDate();
    const tms=[[v[0],v[1]],[v[2],v[3]]].map(p=>(p[0]||p[1])?'<span class="num">'+(p[0]||"--:--")+" – "+(p[1]||"--:--")+'</span>':"").join("");
    out+='<div class="dr'+(cfg.we.includes(w)?" we":"")+(td?" today":"")+(any?"":" empty")+(openDay===d?" open":"")+'" id="d'+d+'"><button class="rw" data-t="'+d+'"><span class="dn"><b>'+d+'</b><small>'+GG[w].toLowerCase()+'</small></span><span class="mid">'+(any?'<div class="strip">'+strip(v,null)+'</div><div class="tm">'+tms+'</div>':"")+'</span><span class="tt num">'+(s?fmt(s):"")+'</span></button>'+
    '<div class="ed"><div><div class="ei">'+[0,1].map(k=>'<div class="sg'+(k?" b":"")+'"><h4>'+esc(sn(k))+'</h4>'+field(d,k*2,v[k*2],"Inizio")+field(d,k*2+1,v[k*2+1],"Fine")+'</div>').join("")+
    '<div class="ac2"><button data-copy="'+d+'">Copia giorno precedente</button><button data-clr="'+d+'">Svuota giorno</button></div></div></div></div></div>';
  }
  $("list").innerHTML=out;
}
function render(){
  if(tab==="m")$("title").innerHTML=MESI[cur.m]+"<span>"+cur.y+"</span>";
  hero();stats();list();if(typeof sendBar==="function")sendBar();
}
function arch(){
  const ks=Object.keys(data).filter(k=>Object.keys(data[k]||{}).length).sort().reverse();
  if(!ks.length){$("va").innerHTML='<p class="none">Ancora nessun mese registrato.<br>Inserisci le ore nella scheda Mese e compariranno qui.</p>';return}
  const yt={};let all=0,gg=0,mx=1,mn=Infinity;
  ks.forEach(k=>{const s=mstats(k);yt[k.slice(0,4)]=(yt[k.slice(0,4)]||0)+s.t;all+=s.t;gg+=s.g;mx=Math.max(mx,s.t);mn=Math.min(mn,s.t)});
  const heat=t=>{const p=mx>mn?(t-mn)/(mx-mn):.5,i=t/mx,H=Math.round(212-204*p),S=Math.round(30+50*i);return "--hc:hsl("+H+" "+S+"% 50%);--hb:hsla("+H+","+S+"%,50%,"+(0.04+0.2*i).toFixed(3)+")"};
  let out='<div class="sm"><div><b class="num">'+fmt(all)+'</b><span>ore totali</span></div><div><b class="num">'+gg+'</b><span>giorni</span></div><div><b class="num">'+ks.length+'</b><span>mesi</span></div></div>'+(ks.length>1?'<div class="lg"><span>meno ore</span><i></i><span>più ore</span></div>':"")+'<div style="height:6px"></div>',yr="";
  ks.forEach(k=>{
    if(k.slice(0,4)!==yr){yr=k.slice(0,4);out+='<div class="yh"><b>'+yr+'</b><span class="num">'+fmt(yt[yr])+' ore</span></div>'}
    const s=mstats(k);
    out+='<div class="am" style="'+heat(s.t)+'"><button class="ao" data-open="'+k+'"><b>'+MESI[+k.slice(5)-1]+'</b><small>'+s.g+(s.g===1?" giorno, media ":" giorni, media ")+fmt(s.g?Math.round(s.t/s.g):0)+'</small></button><div class="r"><span class="tt num">'+fmt(s.t)+'</span><button class="ap" data-pdf="'+k+'">PDF</button>'+(MODE==="emp"&&emp?'<button class="ap" data-send="'+k+'">Invia</button>':"")+'</div><div class="ar"><i style="width:'+Math.round(s.t/mx*100)+'%"></i></div></div>';
  });
  $("va").innerHTML=out;
}
function seg(key,items){return '<div class="seg">'+items.map(i=>'<button data-seg="'+key+'" data-v="'+i[0]+'" class="'+(String(cfg[key])===i[0]?"on":"")+'">'+i[1]+'</button>').join("")+'</div>'}
const WD=[[1,"Lun"],[2,"Mar"],[3,"Mer"],[4,"Gio"],[5,"Ven"],[6,"Sab"],[0,"Dom"]];
const tgl=(k,l)=>'<div class="rowf"><label>'+l+'</label><button class="tg'+(cfg[k]?" on":"")+'" role="switch" aria-checked="'+!!cfg[k]+'" data-tg="'+k+'" aria-label="'+l+'"></button></div>';
const txt=(id,l,v,ph)=>'<div class="rowf"><label for="'+id+'">'+l+'</label><input type="text" id="'+id+'" placeholder="'+ph+'" value="'+esc(v)+'" maxlength="24"></div>';
const tim=(id,l,v)=>'<div class="rowf"><label for="'+id+'">'+l+'</label><input type="time" id="'+id+'" value="'+v+'"></div>';
const swc=key=>'<div class="sw tight">'+SC.map((c,i)=>'<button data-sc="'+key+'" data-v="'+i+'" class="'+(cfg[key]===i?"on":"")+'" style="background:'+c[0]+'" aria-label="Colore '+(i+1)+'"></button>').join("")+'</div>';
const compHtml=()=>emp?'<div class="gp"><h3>Azienda</h3><div class="rowf"><label>Azienda</label><span class="v">'+esc(emp.co)+'</span></div><div class="rowf"><label>Il tuo nome</label><span class="v">'+esc(emp.name)+'</span></div><div class="acts2"><button class="btn2" id="unlink">Scollega dall’azienda</button></div></div>':"";
function setsEmp(){
  $("vs").innerHTML=
  '<div class="gp"><h3>Turni</h3>'+txt("n1","Nome primo turno",cfg.n1,"Turno 1")+tim("s1","Inizio primo turno",cfg.s1)+txt("n2","Nome secondo turno",cfg.n2,"Turno 2")+tim("s2","Inizio secondo turno",cfg.s2)+'</div>'+
  '<div class="gp"><h3>Arrotonda l’ora quando timbri</h3>'+seg("round",[["0","No"],["5","5 min"],["15","15 min"],["30","30 min"]])+'</div>'+
  '<div class="gp"><h3>Giorni evidenziati</h3><div class="chips">'+WD.map(w=>'<button data-we="'+w[0]+'" class="'+(cfg.we.includes(w[0])?"on":"")+'">'+w[1]+'</button>').join("")+'</div></div>'+
  '<div class="gp"><h3>Documento PDF</h3>'+txt("tt","Titolo",cfg.title,"Ore di lavoro")+txt("nm","Nome",cfg.name,"Facoltativo")+tgl("pdfZebra","Righe a colori alternati")+tgl("pdfAvg","Riga con la media")+tgl("pdfAll","Anche i giorni di riposo")+'</div>'+
  '<div class="gp"><h3>Formato delle ore</h3>'+seg("dec",[["false","7:30"],["true","7,50"]])+'</div>'+
  '<div class="gp"><h3>Aspetto</h3>'+seg("theme",[["auto","Auto"],["light","Chiaro"],["dark","Scuro"]])+
  '<p class="sub">Colore dell’app</p><div class="sw tight">'+PAL.map((p,i)=>'<button data-pal="'+i+'" class="'+(i===cfg.pal?"on":"")+'" style="background:'+p[0]+'" aria-label="Colore '+(i+1)+'"></button>').join("")+'<label class="cs'+(cfg.pal<0?" on":"")+'" style="'+(cfg.pal<0?"background:"+cfg.col:"")+'"><input type="color" id="cc" value="'+cfg.col+'" aria-label="Colore personalizzato"></label></div>'+
  '<p class="sub">Colore del primo turno</p>'+swc("c1")+'<p class="sub">Colore del secondo turno</p>'+swc("c2")+'<div style="height:10px"></div></div>'+
  compHtml()+
  '<div class="gp"><h3>I tuoi dati</h3><p class="note">Le ore sono salvate solo su questo dispositivo. Le vede l’azienda solo se le invii tu. Fai ogni tanto un backup.</p><div class="acts2"><button class="btn2" id="bk">Salva backup</button><button class="btn2" id="rs">Ripristina backup</button></div><div class="acts2"><button class="btn2" id="rd">Ripristina impostazioni predefinite</button></div><div class="acts2"><button class="btn2" id="wipe">Cancella tutti i miei dati</button></div></div>'+infoHtml();
}
function sets(){return MODE==="co"?setsCo():setsEmp()}
function show(){
  ["m","a","s"].forEach(t=>$("v"+t).style.display=tab===t?"":"none");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.tab===tab));
  $("hc").style.display=tab==="m"?"":"none";
  if(tab==="m")render();else $("title").textContent=tab==="a"?"Archivio":"Impostazioni";
  if(tab==="a")arch();if(tab==="s")sets();window.scrollTo(0,0);
}
document.querySelector("nav").onclick=e=>{const b=e.target.closest("[data-tab]");if(b){tab=b.dataset.tab;show()}};

$("list").addEventListener("click",e=>{
  const t=e.target.closest("[data-t]");
  if(t){const d=+t.dataset.t;openDay=openDay===d?null:d;list();if(openDay)$("d"+d).scrollIntoView({block:"nearest",behavior:"smooth"});return}
  const n=e.target.closest(".now");
  if(n){const d=+n.dataset.d,ii=+n.dataset.i,v=get(d);v[ii]=ii%2?stamp():STD()[ii];set(d,v);render();return}
  const c=e.target.closest("[data-copy]");
  if(c){const d=+c.dataset.copy;for(let p=d-1;p>=1;p--){const v=get(p);if(v.some(x=>x)){set(d,v.slice());render();toast("Copiato dal giorno "+p);return}}toast("Nessun giorno precedente");return}
  const x=e.target.closest("[data-clr]");
  if(x){set(+x.dataset.clr,EMPTY());render()}
});
$("list").addEventListener("change",e=>{const t=e.target;if(t.type!=="time")return;const d=+t.dataset.d,v=get(d);v[+t.dataset.i]=t.value;set(d,v);render()});
function go(n){cur.m+=n;if(cur.m<0){cur.m=11;cur.y--}if(cur.m>11){cur.m=0;cur.y++}openDay=null;render();window.scrollTo(0,0)}
$("prev").onclick=()=>go(-1);$("next").onclick=()=>go(1);

$("va").addEventListener("click",e=>{
  const o=e.target.closest("[data-open]");
  if(o){const k=o.dataset.open;cur={y:+k.slice(0,4),m:+k.slice(5)-1};openDay=null;tab="m";render();show();return}
  const q=e.target.closest("[data-send]");if(q){sendMonth(q.dataset.send);return}
  const p=e.target.closest("[data-pdf]");if(p)exportPdf(p.dataset.pdf);
});
$("vs").addEventListener("input",e=>{
  const i=e.target.id,v=e.target.value;
  if(i==="s1")cfg.s1=v||DEF.s1;
  else if(i==="s2")cfg.s2=v||DEF.s2;
  else if(i==="n1")cfg.n1=v;
  else if(i==="n2")cfg.n2=v;
  else if(i==="nm")cfg.name=v;
  else if(i==="tt")cfg.title=v;
  else if(i==="cc"){cfg.col=v;cfg.pal=-1;document.querySelectorAll("#vs .sw .on").forEach(b=>b.classList.remove("on"));const l=e.target.parentNode;l.classList.add("on");l.style.background=v}
  else return;
  saveCfg();applyCfg();render();
});
$("vs").addEventListener("click",e=>{
  const T=e.target;let b=T.closest("[data-seg]");
  if(b){const k=b.dataset.seg,v=b.dataset.v;cfg[k]=k==="dec"?v==="true":k==="round"?+v:v;saveCfg();applyCfg();render();sets();return}
  b=T.closest("[data-pal]");if(b){cfg.pal=+b.dataset.pal;saveCfg();applyCfg();sets();return}
  b=T.closest("[data-sc]");if(b){cfg[b.dataset.sc]=+b.dataset.v;saveCfg();applyCfg();render();sets();return}
  b=T.closest("[data-tg]");if(b){cfg[b.dataset.tg]=!cfg[b.dataset.tg];saveCfg();sets();return}
  b=T.closest("[data-we]");if(b){const w=+b.dataset.we;cfg.we=cfg.we.includes(w)?cfg.we.filter(x=>x!==w):cfg.we.concat(w);saveCfg();render();sets();return}
  if(T.id==="unlink"){unlinkEmp();return}
  if(T.id==="wipe"){wipeAll();return}
  if(T.id==="bk")saveFile("backup-ore-lavoro.json",JSON.stringify({v:2,data,cfg}));
  if(T.id==="rs")$("file").click();
  if(T.id==="rd"){cfg={...DEF};saveCfg();applyCfg();render();sets();toast("Impostazioni ripristinate")}
});
$("file").onchange=async e=>{
  try{const f=e.target.files[0];if(!f)return;const o=JSON.parse(await f.text());
    if(!o||typeof o!=="object")throw 0;
    if(o.data){Object.assign(data,o.data);if(o.cfg)Object.assign(cfg,o.cfg)}else Object.assign(data,o);
    save();saveCfg();applyCfg();render();show();toast("Backup ripristinato")}
  catch(err){toast("File non valido")}
  e.target.value="";
};

async function saveFile(name,payload){
  try{
    const type=name.endsWith(".pdf")?"application/pdf":name.endsWith(".hly")?"text/plain":"application/json";
    const blob=new Blob([payload],{type});
    const file=new File([blob],name,{type});
    if(/Android|iPhone|iPad/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:name});return}catch(e){if(e&&e.name==="AbortError")return}
    }
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }catch(e){toast("Salvataggio non riuscito")}
}
const PDFNOTE="Documento generato con Hourly. Ha valore informativo e non sostituisce i registri previsti dalla legge.";
function loadJs(src){return new Promise((ok,ko)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
async function pdfLib(){
  if(window.jspdf&&window.jspdf.jsPDF&&window.jspdf.jsPDF.API.autoTable)return true;
  const L=[["lib/jspdf.umd.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"],["lib/jspdf.plugin.autotable.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"]];
  for(const l of L){try{await loadJs(l[0])}catch(e){await loadJs(l[1])}}
  return !!(window.jspdf&&window.jspdf.jsPDF.API.autoTable);
}
async function pdfMonth(o){
  try{
    if(!await pdfLib().catch(()=>false)){toast("Libreria PDF non disponibile: serve la connessione");return}
    const c={y:+o.k.slice(0,4),m:+o.k.slice(5)-1},rows=[];let t=0,g=0;
    for(let d=1;d<=dim(c);d++){
      const v=o.get(d),w=new Date(c.y,c.m,d).getDay(),s=totV(v);
      if(!o.all&&!v.some(x=>x))continue;
      t+=s;if(s)g++;rows.push([GGF[w]+" - "+d+"/"+(c.m+1),v[0],v[1],v[2],v[3],s?fmt(s):""]);
    }
    if(!rows.length){toast("Nessun giorno lavorato in questo mese");return}
    const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"}),hx=acc(),rgb=[1,3,5].map(i=>parseInt(hx.substr(i,2),16)),tint=f=>rgb.map(x=>Math.round(255-(255-x)*f));
    doc.setFontSize(16);doc.text((o.title||"Ore di lavoro")+" - "+MESI[c.m]+" "+c.y,14,16);
    if(o.sub){doc.setFontSize(10);doc.text(o.sub,14,22)}
    const foot=[["TOTALE MESE","","","","",fmt(t)]];
    if(o.avg)foot.push(["Giorni lavorati: "+g,"","","","","Media: "+fmt(g?Math.round(t/g):0)]);
    doc.autoTable({startY:o.sub?26:22,theme:"grid",
      head:[["Giorno",o.n1+" inizio",o.n1+" fine",o.n2+" inizio",o.n2+" fine","Totale giorno"]],
      body:rows,foot,showFoot:"lastPage",
      styles:{fontSize:10,cellPadding:2.2,halign:"center",valign:"middle",lineColor:[205,210,222],lineWidth:0.15,textColor:30,fillColor:[255,255,255]},
      alternateRowStyles:o.zebra?{fillColor:tint(0.13)}:{},
      columnStyles:{0:{halign:"left",cellWidth:42,fontStyle:"bold"},5:{fontStyle:"bold"}},
      headStyles:{fillColor:rgb,textColor:255,fontStyle:"bold"},
      footStyles:{fillColor:tint(0.3),textColor:20,fontStyle:"bold"}});
    doc.setFontSize(8);doc.setTextColor(120);doc.text(o.note||PDFNOTE,14,doc.internal.pageSize.getHeight()-8);
    await saveFile(o.file,doc.output("arraybuffer"));
  }catch(e){toast("Esportazione non riuscita")}
}
const exportPdf=k=>pdfMonth({k,get:d=>getK(k,d),title:cfg.title,sub:cfg.name,n1:sn(0),n2:sn(1),all:cfg.pdfAll,zebra:cfg.pdfZebra,avg:cfg.pdfAvg,file:"ore-lavoro-"+k+".pdf"});
$("pdf").onclick=()=>exportPdf(mk());

setInterval(()=>{now=new Date();if(MODE==="emp"&&tab==="m"&&isCur())hero()},30000);
if("serviceWorker" in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register("sw.js").catch(()=>{});
