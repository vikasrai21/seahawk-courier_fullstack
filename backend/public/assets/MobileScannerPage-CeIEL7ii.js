import{a0 as Ua,u as Ha,r,j as n,v as Kt,e as jn,bs as Hn,bc as Jt,aq as Kn,bd as Jn,Z as Qt,aL as Qn,as as Yt,bt as Ka,bu as Xt,bv as Zt,aj as ea,C as na,bj as Ja,P as In,b6 as ta,p as Qa,d as aa,G as Ya,X as Xa,w as Za}from"./vendor-react-DHsZcx6l.js";import{a as fe,l as er}from"./index-Dn5GV9Iz.js";import{c as nr,n as tr}from"./barcodeEngine-CB4IHiDa.js";function fa(c,l){var w,h;try{if(!c||!l)return null;const M=Number(c.videoWidth||0),F=Number(c.videoHeight||0);if(!M||!F)return null;const V=(w=c.getBoundingClientRect)==null?void 0:w.call(c),z=(h=l.getBoundingClientRect)==null?void 0:h.call(l);if(!V||!z)return null;const L=Number(V.width||0),N=Number(V.height||0);if(!L||!N)return null;const x=Math.max(L/M,N/F),ne=M*x,C=F*x,T=(L-ne)/2,te=(N-C)/2,m=z.left-V.left,j=z.top-V.top,Ge=z.right-V.left,D=z.bottom-V.top,ae=(m-T)/x,U=(j-te)/x,se=(Ge-T)/x,de=(D-te)/x,d=(Y,We,Re)=>Math.max(We,Math.min(Re,Y)),be=d(Math.min(ae,se),0,M),g=d(Math.min(U,de),0,F),O=d(Math.max(ae,se),0,M),S=d(Math.max(U,de),0,F),_=Math.max(0,O-be),we=Math.max(0,S-g);return!_||!we?null:{x:be,y:g,w:_,h:we}}catch{return null}}function ra(c=[]){if(!c.length)return"";const l=[];return c.includes("blur")&&l.push("hold steady"),c.includes("glare")&&l.push("reduce glare"),c.includes("angle")&&l.push("straighten angle"),c.includes("dark")&&l.push("add light"),c.includes("low_edge")&&l.push("fill frame"),l.length?`Improve capture: ${l.join(", ")}.`:""}function ar(c,l){if(!c||!l||!c.videoWidth||!c.videoHeight)return null;const w=fa(c,l);if(!w)return null;const h=Math.max(0,Math.floor(w.x)),M=Math.max(0,Math.floor(w.y)),F=Math.max(24,Math.floor(w.w)),V=Math.max(24,Math.floor(w.h)),z=128,L=96,N=document.createElement("canvas");N.width=z,N.height=L;const x=N.getContext("2d",{willReadFrequently:!0});if(!x)return null;x.drawImage(c,h,M,Math.min(F,c.videoWidth-h),Math.min(V,c.videoHeight-M),0,0,z,L);const ne=x.getImageData(0,0,z,L).data,C=z*L,T=new Float32Array(C);let te=0,m=0,j=0;for(let H=0,X=0;H<ne.length;H+=4,X+=1){const K=.2126*ne[H]+.7152*ne[H+1]+.0722*ne[H+2];T[X]=K,te+=K,K>=245&&(m+=1),K<=24&&(j+=1)}let Ge=0,D=0,ae=0,U=0,se=0,de=0;const d=Math.max(4,Math.floor(L*.15)),be=Math.max(4,Math.floor(z*.15)),g=z;for(let H=1;H<L-1;H+=1)for(let X=1;X<z-1;X+=1){const K=H*g+X,P=T[K],Ve=T[K-1],G=T[K+1],qe=T[K-g],Ue=T[K+g],Ce=Math.abs(G-Ve),Fn=Math.abs(Ue-qe),De=Ce+Fn,tt=Math.abs(4*P-Ve-G-qe-Ue);Ge+=tt,De>58&&(D+=1),H<=d&&(ae+=De),H>=L-d&&(U+=De),X<=be&&(se+=De),X>=z-be&&(de+=De)}const O=Math.max(1,(z-2)*(L-2)),S=te/C,_=Ge/O,we=D/O,Y=m/C,We=j/C,Re=Math.abs(ae-U)/Math.max(1,ae+U),B=Math.abs(se-de)/Math.max(1,se+de),nn=Math.max(Re,B),oe=[];return _<22&&oe.push("blur"),Y>.18&&oe.push("glare"),(We>.55||S<40)&&oe.push("dark"),we<.08&&oe.push("low_edge"),nn>.62&&oe.push("angle"),{ok:oe.length===0,issues:oe,metrics:{brightness:Number(S.toFixed(1)),blurScore:Number(_.toFixed(1)),glareRatio:Number((Y*100).toFixed(1)),edgeRatio:Number((we*100).toFixed(1)),perspectiveSkew:Number((nn*100).toFixed(1))}}}function Bn(c,l){const w=Number(c);return Number.isFinite(w)&&w>0?w:l}function rr({samples:c=[],awb:l,now:w=Date.now(),stabilityWindowMs:h=1100,requiredHits:M=3}){const F=Bn(h,1100),V=Math.max(1,Math.floor(Bn(M,3))),z=Bn(w,Date.now()),L=String(l||"").trim(),N=Array.isArray(c)?c.filter(C=>(C==null?void 0:C.awb)&&z-((C==null?void 0:C.at)||0)<=F):[];if(!L)return{samples:N,hits:0,isStable:!1};const x=[...N,{awb:L,at:z}],ne=x.reduce((C,T)=>T.awb===L?C+1:C,0);return{samples:x,hits:ne,isStable:ne>=V}}function ir({currentAttempts:c=0,maxReframeAttempts:l=2}){const w=Math.max(0,Math.floor(Bn(l,2))),h=Math.max(0,Math.floor(Number(c)||0))+1;return h<=w?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:w}}function sr(){return window.location.origin}const or=sr(),ia={w:"90vw",h:"18vw"},En={w:"92vw",h:"130vw"},sa=3500,oa=900,cr=1e4,lr=12e3,dr=15e3,ur="mobile_scanner_offline_queue",pr="mobile_scanner_session_state",hr="mobile_scanner_sticky_client",ca="mobile_scanner_workflow_mode",la="mobile_scanner_device_profile",gr=2e4,mr=500,fr=1,da=100,An=2,Yn=2,br=500,ua=960,$e=.68,xr=900,xe={phone:"phone-camera",rugged:"rugged-scanner"},Rn=["Trackon","DTDC","Delhivery","BlueDart"],_e=/^\d{4}-\d{2}-\d{2}$/,Oe=c=>{const l=String(c||"").trim();if(!l)return"";const w=l.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":l},Ae=c=>String(c||"").trim().toUpperCase(),pa=c=>{const l=String(c||"").trim();if(!_e.test(l))return l;try{return new Date(`${l}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return l}},Ze=(c,l="")=>{const w=String(c||"").trim();if(_e.test(w))return w;const h=String(l||"").trim();return _e.test(h)?h:new Date().toISOString().slice(0,10)},s={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"};function E(c,l){l instanceof Error?l.message:String(l||"unknown error")}const wr=c=>{var l;try{(l=navigator==null?void 0:navigator.vibrate)==null||l.call(navigator,c)}catch(w){E("vibrate",w)}},ha={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},v=(c="tap")=>{wr(ha[c]||ha.tap)},Mn=(c,l,w="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),M=h.createOscillator(),F=h.createGain();M.type=w,M.frequency.setValueAtTime(c,h.currentTime),F.gain.setValueAtTime(.12,h.currentTime),F.gain.exponentialRampToValueAtTime(.01,h.currentTime+l),M.connect(F),F.connect(h.destination),M.start(),M.stop(h.currentTime+l)}catch(h){E("playTone",h)}},en=()=>{Mn(880,.12),setTimeout(()=>Mn(1100,.1),130)},Dn=()=>{try{const c=new(window.AudioContext||window.webkitAudioContext),l=c.createOscillator(),w=c.createGain();l.type="square",l.frequency.setValueAtTime(3800,c.currentTime),l.frequency.setValueAtTime(3200,c.currentTime+.04),w.gain.setValueAtTime(0,c.currentTime),w.gain.linearRampToValueAtTime(.18,c.currentTime+.005),w.gain.setValueAtTime(.18,c.currentTime+.055),w.gain.exponentialRampToValueAtTime(.001,c.currentTime+.13),l.connect(w),w.connect(c.destination),l.start(c.currentTime),l.stop(c.currentTime+.14)}catch(c){E("playHardwareBeep",c)}},Cr=()=>Mn(600,.08),Q=()=>Mn(200,.25,"sawtooth"),Xn=c=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const l=new SpeechSynthesisUtterance(c);l.rate=1.2,l.pitch=1,l.lang="en-IN",window.speechSynthesis.speak(l)}catch(l){E("speak",l)}},ga=()=>{var c;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const l=((c=window.location)==null?void 0:c.hostname)||"";return l==="localhost"||l==="127.0.0.1"}catch{return!1}},i={bg:"#F8FAFF",surface:"#FFFFFF",border:"rgba(15,23,42,0.09)",text:"#0D1B2A",muted:"#5B6B7C",mutedLight:"#8FA0B0",primary:"#1D4ED8",primaryLight:"#EFF6FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FFF1F1"},yr={DTDC:{bg:"#C8102E",light:"#FFF0F1",text:"#fff",label:"DTDC"},Delhivery:{bg:"#00A0A0",light:"#E6FAFA",text:"#fff",label:"Delhivery"},Trackon:{bg:"#E65C00",light:"#FFF3EC",text:"#fff",label:"Trackon"},BlueDart:{bg:"#1A3A8C",light:"#EDF2FF",text:"#fff",label:"BlueDart"}},Zn=(c="")=>{const l=String(c||"").trim();return yr[l]||{bg:"#1D4ED8",light:"#EFF6FF",text:"#fff",label:l||"Unknown"}},Nr={110001:"New Delhi",110002:"New Delhi",110003:"New Delhi",110004:"New Delhi",110005:"New Delhi",110006:"New Delhi",110007:"New Delhi",110008:"New Delhi",110009:"New Delhi",110010:"New Delhi",110011:"New Delhi",110012:"New Delhi",110013:"New Delhi",110014:"New Delhi",110015:"New Delhi",110016:"New Delhi",110017:"New Delhi",110018:"New Delhi",110019:"New Delhi",110020:"New Delhi",110021:"New Delhi",110022:"New Delhi",110023:"New Delhi",110024:"New Delhi",110025:"New Delhi",110026:"New Delhi",110027:"New Delhi",110028:"New Delhi",110029:"New Delhi",110030:"New Delhi",110031:"New Delhi",110032:"New Delhi",110033:"New Delhi",110034:"New Delhi",110035:"New Delhi",110036:"New Delhi",110037:"New Delhi",110038:"New Delhi",110039:"New Delhi",110040:"New Delhi",110041:"New Delhi",110042:"New Delhi",110043:"New Delhi",110044:"New Delhi",110045:"New Delhi",110046:"New Delhi",110047:"New Delhi",110048:"New Delhi",110049:"New Delhi",110051:"New Delhi",110052:"New Delhi",110053:"New Delhi",110054:"New Delhi",110055:"New Delhi",110056:"New Delhi",110057:"New Delhi",110058:"New Delhi",110059:"New Delhi",110060:"New Delhi",110061:"New Delhi",110062:"New Delhi",110063:"New Delhi",110064:"New Delhi",110065:"New Delhi",110066:"New Delhi",110067:"New Delhi",110068:"New Delhi",110069:"New Delhi",110070:"New Delhi",110071:"New Delhi",110072:"New Delhi",110073:"New Delhi",110074:"New Delhi",110075:"New Delhi",110076:"New Delhi",110077:"New Delhi",110078:"New Delhi",110081:"New Delhi",110082:"New Delhi",110083:"New Delhi",110084:"New Delhi",110085:"New Delhi",110086:"New Delhi",110087:"New Delhi",110088:"New Delhi",110089:"New Delhi",110091:"New Delhi",110092:"New Delhi",110093:"New Delhi",110094:"New Delhi",110095:"New Delhi",110096:"New Delhi",121001:"Faridabad",121002:"Faridabad",121003:"Faridabad",121004:"Faridabad",122001:"Gurugram",122002:"Gurugram",122003:"Gurugram",122004:"Gurugram",122006:"Gurugram",122007:"Gurugram",122008:"Gurugram",122009:"Gurugram",122010:"Gurugram",122011:"Gurugram",122015:"Gurugram",122016:"Gurugram",122017:"Gurugram",122018:"Gurugram",122051:"Gurugram",201001:"Ghaziabad",201002:"Ghaziabad",201003:"Ghaziabad",201004:"Ghaziabad",201005:"Ghaziabad",201006:"Ghaziabad",201007:"Ghaziabad",201008:"Ghaziabad",201009:"Ghaziabad",201010:"Ghaziabad",201011:"Ghaziabad",201012:"Ghaziabad",201013:"Ghaziabad",201014:"Ghaziabad",201015:"Ghaziabad",201016:"Ghaziabad",201017:"Ghaziabad",201301:"Noida",201302:"Noida",201303:"Noida",201304:"Noida",201305:"Noida",201306:"Noida",201307:"Noida",201308:"Noida",400001:"Mumbai",400002:"Mumbai",400003:"Mumbai",400004:"Mumbai",400005:"Mumbai",400006:"Mumbai",400007:"Mumbai",400008:"Mumbai",400009:"Mumbai",400010:"Mumbai",400011:"Mumbai",400012:"Mumbai",400013:"Mumbai",400014:"Mumbai",400015:"Mumbai",400016:"Mumbai",400017:"Mumbai",400018:"Mumbai",400019:"Mumbai",400020:"Mumbai",400050:"Mumbai",400051:"Mumbai",400052:"Mumbai",400053:"Mumbai",400054:"Mumbai",400055:"Mumbai",400056:"Mumbai",400057:"Mumbai",400058:"Mumbai",400059:"Mumbai",400060:"Mumbai",400061:"Mumbai",400062:"Mumbai",400063:"Mumbai",400064:"Mumbai",400065:"Mumbai",400066:"Mumbai",400067:"Mumbai",400068:"Mumbai",400069:"Mumbai",400070:"Mumbai",400071:"Mumbai",400072:"Mumbai",400074:"Mumbai",400075:"Mumbai",400076:"Mumbai",400077:"Mumbai",400078:"Mumbai",400079:"Mumbai",400080:"Mumbai",400081:"Mumbai",400082:"Mumbai",400083:"Mumbai",400084:"Mumbai",400085:"Mumbai",400086:"Mumbai",400087:"Mumbai",400088:"Mumbai",400089:"Mumbai",400090:"Mumbai",400091:"Mumbai",400092:"Mumbai",400093:"Mumbai",400094:"Mumbai",400095:"Mumbai",400097:"Mumbai",400098:"Mumbai",400099:"Mumbai",400101:"Mumbai",400102:"Mumbai",400103:"Mumbai",400104:"Mumbai",560001:"Bangalore",560002:"Bangalore",560003:"Bangalore",560004:"Bangalore",560005:"Bangalore",560006:"Bangalore",560007:"Bangalore",560008:"Bangalore",560009:"Bangalore",560010:"Bangalore",560011:"Bangalore",560012:"Bangalore",560013:"Bangalore",560014:"Bangalore",560015:"Bangalore",560016:"Bangalore",560017:"Bangalore",560018:"Bangalore",560019:"Bangalore",560020:"Bangalore",560021:"Bangalore",560022:"Bangalore",560023:"Bangalore",560024:"Bangalore",560025:"Bangalore",560026:"Bangalore",560027:"Bangalore",560028:"Bangalore",560029:"Bangalore",560030:"Bangalore",560032:"Bangalore",560033:"Bangalore",560034:"Bangalore",560035:"Bangalore",560036:"Bangalore",560037:"Bangalore",560038:"Bangalore",560040:"Bangalore",560041:"Bangalore",560042:"Bangalore",560043:"Bangalore",560044:"Bangalore",560045:"Bangalore",560047:"Bangalore",560048:"Bangalore",560050:"Bangalore",560051:"Bangalore",560052:"Bangalore",560053:"Bangalore",560054:"Bangalore",560055:"Bangalore",560056:"Bangalore",560057:"Bangalore",560058:"Bangalore",560059:"Bangalore",560060:"Bangalore",560061:"Bangalore",560062:"Bangalore",560063:"Bangalore",560064:"Bangalore",560065:"Bangalore",560066:"Bangalore",560067:"Bangalore",560068:"Bangalore",560069:"Bangalore",560070:"Bangalore",560071:"Bangalore",560072:"Bangalore",560073:"Bangalore",560074:"Bangalore",560075:"Bangalore",560076:"Bangalore",560077:"Bangalore",560078:"Bangalore",560079:"Bangalore",560080:"Bangalore",560081:"Bangalore",560082:"Bangalore",560083:"Bangalore",560085:"Bangalore",560086:"Bangalore",560087:"Bangalore",560088:"Bangalore",560089:"Bangalore",560090:"Bangalore",560091:"Bangalore",560092:"Bangalore",560093:"Bangalore",560094:"Bangalore",560095:"Bangalore",560096:"Bangalore",560097:"Bangalore",560098:"Bangalore",560099:"Bangalore",560100:"Bangalore",560102:"Bangalore",560103:"Bangalore",560104:"Bangalore",560105:"Bangalore",600001:"Chennai",600002:"Chennai",600003:"Chennai",600004:"Chennai",600005:"Chennai",600006:"Chennai",600007:"Chennai",600008:"Chennai",600009:"Chennai",600010:"Chennai",600011:"Chennai",600012:"Chennai",600013:"Chennai",600014:"Chennai",600015:"Chennai",600016:"Chennai",600017:"Chennai",600018:"Chennai",600019:"Chennai",600020:"Chennai",600021:"Chennai",600022:"Chennai",600023:"Chennai",600024:"Chennai",600025:"Chennai",600026:"Chennai",600028:"Chennai",600029:"Chennai",600030:"Chennai",600031:"Chennai",600032:"Chennai",600033:"Chennai",600034:"Chennai",600035:"Chennai",600036:"Chennai",600037:"Chennai",600038:"Chennai",600039:"Chennai",600040:"Chennai",600041:"Chennai",600042:"Chennai",600043:"Chennai",600044:"Chennai",600045:"Chennai",600047:"Chennai",600048:"Chennai",600049:"Chennai",600050:"Chennai",600051:"Chennai",600052:"Chennai",600053:"Chennai",600054:"Chennai",600055:"Chennai",600056:"Chennai",600057:"Chennai",600058:"Chennai",600059:"Chennai",600060:"Chennai",600061:"Chennai",600062:"Chennai",600063:"Chennai",600064:"Chennai",600065:"Chennai",600066:"Chennai",600067:"Chennai",600068:"Chennai",600069:"Chennai",600070:"Chennai",600071:"Chennai",600072:"Chennai",600073:"Chennai",600074:"Chennai",600075:"Chennai",600076:"Chennai",600077:"Chennai",600078:"Chennai",600079:"Chennai",600080:"Chennai",600081:"Chennai",600082:"Chennai",600083:"Chennai",600084:"Chennai",600085:"Chennai",600086:"Chennai",600087:"Chennai",600088:"Chennai",600089:"Chennai",600090:"Chennai",600091:"Chennai",600092:"Chennai",600093:"Chennai",600094:"Chennai",600095:"Chennai",600096:"Chennai",600097:"Chennai",600099:"Chennai",600100:"Chennai",600101:"Chennai",600102:"Chennai",600103:"Chennai",600104:"Chennai",600105:"Chennai",600106:"Chennai",600107:"Chennai",600108:"Chennai",600109:"Chennai",600110:"Chennai",600111:"Chennai",600112:"Chennai",600113:"Chennai",600114:"Chennai",600115:"Chennai",600116:"Chennai",600117:"Chennai",600119:"Chennai",600120:"Chennai",600121:"Chennai",600122:"Chennai",600123:"Chennai",600125:"Chennai",600126:"Chennai",600127:"Chennai",600128:"Chennai",700001:"Kolkata",700002:"Kolkata",700003:"Kolkata",700004:"Kolkata",700005:"Kolkata",700006:"Kolkata",700007:"Kolkata",700008:"Kolkata",700009:"Kolkata",700010:"Kolkata",700011:"Kolkata",700012:"Kolkata",700013:"Kolkata",700014:"Kolkata",700015:"Kolkata",700016:"Kolkata",700017:"Kolkata",700018:"Kolkata",700019:"Kolkata",700020:"Kolkata",500001:"Hyderabad",500002:"Hyderabad",500003:"Hyderabad",500004:"Hyderabad",500005:"Hyderabad",500006:"Hyderabad",500007:"Hyderabad",500008:"Hyderabad",500009:"Hyderabad",500010:"Hyderabad",500011:"Hyderabad",500012:"Hyderabad",500013:"Hyderabad",500014:"Hyderabad",500015:"Hyderabad",500016:"Hyderabad",500017:"Hyderabad",500018:"Hyderabad",500019:"Hyderabad",500020:"Hyderabad",380001:"Ahmedabad",380002:"Ahmedabad",380003:"Ahmedabad",380004:"Ahmedabad",380005:"Ahmedabad",380006:"Ahmedabad",380007:"Ahmedabad",380008:"Ahmedabad",380009:"Ahmedabad",380010:"Ahmedabad",380013:"Ahmedabad",380014:"Ahmedabad",380015:"Ahmedabad",380016:"Ahmedabad",380017:"Ahmedabad",380018:"Ahmedabad",380019:"Ahmedabad",380021:"Ahmedabad",380022:"Ahmedabad",380023:"Ahmedabad",380024:"Ahmedabad",380025:"Ahmedabad",380026:"Ahmedabad",380027:"Ahmedabad",380028:"Ahmedabad",302001:"Jaipur",302002:"Jaipur",302003:"Jaipur",302004:"Jaipur",302005:"Jaipur",302006:"Jaipur",302007:"Jaipur",302008:"Jaipur",302009:"Jaipur",302010:"Jaipur",302011:"Jaipur",302012:"Jaipur",302013:"Jaipur",302015:"Jaipur",302016:"Jaipur",302017:"Jaipur",302018:"Jaipur",302019:"Jaipur",302020:"Jaipur",302021:"Jaipur",302022:"Jaipur",302023:"Jaipur",302026:"Jaipur",302027:"Jaipur",302028:"Jaipur",302029:"Jaipur",302030:"Jaipur",302031:"Jaipur",302033:"Jaipur",302034:"Jaipur",302036:"Jaipur",302037:"Jaipur",226001:"Lucknow",226002:"Lucknow",226003:"Lucknow",226004:"Lucknow",226005:"Lucknow",226006:"Lucknow",226007:"Lucknow",226008:"Lucknow",226009:"Lucknow",226010:"Lucknow",226011:"Lucknow",226012:"Lucknow",226013:"Lucknow",226014:"Lucknow",226015:"Lucknow",226016:"Lucknow",226017:"Lucknow",226018:"Lucknow",226019:"Lucknow",226020:"Lucknow",226021:"Lucknow",226022:"Lucknow",226023:"Lucknow",226024:"Lucknow",226025:"Lucknow",226026:"Lucknow",226028:"Lucknow",226029:"Lucknow",411001:"Pune",411002:"Pune",411003:"Pune",411004:"Pune",411005:"Pune",411006:"Pune",411007:"Pune",411008:"Pune",411009:"Pune",411010:"Pune",411011:"Pune",411012:"Pune",411013:"Pune",411014:"Pune",411015:"Pune",411016:"Pune",411017:"Pune",411018:"Pune",411019:"Pune",411020:"Pune",411021:"Pune",411022:"Pune",411023:"Pune",411024:"Pune",411025:"Pune",411026:"Pune",411027:"Pune",411028:"Pune",411029:"Pune",411030:"Pune",411031:"Pune",411032:"Pune",411033:"Pune",411034:"Pune",411035:"Pune",411036:"Pune",411037:"Pune",411038:"Pune",411039:"Pune",411040:"Pune",411041:"Pune",411042:"Pune",411043:"Pune",411044:"Pune",411045:"Pune",411046:"Pune",411047:"Pune",411048:"Pune",411049:"Pune",411051:"Pune",411052:"Pune",411053:"Pune",411057:"Pune",411058:"Pune",411060:"Pune",411061:"Pune",411062:"Pune",411067:"Pune",160001:"Chandigarh",160002:"Chandigarh",160003:"Chandigarh",160004:"Chandigarh",160005:"Chandigarh",160006:"Chandigarh",160007:"Chandigarh",160008:"Chandigarh",160009:"Chandigarh",160010:"Chandigarh",160011:"Chandigarh",160012:"Chandigarh",160014:"Chandigarh",160015:"Chandigarh",160016:"Chandigarh",160017:"Chandigarh",160018:"Chandigarh",160019:"Chandigarh",160020:"Chandigarh",160022:"Chandigarh",160023:"Chandigarh",160024:"Chandigarh",160025:"Chandigarh",160026:"Chandigarh",160028:"Chandigarh",160030:"Chandigarh",160031:"Chandigarh",160036:"Chandigarh",160047:"Chandigarh",160059:"Chandigarh",160061:"Chandigarh",160062:"Chandigarh",160071:"Chandigarh",440001:"Nagpur",440002:"Nagpur",440003:"Nagpur",440004:"Nagpur",440005:"Nagpur",440006:"Nagpur",440007:"Nagpur",440008:"Nagpur",440009:"Nagpur",440010:"Nagpur",440011:"Nagpur",440012:"Nagpur",440013:"Nagpur",440014:"Nagpur",440015:"Nagpur",440016:"Nagpur",440017:"Nagpur",440018:"Nagpur",440019:"Nagpur",440020:"Nagpur",440021:"Nagpur",440022:"Nagpur",440023:"Nagpur",440024:"Nagpur",440025:"Nagpur",440026:"Nagpur",440027:"Nagpur",440028:"Nagpur",440032:"Nagpur",440033:"Nagpur",440034:"Nagpur",440035:"Nagpur",440036:"Nagpur",440037:"Nagpur",530001:"Visakhapatnam",530002:"Visakhapatnam",530003:"Visakhapatnam",530004:"Visakhapatnam",530005:"Visakhapatnam",530006:"Visakhapatnam",530007:"Visakhapatnam",530008:"Visakhapatnam",530009:"Visakhapatnam",530010:"Visakhapatnam",530011:"Visakhapatnam",530012:"Visakhapatnam",530013:"Visakhapatnam",530014:"Visakhapatnam",530015:"Visakhapatnam",530016:"Visakhapatnam",530017:"Visakhapatnam",530018:"Visakhapatnam",530020:"Visakhapatnam",530022:"Visakhapatnam",530023:"Visakhapatnam",530024:"Visakhapatnam",530025:"Visakhapatnam",530026:"Visakhapatnam",530027:"Visakhapatnam",530028:"Visakhapatnam",530029:"Visakhapatnam",530031:"Visakhapatnam",530032:"Visakhapatnam",530040:"Visakhapatnam",530041:"Visakhapatnam",530043:"Visakhapatnam",530044:"Visakhapatnam",530045:"Visakhapatnam",530046:"Visakhapatnam",530047:"Visakhapatnam",530048:"Visakhapatnam",530049:"Visakhapatnam",530051:"Visakhapatnam"},ma=(c="")=>{const l=String(c||"").replace(/\D/g,"").trim();return l.length!==6?"":Nr[l]||""},kr=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.msp-root {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  background: ${i.bg};
  color: ${i.text};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ── Mono ── */
.mono { font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace; letter-spacing: -0.02em; }

/* ── Step wrapper ── */
.msp-step {
  position: absolute; inset: 0;
  display: none; flex-direction: column;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}
.msp-step.active {
  display: flex;
  opacity: 1;
  pointer-events: all; z-index: 2;
}
.msp-step.exiting { opacity: 0; pointer-events: none; }

/* ── Camera viewport ── */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  min-height: 100dvh;
  background: #000; overflow: hidden;
}
.cam-viewport video {
  width: 100%; height: 100%; object-fit: cover;
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 3;
}

/* ── Scan guide ── */
.scan-guide {
  border: 2.5px solid rgba(255,255,255,0.55);
  border-radius: 16px;
  position: relative;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.scan-guide.detected {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.28), inset 0 0 40px rgba(16,185,129,0.07);
}
.scan-guide-corner {
  position: absolute; width: 22px; height: 22px;
  border: 3px solid rgba(255,255,255,0.9);
  transition: border-color 0.25s;
}
.scan-guide.detected .scan-guide-corner { border-color: #10B981; }
.corner-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 7px 0 0 0; }
.corner-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 7px 0 0; }
.corner-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 7px; }
.corner-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 7px 0; }

/* ── Scan laser ── */
@keyframes laserHeadSweep { 0% { left: 2%; } 100% { left: 98%; } }
@keyframes laserLinePulse {
  0%,100% { opacity: 0.78; box-shadow: 0 0 7px rgba(255,28,32,0.8), 0 0 20px rgba(255,10,16,0.35); }
  50% { opacity: 1; box-shadow: 0 0 12px rgba(255,36,42,0.95), 0 0 34px rgba(255,12,20,0.55); }
}
@keyframes laserBandsDrift { 0% { background-position: 0 0, 0 0; } 100% { background-position: 160px 0, -120px 0; } }
@keyframes laserBandsPulse { 0%,100% { opacity: 0.35; transform: translateY(-50%) scaleY(0.82); } 50% { opacity: 0.85; transform: translateY(-50%) scaleY(1.08); } }
@keyframes laserParticlesDrift { 0% { background-position: 0 0, 10px 6px, 5px 2px; opacity: 0.28; } 50% { opacity: 0.6; } 100% { background-position: -42px 0, -24px 6px, -54px 2px; opacity: 0.32; } }
.scan-laser {
  position: absolute; left: 2%; right: 2%; height: 3px;
  top: 50%; transform: translateY(-50%);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,42,46,0.92), #ff111a 48%, rgba(255,42,46,0.92));
  animation: laserLinePulse 1.4s ease-in-out infinite;
  overflow: visible;
}
.scan-laser::before {
  content: ''; position: absolute;
  left: 0; right: 0; top: 50%; height: 34px; transform: translateY(-50%);
  background: linear-gradient(to bottom, transparent 0%, rgba(255,48,48,0.4) 36%, rgba(255,90,90,0.9) 50%, rgba(255,48,48,0.4) 64%, transparent 100%),
    repeating-linear-gradient(90deg, rgba(255,70,70,0) 0 7px, rgba(255,95,95,0.85) 7px 8px, rgba(255,70,70,0) 8px 13px);
  filter: blur(0.35px);
  transform-origin: center;
  animation: laserBandsDrift 2.2s linear infinite, laserBandsPulse 1.3s ease-in-out infinite;
  pointer-events: none; mix-blend-mode: screen;
}
.scan-laser::after {
  content: ''; position: absolute;
  left: 0; right: 0; top: 2px; height: 26px;
  background: radial-gradient(circle, rgba(255,95,95,0.72) 0 1px, transparent 1.8px) 0 0 / 22px 15px repeat,
    radial-gradient(circle, rgba(255,40,40,0.55) 0 1.1px, transparent 2px) 11px 6px / 29px 17px repeat,
    radial-gradient(circle, rgba(255,145,145,0.36) 0 0.8px, transparent 1.6px) 5px 2px / 18px 13px repeat;
  filter: blur(0.15px);
  animation: laserParticlesDrift 2.4s linear infinite;
  pointer-events: none;
}
.scan-laser-spark {
  position: absolute; top: 50%;
  width: 14px; height: 14px; border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 40% 40%, #fff 0 26%, #ffd9dd 34%, #ff3b44 70%, rgba(255,40,45,0.7) 100%);
  box-shadow: 0 0 14px 4px rgba(255,245,245,0.85), 0 0 28px 10px rgba(255,40,45,0.75), 0 0 58px 20px rgba(255,20,30,0.36);
  animation: laserHeadSweep 1.35s cubic-bezier(0.45,0,0.2,1) infinite alternate;
  z-index: 2;
}
.scan-laser-spark::before {
  content: ''; position: absolute; top: 50%; right: 100%;
  width: 30px; height: 3px; transform: translateY(-50%);
  background: linear-gradient(to left, rgba(255,220,220,0.82), rgba(255,55,60,0.4), rgba(255,55,60,0));
  filter: blur(0.6px);
}
.scan-laser-spark::after {
  content: ''; position: absolute; inset: -4px; border-radius: 50%;
  border: 1px solid rgba(255,220,220,0.5);
  animation: laserLinePulse 1.2s ease-in-out infinite;
}

/* ── Camera HUD ── */
.cam-hud {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 52px 18px 18px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 80%, transparent 100%);
  display: flex; justify-content: space-between; align-items: flex-start;
  z-index: 3;
}
.cam-hud-chip {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: white; font-size: 0.7rem; font-weight: 700;
  display: flex; align-items: center; gap: 5px;
  border: 1px solid rgba(255,255,255,0.15);
  letter-spacing: 0.02em;
}
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 24px 20px 40px;
  background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 70%, transparent 100%);
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  z-index: 3;
}

/* ── Cards ── */
.card {
  background: ${i.surface};
  border: 1px solid ${i.border};
  border-radius: 16px; padding: 16px;
  box-shadow: 0 2px 12px rgba(15,23,42,0.06);
}

/* ── Enterprise buttons ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 22px; border-radius: 14px; border: none;
  font-family: inherit; font-size: 0.88rem; font-weight: 700;
  cursor: pointer; transition: all 0.18s ease;
  letter-spacing: 0.01em; line-height: 1;
  -webkit-tap-highlight-color: transparent;
}
.btn:active { transform: scale(0.95); }
.btn-primary {
  background: linear-gradient(135deg, #1D4ED8, #2563EB);
  color: white;
  box-shadow: 0 4px 14px rgba(29,78,216,0.35);
}
.btn-primary:hover { box-shadow: 0 6px 22px rgba(29,78,216,0.45); }
.btn-success {
  background: linear-gradient(135deg, #059669, #10B981);
  color: white;
  box-shadow: 0 4px 16px rgba(5,150,105,0.32);
}
.btn-success:hover { box-shadow: 0 6px 22px rgba(5,150,105,0.45); }
.btn-outline {
  background: ${i.surface};
  border: 1.5px solid ${i.border};
  color: ${i.text};
  box-shadow: 0 1px 4px rgba(15,23,42,0.04);
}
.btn-outline:hover { border-color: rgba(29,78,216,0.3); background: #F8FAFF; }
.btn-danger { background: ${i.errorLight}; color: ${i.error}; border: 1.5px solid rgba(220,38,38,0.15); }
.btn-lg { padding: 16px 28px; font-size: 0.94rem; border-radius: 16px; }
.btn-full { width: 100%; }
.btn:disabled { opacity: 0.48; cursor: default; transform: none; }

/* ── Capture button ── */
.capture-btn {
  width: 76px; height: 76px; border-radius: 50%;
  background: white; border: 5px solid rgba(255,255,255,0.35);
  cursor: pointer; position: relative;
  transition: transform 0.15s;
  box-shadow: 0 6px 28px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.2);
}
.capture-btn:active { transform: scale(0.88); }
.capture-btn-inner {
  position: absolute; inset: 5px; border-radius: 50%;
  background: white; border: 2px solid #E5E7EB;
}

/* ── Preview ── */
.preview-img {
  width: 100%; border-radius: 14px;
  object-fit: contain; max-height: 52vh;
  background: #F1F5F9;
  box-shadow: 0 4px 20px rgba(15,23,42,0.1);
}

/* ── Field cards (review form) ── */
.field-card {
  background: ${i.surface};
  border: 1.5px solid ${i.border};
  border-left-width: 4px;
  border-left-style: solid;
  border-left-color: #CBD5E1;
  border-radius: 14px;
  padding: 13px 15px 11px;
  box-shadow: 0 1px 6px rgba(15,23,42,0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}
.field-card.conf-high { border-left-color: ${i.success}; }
.field-card.conf-med { border-left-color: ${i.warning}; }
.field-card.conf-low { border-left-color: ${i.error}; }
.field-card.warning { border-color: rgba(217,119,6,0.25); background: #FFFDF5; border-left-color: ${i.warning}; box-shadow: 0 2px 10px rgba(217,119,6,0.08); }
.field-card.error-field { border-color: rgba(220,38,38,0.2); background: #FFF8F8; border-left-color: ${i.error}; box-shadow: 0 2px 10px rgba(220,38,38,0.08); }
.field-card.required-empty { border-left-color: #E11D48; border-color: rgba(225,29,72,0.2); background: #FFF5F7; }
.field-label {
  font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: ${i.muted}; margin-bottom: 5px;
  display: flex; align-items: center; gap: 5px;
}
.field-required-star { color: #E11D48; font-size: 0.7rem; }
.field-value { font-size: 0.87rem; font-weight: 600; color: ${i.text}; }
.field-input {
  width: 100%; background: #F8FAFF;
  border: 1.5px solid rgba(15,23,42,0.08);
  border-radius: 9px; padding: 9px 11px;
  font-family: inherit; font-size: 0.84rem; font-weight: 600;
  color: ${i.text}; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}
.field-input:focus {
  border-color: ${i.primary};
  box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
  background: #fff;
}
.field-input::placeholder { color: #B0BCC8; font-weight: 500; }

/* ── Confidence dot ── */
.conf-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.conf-high { background: ${i.success}; box-shadow: 0 0 0 3px rgba(5,150,105,0.18); }
.conf-med { background: ${i.warning}; box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
.conf-low { background: ${i.error}; box-shadow: 0 0 0 3px rgba(220,38,38,0.15); }
.conf-none { background: #CBD5E1; }

/* ── Source badge ── */
.source-badge {
  font-size: 0.58rem; padding: 2px 7px; border-radius: 6px;
  font-weight: 700; display: inline-flex; align-items: center; gap: 3px;
  letter-spacing: 0.02em;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${i.primaryLight}; color: ${i.primary}; }
.source-history { background: ${i.warningLight}; color: ${i.warning}; }
.source-pincode { background: ${i.successLight}; color: ${i.success}; }

/* ── Review header ── */
.review-header {
  background: linear-gradient(135deg, #0D1B2A 0%, #1E2D3D 50%, #0D1B2A 100%);
  color: #F8FAFC;
  padding: 52px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: relative;
  overflow: hidden;
}
.review-header::before {
  content: '';
  position: absolute; top: -60px; right: -40px;
  width: 180px; height: 180px; border-radius: 50%;
  background: rgba(255,255,255,0.03);
  pointer-events: none;
}
.review-header.courier-dtdc { background: linear-gradient(135deg, #7A0019 0%, #C8102E 60%, #7A0019 100%); }
.review-header.courier-delhivery { background: linear-gradient(135deg, #005C5C 0%, #00A0A0 60%, #005C5C 100%); }
.review-header.courier-trackon { background: linear-gradient(135deg, #7A2E00 0%, #E65C00 60%, #7A2E00 100%); }
.review-header.courier-bluedart { background: linear-gradient(135deg, #0F2154 0%, #1A3A8C 60%, #0F2154 100%); }
.review-header-top {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.review-title { font-size: 0.6rem; color: rgba(255,255,255,0.5); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.review-awb { font-size: 1.05rem; font-weight: 800; color: #F8FAFC; margin-top: 3px; letter-spacing: 0.01em; }
.review-meta-row {
  margin-top: 12px;
  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
}
.review-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 999px;
  font-size: 0.67rem; font-weight: 700; border: 1px solid transparent;
  letter-spacing: 0.02em;
}
.review-chip-courier {
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.12);
  color: #fff; cursor: pointer;
  backdrop-filter: blur(8px);
}
.review-chip-date {
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(0,0,0,0.2);
  color: rgba(255,255,255,0.75);
}
.review-confidence {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 999px;
  font-size: 0.67rem; font-weight: 700; border: 1px solid transparent;
}
.review-confidence.high { background: rgba(16,185,129,0.22); color: #6EE7B7; border-color: rgba(16,185,129,0.4); }
.review-confidence.med { background: rgba(217,119,6,0.22); color: #FCD34D; border-color: rgba(217,119,6,0.4); }
.review-confidence.low { background: rgba(220,38,38,0.22); color: #FCA5A5; border-color: rgba(220,38,38,0.4); }

/* ── Form completion bar ── */
.form-progress-bar-wrap {
  margin: 0 20px 0; padding: 8px 0;
  display: flex; align-items: center; gap: 8px;
}
.form-progress-bar-track {
  flex: 1; height: 4px; border-radius: 999px;
  background: rgba(15,23,42,0.08); overflow: hidden;
}
.form-progress-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #1D4ED8, #10B981);
  transition: width 0.4s ease;
}
.form-progress-label {
  font-size: 0.62rem; font-weight: 700; color: ${i.muted};
  white-space: nowrap;
}

/* ── Suggest chip ── */
.suggest-chip {
  font-size: 0.74rem; padding: 7px 12px; min-height: 32px;
  border-radius: 10px;
  border: 1.5px solid ${i.border};
  background: ${i.surface}; color: ${i.text};
  cursor: pointer; font-family: inherit; font-weight: 600;
  touch-action: manipulation; transition: all 0.15s;
}
.suggest-chip:active { transform: scale(0.96); }
.suggest-chip.active {
  background: ${i.primaryLight}; color: ${i.primary};
  border-color: rgba(29,78,216,0.3);
}
.suggest-chip.pincode-suggest {
  background: ${i.successLight}; color: ${i.success};
  border-color: rgba(5,150,105,0.25); font-size: 0.7rem;
}

/* ── Shimmer skeleton ── */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E8EDF3 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Success ── */
@keyframes checkDraw { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
@keyframes circleDraw { 0% { stroke-dashoffset: 200; } 100% { stroke-dashoffset: 0; } }
.success-check-circle { stroke-dasharray: 200; stroke-dashoffset: 200; animation: circleDraw 0.6s ease-out 0.1s forwards; }
.success-check-mark { stroke-dasharray: 48; stroke-dashoffset: 48; animation: checkDraw 0.5s ease-out 0.5s forwards; }

/* ── Flash ── */
@keyframes flash { 0% { opacity: 0.85; } 100% { opacity: 0; } }
.flash-overlay { position: fixed; inset: 0; z-index: 50; pointer-events: none; animation: flash 0.32s ease-out forwards; }
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.22); }
.flash-error { background: rgba(220,38,38,0.22); }

/* ── Shake ── */
@keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-7px); } 40%,80% { transform: translateX(7px); } }
.shake { animation: shake 0.5s ease-in-out; }

/* ── Offline banner ── */
.offline-banner {
  background: ${i.warningLight}; color: ${i.warning};
  text-align: center; padding: 7px; font-size: 0.72rem; font-weight: 700;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
  border-top: 1px solid rgba(217,119,6,0.2);
}

/* ── Scroll panel ── */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 14px 16px;
}

/* ══ HOME SCREEN ══════════════════════════════════════════════════════════════ */
.home-root {
  display: flex; flex-direction: column;
  min-height: 100dvh; overflow-y: auto;
  background: ${i.bg};
}

/* Hero: full-bleed dark navy gradient */
.home-hero {
  background: linear-gradient(160deg, #0D1B2A 0%, #1E2D3D 55%, #0F2840 100%);
  padding: 52px 20px 28px;
  position: relative; overflow: hidden;
  flex-shrink: 0;
}
.home-hero::before {
  content: '';
  position: absolute; top: -80px; right: -60px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%);
  pointer-events: none;
}
.home-hero::after {
  content: '';
  position: absolute; bottom: -50px; left: -40px;
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,160,160,0.1) 0%, transparent 70%);
  pointer-events: none;
}
.home-hero-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 22px; position: relative; z-index: 1;
}
.home-brand {
  display: flex; align-items: center; gap: 10px;
}
.home-brand-logo {
  width: 34px; height: 34px; border-radius: 8px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.home-brand-name {
  font-size: 1rem; font-weight: 800; color: #fff;
  letter-spacing: -0.01em; line-height: 1.1;
}
.home-brand-tagline {
  font-size: 0.58rem; color: rgba(255,255,255,0.45);
  font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;
}
.home-conn-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7); font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.04em;
}
.home-conn-pill.connected { color: #34D399; border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.08); }

/* Stats band */
.home-stats-band {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 10px; position: relative; z-index: 1; margin-bottom: 20px;
}
.home-stat-tile {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 12px 10px;
  text-align: center; backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.home-stat-num { font-size: 1.4rem; font-weight: 900; color: #fff; line-height: 1; }
.home-stat-lbl { font-size: 0.56rem; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

/* Date chip inside hero */
.home-date-tile {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 12px 16px;
  position: relative; z-index: 1; cursor: pointer;
  transition: background 0.2s;
}
.home-date-tile:active { background: rgba(255,255,255,0.12); }
.home-date-lbl { font-size: 0.6rem; color: rgba(255,255,255,0.45); font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; }
.home-date-val { font-size: 0.94rem; font-weight: 700; color: #fff; line-height: 1.2; margin-top: 1px; }
.home-date-today-badge {
  font-size: 0.55rem; font-weight: 800; color: #34D399;
  background: rgba(52,211,153,0.12);
  border: 1px solid rgba(52,211,153,0.25);
  padding: 2px 7px; border-radius: 999px;
  letter-spacing: 0.06em;
  margin-left: 6px;
}
.home-date-tile input[type="date"] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer;
  width: 100%; height: 100%; -webkit-appearance: none;
}
.home-date-change { font-size: 0.63rem; color: #60A5FA; margin-left: auto; font-weight: 600; flex-shrink: 0; }

/* Centre scan zone */
.home-scan-zone {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 20px 20px; background: ${i.bg};
}
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.65); opacity: 0; } }
.home-scan-btn-wrap {
  position: relative; display: flex; align-items: center;
  justify-content: center; margin-bottom: 18px;
}
.home-scan-ring {
  position: absolute; width: 128px; height: 128px; border-radius: 50%;
  border: 2px solid #1D4ED8;
  animation: pulseRing 2.4s ease-out infinite;
}
.home-scan-ring2 { animation-delay: 0.9s; }
.home-scan-btn {
  width: 110px; height: 110px; border-radius: 50%;
  background: linear-gradient(145deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
  border: none; cursor: pointer; touch-action: manipulation;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
  box-shadow: 0 10px 40px rgba(29,78,216,0.4), 0 0 0 6px rgba(29,78,216,0.1), 0 0 0 12px rgba(29,78,216,0.05);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; z-index: 1;
}
.home-scan-btn:active { transform: scale(0.91); box-shadow: 0 4px 16px rgba(29,78,216,0.25); }
.home-scan-btn-lbl { font-size: 0.58rem; font-weight: 900; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.1em; }
.home-cta { font-size: 0.8rem; color: ${i.muted}; font-weight: 500; }

/* Mode toggle pills */
.mode-toggle-row {
  display: flex; gap: 8px; margin-top: 14px; width: 100%; max-width: 320px;
}
.mode-pill {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 8px; border-radius: 999px;
  border: 1.5px solid ${i.border};
  background: ${i.surface}; color: ${i.muted};
  font-size: 0.7rem; font-weight: 700; cursor: pointer;
  transition: all 0.18s; touch-action: manipulation;
  letter-spacing: 0.02em;
}
.mode-pill.active {
  background: #EFF6FF; color: #1D4ED8;
  border-color: rgba(29,78,216,0.3);
}

/* Manual AWB entry */
.manual-awb-row {
  display: flex; gap: 7px; width: 100%; max-width: 320px; margin-top: 14px;
}
.manual-awb-input {
  flex: 1; padding: 10px 14px;
  border: 1.5px solid ${i.border};
  border-radius: 12px;
  font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 600;
  background: ${i.surface}; color: ${i.text}; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}
.manual-awb-input:focus { border-color: ${i.primary}; box-shadow: 0 0 0 3px rgba(29,78,216,0.1); background: #fff; }

/* Action buttons */
.action-strip {
  display: flex; gap: 10px; margin-top: 14px; width: 100%; max-width: 320px;
}
.action-tile {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 8px; border-radius: 12px;
  border: 1.5px solid ${i.border};
  background: ${i.surface}; color: ${i.muted};
  font-size: 0.72rem; font-weight: 700; cursor: pointer;
  transition: all 0.18s; box-shadow: 0 1px 4px rgba(15,23,42,0.04);
  letter-spacing: 0.01em;
}
.action-tile:active { transform: scale(0.95); background: ${i.bg}; }
.action-tile.danger { color: ${i.error}; border-color: rgba(220,38,38,0.2); background: ${i.errorLight}; }
.action-tile.upload-active { color: ${i.primary}; border-color: rgba(29,78,216,0.25); background: ${i.primaryLight}; }

/* Queue / manifest */
.home-manifest {
  flex: 1;
  background: ${i.surface};
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  border-top: 1px solid ${i.border};
  box-shadow: 0 -6px 24px rgba(15,23,42,0.05);
  display: flex; flex-direction: column;
  min-height: 260px;
}
.manifest-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 10px;
  border-bottom: 1px solid ${i.border};
}
.manifest-title {
  font-size: 0.62rem; font-weight: 800; color: ${i.muted};
  text-transform: uppercase; letter-spacing: 0.09em;
  display: flex; align-items: center; gap: 6px;
}
.manifest-count {
  font-size: 0.65rem; font-weight: 800;
  background: ${i.primaryLight}; color: ${i.primary};
  padding: 2px 10px; border-radius: 999px;
  border: 1px solid rgba(29,78,216,0.15);
}
.manifest-courier-bar {
  display: flex; padding: 8px 18px 6px; gap: 6px; flex-wrap: wrap;
}
.courier-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 999px;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.04em;
}
.manifest-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.manifest-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 11px 18px; border-bottom: 1px solid ${i.bg};
  animation: slideIn 0.25s ease-out;
  transition: background 0.15s;
}
.manifest-item:active { background: ${i.bg}; }
.manifest-item-icon {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.55rem; font-weight: 900; letter-spacing: 0.05em;
}
.manifest-main { flex: 1; min-width: 0; }
.manifest-awb { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 700; color: ${i.text}; }
.manifest-meta { font-size: 0.63rem; color: ${i.muted}; margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.manifest-tag { padding: 1px 6px; border-radius: 5px; font-weight: 700; font-size: 0.57rem; }
.manifest-weight { font-size: 0.76rem; font-weight: 800; color: ${i.primary}; flex-shrink: 0; align-self: center; }
.manifest-actions { display: flex; gap: 5px; margin-top: 6px; flex-wrap: wrap; }
.manifest-action-btn {
  height: 26px; border-radius: 7px; border: 1px solid ${i.border};
  background: ${i.bg}; color: ${i.muted}; font-size: 0.64rem; font-weight: 700;
  padding: 0 9px; display: inline-flex; align-items: center; gap: 3px; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.manifest-action-btn:active { transform: scale(0.95); }
.manifest-action-btn.primary { border-color: rgba(29,78,216,0.25); background: ${i.primaryLight}; color: ${i.primary}; }
.manifest-action-btn.danger { border-color: rgba(220,38,38,0.2); background: ${i.errorLight}; color: ${i.error}; }
.manifest-action-btn:disabled { opacity: 0.48; cursor: default; }
.queue-date-input { height: 26px; border-radius: 7px; border: 1px solid ${i.border}; padding: 0 8px; font-size: 0.72rem; color: ${i.text}; background: ${i.surface}; font-family: inherit; }
.manifest-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 10px; }
.manifest-empty-icon { width: 56px; height: 56px; border-radius: 18px; background: ${i.bg}; display: flex; align-items: center; justify-content: center; }
.manifest-empty-text { font-size: 0.8rem; color: ${i.mutedLight}; font-weight: 500; text-align: center; line-height: 1.6; }
`,ba=c=>c>=.85?"high":c>=.55?"med":"low",et=c=>`conf-dot conf-${ba(c)}`,nt=c=>c==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:c==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:c==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:c==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:c==="fuzzy_history"||c==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:c==="delhivery_pincode"||c==="india_post"||c==="pincode_lookup"||c==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,vr=c=>{const l=Math.floor(c/6e4);return l<60?`${l}m`:`${Math.floor(l/60)}h ${l%60}m`};function Ar({standalone:c=!1}){var It,Et,Sn,At,Rt,Dt,Bt,Mt,Ft,Tt,Pt,zt,Lt,$t,Ot,_t,Gt,Wt,Vt,qt,Ut,Ht;const{pin:l}=Ua(),w=Ha(),h=!!c,M=`${ur}:${h?"direct":l||"unknown"}`,F=r.useMemo(()=>`${pr}:${h?"direct":l||"unknown"}`,[h,l]),V=r.useMemo(()=>`${hr}:${h?"direct":l||"unknown"}`,[h,l]),z=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),L=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),N=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[x,ne]=r.useState(null),[C,T]=r.useState("connecting"),[te,m]=r.useState(""),[j,Ge]=r.useState(s.IDLE),[D,ae]=r.useState(""),[U,se]=r.useState(null),[,de]=r.useState({}),[d,be]=r.useState(null),[g,O]=r.useState({}),[S,_]=r.useState(null),[we,Y]=r.useState(null),[We,Re]=r.useState(""),[B,nn]=r.useState([]),[oe,H]=r.useState(!1),[X,K]=r.useState(0),[P,Ve]=r.useState({ok:!1,issues:[],metrics:null}),[G,qe]=r.useState({kb:0,width:0,height:0,quality:$e}),[Ue,Ce]=r.useState(!1),[Fn,De]=r.useState("0m"),[tt,Tn]=r.useState("Connected"),[tn,at]=r.useState(""),[Pn,xa]=r.useState(!1),[rt,zn]=r.useState("idle"),[ue,wa]=r.useState(null),[Ca,ya]=r.useState(0),[Ln,Na]=r.useState(0),[it,$n]=r.useState(null),[Be,On]=r.useState("barcode"),[$,_n]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(ca);if(e==="fast"||e==="ocr")return e}catch(e){E("read workflow mode",e)}return N?"ocr":"fast"}),[pe,st]=r.useState(()=>{if(typeof window>"u")return xe.phone;try{const e=localStorage.getItem(la);if(e===xe.phone||e===xe.rugged)return e}catch(e){E("read device profile",e)}return xe.phone}),Gn=r.useRef(0),[k,He]=r.useState(()=>{const e={scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]};if(typeof window>"u")return e;try{const t=localStorage.getItem(F);if(!t)return e;const a=JSON.parse(t);if(!a||typeof a!="object")return e;const o=new Set(Array.isArray(a.scannedAwbs)?a.scannedAwbs.map(u=>Ae(u)).filter(Boolean):[]);return{...e,clientFreq:a.clientFreq&&typeof a.clientFreq=="object"?a.clientFreq:{},scanNumber:Number.isFinite(Number(a.scanNumber))?Number(a.scanNumber):0,dominantClient:Ae(a.dominantClient||"")||null,dominantClientCount:Number.isFinite(Number(a.dominantClientCount))?Number(a.dominantClientCount):0,startedAt:Number.isFinite(Number(a.startedAt))?Number(a.startedAt):e.startedAt,scannedItems:Array.isArray(a.scannedItems)?a.scannedItems:[],scannedAwbs:o}}catch(t){return E("hydrate session state",t),e}}),[he,dn]=r.useState(()=>{if(typeof window>"u")return"";try{return Ae(localStorage.getItem(V)||"")}catch(e){return E("read sticky client",e),""}}),[ye,ot]=r.useState(!1),[ka,un]=r.useState(""),[pn,hn]=r.useState(""),[Me,gn]=r.useState(""),[A,ct]=r.useState(()=>{const e=new Date().toISOString().slice(0,10);try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&_e.test(t)&&t===e)return t}catch(t){E("read session date",t)}return e}),Z=r.useRef(null),mn=r.useRef(null),Ne=r.useRef(null),ke=r.useRef(null),ve=r.useRef(!1),fn=r.useRef(null),va=r.useRef(!1),ce=r.useRef(s.IDLE),Wn=r.useRef(null),le=r.useRef(null),an=r.useRef(0),Fe=r.useRef(null),bn=r.useRef(new Set),rn=r.useRef([]),xn=r.useRef({awb:"",hits:0,lastSeenAt:0}),lt=r.useRef(0),sn=r.useRef(!1),dt=r.useRef(0),Te=r.useRef(null),Sa=r.useRef(null),Vn=r.useRef({message:"",at:0}),ge=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),Se=r.useRef(null),ut=r.useRef(null),pt=r.useRef({}),wn=r.useRef(null),Cn=r.useRef(null),yn=r.useRef(null),p=r.useCallback(e=>{Ge(e)},[]),J=r.useCallback(e=>{Gn.current=e,ya(e)},[]),re=r.useCallback(e=>{lt.current=e,Na(e)},[]),qn=r.useCallback((e,t="warning")=>{if(!e)return;const a=Date.now();Vn.current.message===e&&a-Vn.current.at<xr||(Vn.current={message:e,at:a},m(e),t&&v(t))},[]),ht=r.useCallback(e=>{J(0),re(0),On("document"),m(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),v("warning")},[J,re]),Nn=r.useCallback(()=>{const e=ir({currentAttempts:lt.current,maxReframeAttempts:An});if(e.action==="reframe"){re(e.attempts),J(0),m(`No lock yet. Reframe ${e.attempts}/${An}: move closer, reduce glare, keep barcode horizontal.`),v("retry");return}ht("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[ht,J,re]),ja=r.useCallback(()=>{ae(""),m(""),p(s.CAPTURING)},[p]),gt=r.useCallback(e=>{const t=Date.now(),a=rr({samples:rn.current,awb:e,now:t,stabilityWindowMs:mr,requiredHits:fr});return rn.current=a.samples,xn.current={awb:e,hits:a.hits,lastSeenAt:t},a.isStable},[]),Pe=r.useCallback(async()=>{var a;if(!ga())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!Z.current)throw new Error("Camera element not ready.");const e=Z.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(u=>u.readyState==="live")){await Z.current.play();return}let t=null;try{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}Z.current.srcObject=t,await Z.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>De(vr(Date.now()-k.startedAt)),3e4);return()=>clearInterval(e)},[k.startedAt]),r.useEffect(()=>{const e=()=>{const o=new Date,u=new Date(o);return u.setHours(24,0,0,0),u-o};let t;const a=()=>{t=setTimeout(()=>{const o=new Date().toISOString().slice(0,10);ct(o);try{localStorage.setItem("seahawk_scanner_session_date",o)}catch{}a()},e()+500)};return a(),()=>clearTimeout(t)},[]),r.useEffect(()=>{bn.current=k.scannedAwbs instanceof Set?k.scannedAwbs:new Set},[k.scannedAwbs]),r.useEffect(()=>{try{localStorage.setItem(F,JSON.stringify({scanNumber:Number(k.scanNumber||0),clientFreq:k.clientFreq||{},dominantClient:k.dominantClient||null,dominantClientCount:Number(k.dominantClientCount||0),startedAt:Number(k.startedAt||Date.now()),scannedItems:Array.isArray(k.scannedItems)?k.scannedItems:[],scannedAwbs:Array.from(k.scannedAwbs||[])}))}catch(e){E("persist session state",e)}},[k,F]),r.useEffect(()=>{try{he?localStorage.setItem(V,he):localStorage.removeItem(V)}catch(e){E("persist sticky client",e)}},[he,V]);const on=r.useCallback(e=>{nn(e);try{e.length?localStorage.setItem(M,JSON.stringify(e)):localStorage.removeItem(M)}catch(t){E("persist offline queue",t)}},[M]),Ke=r.useCallback(e=>{const t={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return on([...B,t]),t},[B,on]),mt=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await fe.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await fe.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),cn=r.useCallback(async()=>{var e;if(B.length){if(h){if(!navigator.onLine)return;const t=[];for(const a of B)if((e=a==null?void 0:a.payload)!=null&&e.awb)try{await mt(a.payload)}catch{t.push(a)}on(t),t.length?m(`Uploaded partially. ${t.length} scan(s) still queued.`):m("");return}!x||!x.connected||(B.forEach(t=>{var a;(a=t==null?void 0:t.payload)!=null&&a.awb&&x.emit("scanner:scan",t.payload)}),on([]))}},[h,x,B,on,mt]),q=r.useCallback(e=>{He(t=>{const a={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:Ze(e==null?void 0:e.date,A),time:(e==null?void 0:e.time)||Date.now()},o={...t,scannedItems:[a,...t.scannedItems]};try{localStorage.setItem(z,String(o.scanNumber))}catch(u){E("persist daily count",u)}return o})},[z,A]),ft=r.useCallback((e,t="")=>{e&&(He(a=>{const o=a.scannedItems.filter(y=>y.queueId!==e),u=new Set(a.scannedAwbs),f=String(t||"").trim().toUpperCase();return f&&u.delete(f),bn.current=u,{...a,scannedItems:o,scannedAwbs:u}}),un(a=>a===e?"":a))},[]),Ia=r.useCallback(e=>{e!=null&&e.queueId&&(un(e.queueId),hn(Ze(e.date,A)))},[A]),Ea=r.useCallback(()=>{un(""),hn("")},[]),Aa=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const t=String(pn||"").trim();if(!_e.test(t)){window.alert("Please select a valid date.");return}gn(e.queueId);try{e.shipmentId&&await fe.put(`/shipments/${e.shipmentId}`,{date:t}),He(a=>({...a,scannedItems:a.scannedItems.map(o=>o.queueId===e.queueId?{...o,date:t}:o)})),un(""),hn("")}catch(a){window.alert((a==null?void 0:a.message)||"Could not update consignment date.")}finally{gn("")}},[pn]),Ra=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const t=String(e.awb||"").trim()||"this consignment",a=e.shipmentId?`Delete ${t}? This will remove it from accepted consignments and from the server.`:`Remove ${t} from accepted consignments?`;if(window.confirm(a)){gn(e.queueId);try{e.shipmentId&&await fe.delete(`/shipments/${e.shipmentId}`),ft(e.queueId,e.awb)}catch(o){window.alert((o==null?void 0:o.message)||"Could not delete consignment.")}finally{gn("")}}},[ft]);r.useEffect(()=>{wn.current=q},[q]),r.useEffect(()=>{ut.current=d},[d]),r.useEffect(()=>{pt.current=g},[g]);const Da=r.useCallback(()=>{if(C!=="paired"){m(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(m(""),N){p(s.SCANNING);return}Pe().then(()=>p(s.SCANNING)).catch(e=>m((e==null?void 0:e.message)||"Camera access failed."))},[C,Pe,p,N,h]),Ba=r.useCallback(e=>{var a;e==null||e.preventDefault();const t=tn.trim().toUpperCase();if(!t||t.length<6){m("Enter a valid AWB number (min 6 chars)");return}if(C!=="paired"){m(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(m(""),at(""),ae(t),N){Ce(!0),p(s.CAPTURING);return}if($==="fast"){(a=Te.current)==null||a.call(Te,t);return}Ce(!0),p(s.CAPTURING)},[tn,C,p,N,h,$]),Ma=r.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){try{localStorage.removeItem(F)}catch(e){E("clear session state on terminate",e)}if(h){w("/app/scan");return}x!=null&&x.connected?x.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[x,w,h,F]),Fa=r.useCallback(()=>{if(B.length>0){cn();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[B.length,cn,h]);r.useEffect(()=>{ce.current=j},[j]);const je=r.useCallback((e=null)=>{e&&be(e),de({}),m(""),p(s.CAPTURING)},[p]),Je=r.useCallback(e=>{if(!e)return;const t=Ae(e.clientCode||""),a=Ae(he||t);be(e);const o=f=>{const y=String(f||"").trim().toUpperCase();return y==="UNKNOWN"||y==="N/A"||y==="NA"||y==="NONE"?"":String(f||"").trim()};if(O({clientCode:a,consignee:o(e.consignee),destination:o(e.destination),pincode:e.pincode||"",weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:Oe(e.courier||""),date:e.date||A||new Date().toISOString().slice(0,10)}),de({}),e.reviewRequired){v("review"),Dn(),p(s.REVIEWING);return}en(),v("success"),ye&&Xn(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const u={awb:e.awb,clientCode:a||e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:Ze(e.date,A)};_(u),q(u),p(s.SUCCESS)},[q,p,ye,A,he]);r.useEffect(()=>{Cn.current=je},[je]),r.useEffect(()=>{yn.current=Je},[Je]),r.useEffect(()=>{if(N){T("paired"),Tn("Mock Mode"),m(""),p(s.IDLE);return}if(h){ne(null),T("paired"),Tn("Direct Mode"),m(""),p(s.IDLE);return}if(!l){m("No PIN provided.");return}const e=er(or,{auth:{scannerPin:l},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>T("connecting")),e.on("scanner:paired",({userEmail:t})=>{T("paired"),Tn(t?t.split("@")[0]:"Connected"),m("");const a=ce.current;a===s.PROCESSING||a===s.REVIEWING||a===s.APPROVING||a===s.SUCCESS||p(s.IDLE)}),e.on("scanner:error",({message:t})=>{m(t),T("disconnected")}),e.on("scanner:session-ended",({reason:t})=>{T("disconnected"),m(t||"Session ended by desktop.");try{localStorage.removeItem(F)}catch(a){E("clear session state on end",a)}w("/")}),e.on("scanner:desktop-disconnected",({message:t})=>{T("paired"),m(t||"Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.")}),e.on("disconnect",()=>T("disconnected")),e.on("reconnect",()=>{const t=ce.current;if(t===s.PROCESSING||t===s.REVIEWING||t===s.APPROVING||t===s.SUCCESS){T("paired");return}T("paired"),p(s.SCANNING)}),e.on("scanner:scan-processed",t=>{var o,u;const a=ce.current;if(!(a!==s.PROCESSING&&a!==s.REVIEWING)){if(t.status==="error"){if(a!==s.PROCESSING)return;Y("error"),Q(),v("error"),p(s.ERROR),m(t.error||"Scan failed on desktop.");return}if(t.status==="photo_required"||t.requiresImageCapture){(o=Cn.current)==null||o.call(Cn,t);return}(u=yn.current)==null||u.call(yn,t)}}),e.on("scanner:approval-result",({success:t,message:a,awb:o,shipmentId:u})=>{var W;clearTimeout(le.current),le.current=null;const f=ut.current||{},y=pt.current||{};if(t){Dn(),v("success"),Y("success");const b=Ae(y.clientCode||"");b&&dn(b==="MISC"?"":b),b&&b!=="MISC"&&He(R=>{var Ee,Xe;const Ie={...R.clientFreq};Ie[b]=(Ie[b]||0)+1;const Le=Object.entries(Ie).sort((Va,qa)=>qa[1]-Va[1]);return{...R,clientFreq:Ie,dominantClient:((Ee=Le[0])==null?void 0:Ee[1])>=2?Le[0][0]:null,dominantClientCount:((Xe=Le[0])==null?void 0:Xe[1])||0}});const ee={awb:(f==null?void 0:f.awb)||o,clientCode:y.clientCode,clientName:(f==null?void 0:f.clientName)||y.clientCode,destination:y.destination||"",weight:parseFloat(y.weight)||0,shipmentId:u||(f==null?void 0:f.shipmentId)||null,date:Ze(y.date||(f==null?void 0:f.date),"")};_(ee),(W=wn.current)==null||W.call(wn,ee),p(s.SUCCESS);return}ce.current===s.APPROVING&&(Q(),v("error"),m(a||"Approval failed. Please review and try again."),p(s.REVIEWING))}),e.on("scanner:ready-for-next",()=>{}),ne(e),()=>{e.disconnect()}},[l,p,w,N,h,F]),r.useEffect(()=>{if(N||h||!x||C!=="paired"||!x.connected)return;const e=()=>{x.emit("scanner:heartbeat",{},()=>{})};e();const t=setInterval(e,gr);return()=>clearInterval(t)},[x,C,N,h]),r.useEffect(()=>{try{const e=localStorage.getItem(M);if(!e)return;const t=JSON.parse(e);Array.isArray(t)&&t.length&&nn(t)}catch(e){E("hydrate offline queue",e)}},[M]),r.useEffect(()=>{try{localStorage.setItem(ca,$)}catch(e){E("persist workflow mode",e)}},[$]),r.useEffect(()=>{try{localStorage.setItem(la,pe)}catch(e){E("persist device profile",e)}},[pe]),r.useEffect(()=>{if(B.length){if(h){C==="paired"&&navigator.onLine&&cn();return}C==="paired"&&(x!=null&&x.connected)&&cn()}},[C,x,B.length,cn,h]);const Qe=r.useCallback(async()=>{var e;try{if(Ce(!1),Se.current&&Se.current.stop(),ke.current){try{const t=ke.current;t!=null&&t.barcodeScanner&&await t.barcodeScanner.dispose()}catch(t){E("dispose scanbot camera scanner",t)}ke.current=null}if(Ne.current){try{await Ne.current.reset()}catch(t){E("reset camera scanner",t)}Ne.current=null}(e=Z.current)!=null&&e.srcObject&&(Z.current.srcObject.getTracks().forEach(t=>t.stop()),Z.current.srcObject=null)}catch(t){E("stopCamera",t)}},[]),Ye=r.useCallback(async()=>{try{if(zn("idle"),Se.current&&Se.current.stop(),ke.current){try{await ke.current.barcodeScanner.dispose()}catch(e){E("dispose barcode scanner",e)}ke.current=null}if(Ne.current){try{Ne.current._type==="native"?Ne.current.reset():await Ne.current.reset()}catch(e){E("reset barcode scanner",e)}Ne.current=null}}catch(e){E("stopBarcodeScanner",e)}},[]),bt=r.useCallback(async()=>{if(Z.current){await Ye();try{an.current=Date.now(),await Pe(),Se.current||(Se.current=nr()),await Se.current.start(Z.current,mn.current,{onDetected:(e,t)=>{var u;if(ve.current)return;J(0);const a=(t==null?void 0:t.format)||"unknown",o=(t==null?void 0:t.engine)||"unknown";wa({value:e,format:a,engine:o,at:Date.now(),sinceStartMs:an.current?Date.now()-an.current:null,candidateCount:(t==null?void 0:t.candidateCount)||1,ambiguous:!1,alternatives:(t==null?void 0:t.alternatives)||[]}),zn(o),(u=Fe.current)==null||u.call(Fe,e,{candidateCount:(t==null?void 0:t.candidateCount)||1,ambiguous:!1,alternatives:(t==null?void 0:t.alternatives)||[],format:a,engine:o})},onFail:()=>{const e=Gn.current+1;J(e),e>=da&&Nn()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),zn(e)}})}catch(e){m("Camera access failed: "+e.message)}}},[Pe,Ye,Nn,J]),xt=r.useCallback((e,t={})=>{var f;const a=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),o=tr(e)||a;if(ve.current||ce.current!==s.SCANNING)return;if(!o||o.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&qn("Partial barcode detected. Move closer so full AWB is visible.");return}if(t!=null&&t.ambiguous){const y=Gn.current+1;J(y),qn("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),y>=da&&Nn();return}if(!N&&!gt(o))return;if(ve.current=!0,bn.current.has(o)){v("duplicate"),Q(),Re(o),setTimeout(()=>{Re(""),ve.current=!1,xn.current={awb:"",hits:0,lastSeenAt:0},rn.current=[]},2500);return}clearTimeout(Wn.current),v("lock"),Dn(),ae(o);const u=an.current?Date.now()-an.current:null;if($n(u),ge.current={lockTimeMs:u,candidateCount:Number((t==null?void 0:t.candidateCount)||1),ambiguous:!!(t!=null&&t.ambiguous),alternatives:Array.isArray(t==null?void 0:t.alternatives)?t.alternatives.slice(0,3):[]},re(0),J(0),m(""),He(y=>{const W={...y,scanNumber:y.scanNumber+1};return W.scannedAwbs=new Set(y.scannedAwbs),W.scannedAwbs.add(o),bn.current=W.scannedAwbs,W}),$==="fast"){(f=Te.current)==null||f.call(Te,o);return}Ce(!0),p(s.CAPTURING)},[p,gt,$,N,J,re,qn,Nn]);r.useEffect(()=>{Fe.current=xt},[xt]),r.useEffect(()=>{if(j===s.SCANNING&&(ve.current=!1,xn.current={awb:"",hits:0,lastSeenAt:0},rn.current=[],ge.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},$n(null),re(0),J(0),On("barcode"),bt(),N&&L)){const e=setTimeout(()=>{var t;ce.current===s.SCANNING&&((t=Fe.current)==null||t.call(Fe,L))},50);return()=>clearTimeout(e)}return()=>{j===s.SCANNING&&Ye()}},[j,bt,Ye,J,re,N,L]);const wt=r.useCallback(async()=>{if(N){Ce(!0);return}await Ye();try{await Pe(),Ce(!0)}catch(e){m("Camera access failed: "+e.message)}},[Pe,Ye,N]);r.useEffect(()=>{j===s.CAPTURING&&wt()},[j,wt]);const kn=r.useCallback(()=>{const e=Z.current,t=mn.current;return ar(e,t)},[]);r.useEffect(()=>{if(j!==s.CAPTURING){H(!1),K(0),Ve({ok:!1,issues:[],metrics:null}),va.current=!1,sn.current=!1;return}const e=setInterval(()=>{const t=kn();t&&(Ve(t),H(t.ok),K(a=>{const o=t.ok?Math.min(a+1,8):0;return o>=Yn&&!sn.current&&(v("tap"),sn.current=!0),t.ok||(sn.current=!1),o}))},280);return()=>clearInterval(e)},[j,kn]);const Ct=r.useCallback((e={})=>{const t=Z.current,a=mn.current;if(!t||!a||!t.videoWidth)return null;const o=fa(t,a);if(!o)return null;const u=o.x,f=o.y,y=o.w,W=o.h;if(!y||!W)return null;const b=Math.max(640,Number(e.maxWidth||ua)),ee=Math.min(.85,Math.max(.55,Number(e.quality||$e))),R=document.createElement("canvas");R.width=Math.min(b,Math.round(y)),R.height=Math.round(R.width/y*W),R.getContext("2d").drawImage(t,u,f,y,W,0,0,R.width,R.height);const Ee=R.toDataURL("image/jpeg",ee).split(",")[1]||"";if(!Ee)return null;const Xe=Math.floor(Ee.length*3/4);return{base64:Ee,width:R.width,height:R.height,approxBytes:Xe,quality:ee}},[]),Ta=r.useCallback(()=>{const e=Date.now();if(e-dt.current<br)return;dt.current=e;const t=kn()||P;if(!(t!=null&&t.ok)||X<Yn){m(ra(t==null?void 0:t.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),v("warning"),Q();return}Y("white"),Cr(),v("tap");const a=Ct({maxWidth:ua,quality:$e});if(!(a!=null&&a.base64)){m("Could not capture image. Try again."),ve.current=!1;return}qe({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||$e}),se(`data:image/jpeg;base64,${a.base64}`),Qe(),p(s.PREVIEW)},[Ct,Qe,p,kn,P,X]),Pa=r.useCallback(()=>{if(!N)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";qe({kb:0,width:0,height:0,quality:$e}),se(e),Qe(),p(s.PREVIEW)},[p,N,Qe]),ze=r.useCallback(()=>{var e,t,a;return{scanNumber:k.scanNumber,recentClient:k.dominantClient,dominantClient:k.dominantClient,dominantClientCount:k.dominantClientCount,stickyClientCode:he||void 0,sessionDurationMin:Math.round((Date.now()-k.startedAt)/6e4),sessionDate:A,scanWorkflowMode:$,scanMode:Be,deviceProfile:pe,hardwareClass:pe===xe.rugged?"rugged":"phone",captureQuality:{ok:!!P.ok,issues:Array.isArray(P.issues)?P.issues.slice(0,8):[],metrics:P.metrics||null},captureMeta:{kb:G.kb||0,width:G.width||0,height:G.height||0,quality:G.quality||$e},lockTimeMs:Number.isFinite(Number((e=ge.current)==null?void 0:e.lockTimeMs))?Number(ge.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((t=ge.current)==null?void 0:t.candidateCount))?Number(ge.current.candidateCount):1,lockAlternatives:Array.isArray((a=ge.current)==null?void 0:a.alternatives)?ge.current.alternatives.slice(0,3):[]}},[k,A,$,Be,pe,P,G,he]),yt=r.useCallback(async e=>{var o,u;const t=String(e||"").trim().toUpperCase();if(!t)return;if(p(s.PROCESSING),N){setTimeout(()=>{const f={awb:t,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:A};_(f),q(f),p(s.SUCCESS)},120);return}const a={awb:t,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:ze()};if(h){if(!navigator.onLine){Ke(a),en(),v("success");const f={awb:t,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:A};_({...f,offlineQueued:!0}),q(f),p(s.SUCCESS);return}try{const f=await fe.post("/shipments/scan",{awb:t,courier:"AUTO",captureOnly:!0,sessionContext:ze()}),y=((o=f==null?void 0:f.data)==null?void 0:o.shipment)||{},W={awb:y.awb||t,clientCode:y.clientCode||"MISC",clientName:((u=y.client)==null?void 0:u.company)||y.clientCode||"Scanned",destination:y.destination||"",weight:y.weight||0,shipmentId:y.id||null,date:Ze(y.date,A)};_(W),q(W),en(),v("success"),p(s.SUCCESS)}catch(f){m((f==null?void 0:f.message)||"Barcode processing failed. Please try again."),Q(),v("error"),p(s.ERROR)}return}if(!x||!x.connected||C!=="paired"){Ke(a),en(),v("success");const f={awb:t,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:A};_({...f,offlineQueued:!0}),q(f),p(s.SUCCESS);return}x.emit("scanner:scan",a),setTimeout(()=>{ce.current===s.PROCESSING&&(m("Barcode processing timed out. Please try scanning again."),Q(),v("error"),p(s.ERROR))},cr)},[x,C,p,N,Ke,q,ze,h,A]);r.useEffect(()=>{Te.current=yt},[yt]);const Nt=r.useCallback(async e=>{const t=String(e||"").trim().toUpperCase();if(!t)return;if(p(s.PROCESSING),N){p(s.CAPTURING);return}const a={awb:t,scanMode:"lookup_first",sessionContext:ze()};if(h){if(!navigator.onLine){je({awb:t,status:"photo_required",requiresImageCapture:!0});return}try{const o=await fe.post("/shipments/scan-mobile",a),u=(o==null?void 0:o.data)||o;if(u.status==="error"||!u.success){Y("error"),Q(),v("error"),p(s.ERROR),m(u.error||u.message||"Lookup failed.");return}if(u.status==="photo_required"||u.requiresImageCapture){je(u);return}Je(u)}catch(o){m((o==null?void 0:o.message)||"Lookup failed. Please try again."),Q(),v("error"),p(s.ERROR)}return}if(!x||!x.connected||C!=="paired"){je({awb:t,status:"photo_required",requiresImageCapture:!0});return}x.emit("scanner:scan",a),setTimeout(()=>{ce.current===s.PROCESSING&&(m("Lookup timed out. Capture the label photo and continue."),p(s.CAPTURING))},lr)},[x,C,p,N,ze,h,je,Je]);r.useEffect(()=>{Sa.current=Nt},[Nt]);const za=r.useCallback(async()=>{if(!U)return;if(p(s.PROCESSING),N){setTimeout(()=>{const a={awb:D||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:A};_(a),q(a),p(s.SUCCESS)},250);return}const e=U.split(",")[1]||U,t={awb:D||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:ze()};if(h){if(!navigator.onLine){Ke(t),en(),v("success");const a={awb:D||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:A};_({...a,offlineQueued:!0}),q(a),p(s.SUCCESS);return}try{const a=await fe.post("/shipments/scan-mobile",t),o=(a==null?void 0:a.data)||a;if(o.status==="error"||!o.success){Y("error"),Q(),v("error"),p(s.ERROR),m(o.error||o.message||"Scan failed.");return}if(o.status==="photo_required"||o.requiresImageCapture){je(o);return}Je(o)}catch(a){m((a==null?void 0:a.message)||"Server error. Please try again."),Q(),v("error"),p(s.ERROR)}return}if(!x||!x.connected||C!=="paired"){Ke(t),en(),v("success");const a={awb:D||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:A};_({...a,offlineQueued:!0}),q(a),p(s.SUCCESS);return}x.emit("scanner:scan",t),setTimeout(()=>{ce.current===s.PROCESSING&&(m("OCR timed out after 40 seconds. Retake the label photo and try again."),Q(),v("error"),p(s.ERROR))},4e4)},[x,D,U,p,C,Ke,q,N,ze,h,Je,je,A]),La=r.useCallback(async()=>{var y,W;if(!d)return;p(s.APPROVING);let e=!1;const t=g.date||A||new Date().toISOString().slice(0,10);if(N){setTimeout(()=>{const b={awb:d.awb||D,clientCode:g.clientCode||"MOCKCL",clientName:d.clientName||g.clientCode||"Mock Client",destination:g.destination||"",weight:parseFloat(g.weight)||0,shipmentId:d.shipmentId||null,date:t};_(b),q(b),Y("success"),e=!0,p(s.SUCCESS)},200);return}const a={clientCode:d.clientCode||"",clientName:d.clientName||"",consignee:d.consignee||"",destination:d.destination||""},o={clientCode:g.clientCode||"",clientName:g.clientCode||"",consignee:g.consignee||"",destination:g.destination||""},u={clientCode:g.clientCode,consignee:g.consignee,destination:g.destination,pincode:g.pincode,weight:parseFloat(g.weight)||0,amount:parseFloat(g.amount)||0,orderNo:g.orderNo||"",courier:g.courier||"",date:t};if(h)try{(d.ocrExtracted||d)&&await fe.post("/shipments/learn-corrections",{ocrFields:a,approvedFields:o});let b=null;if(d.shipmentId){const R=await fe.put(`/shipments/${d.shipmentId}`,u);b=(R==null?void 0:R.data)||null}else{const R=await fe.post("/shipments",{awb:d.awb||D,...u});b=(R==null?void 0:R.data)||null}Dn(),v("success"),Y("success");const ee={awb:(b==null?void 0:b.awb)||(d==null?void 0:d.awb)||D,clientCode:(b==null?void 0:b.clientCode)||g.clientCode,clientName:(d==null?void 0:d.clientName)||((y=b==null?void 0:b.client)==null?void 0:y.company)||g.clientCode,destination:(b==null?void 0:b.destination)||g.destination||"",weight:parseFloat((b==null?void 0:b.weight)??g.weight)||0,shipmentId:(b==null?void 0:b.id)||(d==null?void 0:d.shipmentId)||null,date:Ze(b==null?void 0:b.date,t)};_(ee),q(ee),e=!0,p(s.SUCCESS)}catch(b){p(s.REVIEWING),Q(),v("error"),m((b==null?void 0:b.message)||"Approval failed.")}else{if(!x){p(s.REVIEWING),m("Not connected to desktop session.");return}(d.ocrExtracted||d)&&x.emit("scanner:learn-corrections",{pin:l,ocrFields:a,approvedFields:o,courier:(d==null?void 0:d.courier)||((W=d==null?void 0:d.ocrExtracted)==null?void 0:W.courier)||"",deviceProfile:pe}),x.emit("scanner:approval-submit",{shipmentId:d.shipmentId,awb:d.awb||D,fields:u},b=>{b!=null&&b.success||(clearTimeout(le.current),le.current=null,p(s.REVIEWING),Q(),v("error"),m((b==null?void 0:b.message)||"Approval failed."))}),clearTimeout(le.current),le.current=setTimeout(()=>{ce.current===s.APPROVING&&(Q(),v("error"),m("Save confirmation timed out. Please tap Approve & Save again."),p(s.REVIEWING))},dr)}const f=Ae(g.clientCode||"");e&&f&&dn(f==="MISC"?"":f),e&&f&&f!=="MISC"&&He(b=>{var Ie,Le;const ee={...b.clientFreq};ee[f]=(ee[f]||0)+1;const R=Object.entries(ee).sort((Ee,Xe)=>Xe[1]-Ee[1]);return{...b,clientFreq:ee,dominantClient:((Ie=R[0])==null?void 0:Ie[1])>=2?R[0][0]:null,dominantClientCount:((Le=R[0])==null?void 0:Le[1])||0}})},[x,d,g,D,l,p,q,N,pe,h,A]),ln=r.useCallback((e=s.IDLE)=>{clearTimeout(fn.current),clearTimeout(Wn.current),clearTimeout(le.current),le.current=null,ae(""),se(null),qe({kb:0,width:0,height:0,quality:$e}),be(null),O({}),de({}),_(null),$n(null),m(""),Re(""),H(!1),K(0),Ve({ok:!1,issues:[],metrics:null}),ve.current=!1,xn.current={awb:"",hits:0,lastSeenAt:0},rn.current=[],ge.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},sn.current=!1,re(0),p(e)},[p,re]);r.useEffect(()=>{if(j===s.SUCCESS){const e=$==="fast"?s.SCANNING:s.IDLE,t=$==="fast"?oa:sa;return fn.current=setTimeout(()=>ln(e),t),()=>clearTimeout(fn.current)}},[j,ln,$]),r.useEffect(()=>{if(ye)if(j===s.REVIEWING&&d){const e=[d.clientName||d.clientCode,d.destination,d.weight?`${d.weight} kilograms`:""].filter(Boolean);e.length&&Xn(e.join(". "))}else j===s.SUCCESS&&S&&Xn(`${S.clientName||S.clientCode||"Shipment"} Verified.`)},[ye,j,d,S]),r.useEffect(()=>()=>{Qe(),clearTimeout(fn.current),clearTimeout(Wn.current),clearTimeout(le.current)},[Qe]);const me=e=>`msp-step ${j===e?"active":""}`,$a=Math.max(1,Math.round(($==="fast"?oa:sa)/1e3)),Oa=P.ok?"AWB quality looks good - press shutter":ra(P.issues)||"Fit AWB slip fully in frame and hold steady",kt=Ue&&P.ok&&X>=Yn,ie=r.useMemo(()=>{if(!d)return{};const e=d.ocrExtracted||d;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[d]),_a=r.useCallback(()=>{O(e=>{const t=Oe(e.courier||(d==null?void 0:d.courier)||""),a=Rn.findIndex(u=>u.toUpperCase()===t.toUpperCase()),o=Rn[(a+1+Rn.length)%Rn.length];return{...e,courier:o}})},[d]),vn=r.useMemo(()=>{const e=Object.values(ie).map(u=>Number((u==null?void 0:u.confidence)||0)).filter(u=>u>0),t=e.length?e.reduce((u,f)=>u+f,0)/e.length:0,a=ba(t);return{score:t,level:a,label:a==="high"?"High Confidence":a==="med"?"Medium Confidence":"Low Confidence"}},[ie]),Un=Oe(g.courier||(d==null?void 0:d.courier)||((It=d==null?void 0:d.ocrExtracted)==null?void 0:It.courier)||""),vt=g.date||(d==null?void 0:d.date)||A||"",Ga=r.useMemo(()=>pa(vt),[vt]),St=k.scannedItems.reduce((e,t)=>e+(t.weight||0),0),I=((Et=d==null?void 0:d.ocrExtracted)==null?void 0:Et.intelligence)||(d==null?void 0:d.intelligence)||null,jt=(Rt=(At=(Sn=Se.current)==null?void 0:Sn.getDiagnostics)==null?void 0:At.call(Sn))==null?void 0:Rt.wasmFailReason,Wa=[["Step",j],["Connection",C],["Engine",rt],...jt?[["WASM Error",jt]]:[],["Workflow",$],["Device",pe],["Scan mode",Be],["Fail count",String(Ca)],["Reframe retries",`${Ln}/${An}`],["Camera",Ue?"ready":"waiting"],["Doc detect",oe?`yes (${X})`:"no"],["Capture quality",P.ok?"good":P.issues.join(", ")||"pending"],["Capture metrics",P.metrics?`blur ${P.metrics.blurScore} | glare ${P.metrics.glareRatio}% | skew ${P.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",G.kb?`${G.kb}KB ${G.width}x${G.height} q=${G.quality}`:"-"],["Secure ctx",ga()?"yes":"no"],["AWB lock",D||"-"],["Lock ms",it!=null?String(it):"-"],["Lock candidates",String(((Dt=ge.current)==null?void 0:Dt.candidateCount)||1)],["Queued",String(B.length)],["Scans",String(k.scanNumber)],["Last format",(ue==null?void 0:ue.format)||"-"],["Last code",(ue==null?void 0:ue.value)||"-"],["Decode ms",(ue==null?void 0:ue.sinceStartMs)!=null?String(ue.sinceStartMs):"-"],["False-lock",(Bt=d==null?void 0:d.scanTelemetry)!=null&&Bt.falseLock?"yes":"no"]];return n.jsxs(n.Fragment,{children:[n.jsx("style",{children:kr}),n.jsxs("div",{className:"msp-root",children:[we&&n.jsx("div",{className:`flash-overlay flash-${we}`,onAnimationEnd:()=>Y(null)}),We&&n.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[n.jsx(Kt,{size:48,color:"white"}),n.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),n.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:We}),n.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),n.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>xa(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:Pn?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:Pn?"Hide Diag":"Show Diag"}),Pn&&n.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[n.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),n.jsx("div",{style:{display:"grid",gap:6},children:Wa.map(([e,t])=>n.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[n.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),n.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:t})]},e))}),n.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),C!=="paired"&&n.jsx("div",{className:me(s.IDLE),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[n.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:C==="connecting"?n.jsx(jn,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):n.jsx(Hn,{size:28,color:i.error})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:C==="connecting"?"Connecting...":"Disconnected"}),n.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:te||(h?"Preparing direct scanner session":`Connecting to session ${l}`)})]}),C==="disconnected"&&n.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[n.jsx(jn,{size:16})," Reconnect"]})]})}),n.jsx("video",{ref:Z,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{Pe().catch(e=>{m((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(j===s.SCANNING||j===s.CAPTURING)&&!ke.current?"block":"none"}}),n.jsx("div",{className:me(s.IDLE),children:n.jsxs("div",{className:"home-root",children:[n.jsxs("div",{className:"home-hero",children:[n.jsxs("div",{className:"home-hero-top",children:[n.jsxs("div",{className:"home-brand",children:[n.jsx("div",{className:"home-brand-logo",children:n.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk",style:{width:26,height:26,objectFit:"contain"}})}),n.jsxs("div",{children:[n.jsx("div",{className:"home-brand-name",children:"Sea Hawk Scanner"}),n.jsx("div",{className:"home-brand-tagline",children:"Courier Management"})]})]}),n.jsxs("div",{className:`home-conn-pill ${C==="paired"?"connected":""}`,children:[C==="paired"?n.jsx(Jt,{size:11}):n.jsx(Hn,{size:11}),C==="paired"?"Live":C==="connecting"?"Connecting...":"Offline"]})]}),n.jsxs("div",{className:"home-stats-band",children:[n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:k.scanNumber}),n.jsx("div",{className:"home-stat-lbl",children:"Scanned"})]}),n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:St>0?St.toFixed(1):"0"}),n.jsx("div",{className:"home-stat-lbl",children:"Total kg"})]}),n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:Fn}),n.jsx("div",{className:"home-stat-lbl",children:"Session"})]})]}),n.jsxs("div",{className:"home-date-tile",children:[n.jsx(Kn,{size:18,color:"#60A5FA"}),n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"home-date-lbl",children:"Scan Date"}),n.jsxs("div",{className:"home-date-val",children:[new Date(A+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),A===new Date().toISOString().slice(0,10)&&n.jsx("span",{className:"home-date-today-badge",children:"TODAY"})]})]}),n.jsx("div",{className:"home-date-change",children:"Change ▸"}),n.jsx("input",{type:"date",value:A,max:new Date().toISOString().slice(0,10),onChange:e=>{const t=e.target.value;if(t&&_e.test(t)){ct(t);try{localStorage.setItem("seahawk_scanner_session_date",t)}catch(a){E("persist session date",a)}v("tap")}}})]})]}),n.jsxs("div",{className:"home-scan-zone",children:[n.jsxs("div",{className:"home-scan-btn-wrap",children:[n.jsx("div",{className:"home-scan-ring"}),n.jsx("div",{className:"home-scan-ring home-scan-ring2"}),n.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Da,children:[n.jsx(Jn,{size:36,color:"white"}),n.jsx("span",{className:"home-scan-btn-lbl",children:"Scan"})]})]}),n.jsx("div",{className:"home-cta",children:k.scanNumber===0?"Tap to scan your first parcel":"Ready — tap to scan next parcel"}),n.jsxs("div",{className:"mode-toggle-row",children:[n.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",className:`mode-pill ${$==="fast"?"active":""}`,onClick:()=>_n("fast"),children:[n.jsx(Qt,{size:13})," Fast scan"]}),n.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",className:`mode-pill ${$==="ocr"?"active":""}`,onClick:()=>_n("ocr"),children:[n.jsx(Qn,{size:13})," OCR label"]})]}),n.jsxs("div",{className:"mode-toggle-row",style:{marginTop:7},children:[n.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",className:`mode-pill ${pe===xe.phone?"active":""}`,onClick:()=>st(xe.phone),children:[n.jsx(Jn,{size:13})," Phone lens"]}),n.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",className:`mode-pill ${pe===xe.rugged?"active":""}`,onClick:()=>st(xe.rugged),children:[n.jsx(Yt,{size:13})," Rugged"]})]}),n.jsxs("div",{style:{width:"100%",maxWidth:320,marginTop:14},children:[n.jsx("div",{style:{fontSize:"0.6rem",fontWeight:700,color:i.mutedLight,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),n.jsxs("div",{className:"manual-awb-row",children:[n.jsx("input",{"data-testid":"manual-awb-input",className:"manual-awb-input",value:tn,onChange:e=>at(e.target.value.toUpperCase()),placeholder:"e.g. Z67086879",inputMode:"text",autoCapitalize:"characters",onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),n.jsx("button",{type:"button","data-testid":"manual-awb-submit",disabled:tn.trim().length<6,className:"btn btn-primary",style:{padding:"10px 16px",fontSize:"0.8rem",borderRadius:12,opacity:tn.trim().length>=6?1:.42},onClick:Ba,children:"Go →"})]})]}),n.jsxs("div",{className:"action-strip",children:[n.jsxs("button",{className:`action-tile ${B.length>0?"upload-active":""}`,onClick:Fa,children:[n.jsx(Ka,{size:14})," ",B.length>0?`Upload (${B.length})`:"Synced"]}),n.jsxs("button",{className:"action-tile",onClick:()=>ot(e=>!e),children:[ye?n.jsx(Xt,{size:14}):n.jsx(Zt,{size:14})," Voice ",ye?"On":"Off"]}),n.jsxs("button",{className:"action-tile danger",onClick:Ma,children:[n.jsx(ea,{size:14})," End"]})]}),B.length>0&&n.jsxs("div",{style:{marginTop:10,fontSize:"0.7rem",color:i.warning,fontWeight:700,display:"flex",alignItems:"center",gap:5},children:[n.jsx(na,{size:12})," ",B.length," pending sync"]})]}),n.jsxs("div",{className:"home-manifest",children:[n.jsxs("div",{className:"manifest-head",children:[n.jsxs("div",{className:"manifest-title",children:[n.jsx(Ja,{size:11})," Accepted Consignments"]}),k.scannedItems.length>0&&n.jsx("div",{className:"manifest-count",children:k.scannedItems.length})]}),k.scannedItems.length>0&&(()=>{const e={};return k.scannedItems.forEach(t=>{const a=Oe(t.courier||"");a&&(e[a]=(e[a]||0)+1)}),Object.keys(e).length>0?n.jsx("div",{className:"manifest-courier-bar",children:Object.entries(e).map(([t,a])=>{const o=Zn(t);return n.jsxs("span",{className:"courier-chip",style:{background:o.light,color:o.bg,border:`1px solid ${o.bg}22`},children:[t," ",a]},t)})}):null})(),n.jsx("div",{className:"manifest-list",children:k.scannedItems.length===0?n.jsxs("div",{className:"manifest-empty",children:[n.jsx("div",{className:"manifest-empty-icon",children:n.jsx(In,{size:28,color:i.mutedLight})}),n.jsxs("div",{className:"manifest-empty-text",children:["No consignments yet.",n.jsx("br",{}),"Tap the scan button above to begin."]})]}):k.scannedItems.map((e,t)=>{const a=Zn(Oe(e.courier||""));return n.jsxs("div",{className:"manifest-item",children:[n.jsx("div",{className:"manifest-item-icon",style:{background:a.light,color:a.bg},children:Oe(e.courier||"")||"PKG"}),n.jsxs("div",{className:"manifest-main",children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[n.jsx("div",{className:"manifest-awb",children:e.awb}),e.weight>0&&n.jsxs("div",{className:"manifest-weight",children:[e.weight,"kg"]})]}),n.jsxs("div",{className:"manifest-meta",children:[e.clientCode==="OFFLINE"?n.jsx("span",{className:"manifest-tag",style:{background:i.warningLight,color:i.warning},children:"Offline"}):e.clientCode&&n.jsx("span",{className:"manifest-tag",style:{background:i.primaryLight,color:i.primary},children:e.clientCode}),e.consignee&&n.jsx("span",{children:e.consignee}),e.destination&&n.jsxs("span",{children:["→ ",e.destination]}),e.date&&n.jsx("span",{className:"manifest-tag",style:{background:"#EFF6FF",color:"#1D4ED8"},children:pa(e.date)})]}),ka===e.queueId?n.jsxs("div",{style:{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginTop:6},children:[n.jsx("input",{type:"date",className:"queue-date-input",value:pn,max:new Date().toISOString().slice(0,10),onChange:o=>hn(o.target.value),disabled:Me===e.queueId}),n.jsx("button",{type:"button",className:"manifest-action-btn primary",onClick:()=>Aa(e),disabled:Me===e.queueId||!_e.test(pn),children:Me===e.queueId?"Saving...":"Save"}),n.jsx("button",{type:"button",className:"manifest-action-btn",onClick:Ea,disabled:Me===e.queueId,children:"Cancel"})]}):n.jsxs("div",{className:"manifest-actions",children:[n.jsxs("button",{type:"button",className:"manifest-action-btn",onClick:()=>Ia(e),disabled:Me===e.queueId,children:[n.jsx(Kn,{size:11})," Date"]}),n.jsxs("button",{type:"button",className:"manifest-action-btn danger",onClick:()=>Ra(e),disabled:Me===e.queueId,children:[n.jsx(ea,{size:11})," ",Me===e.queueId?"Removing...":"Remove"]})]})]})]},e.queueId||`${e.awb}-${t}`)})})]})]})}),n.jsx("div",{className:me(s.SCANNING),children:n.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[n.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:ke.current?"block":"none"}}),n.jsx("div",{className:"cam-overlay",children:n.jsxs("div",{className:"scan-guide",style:Be==="barcode"?{width:ia.w,height:ia.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:te?"rgba(248,113,113,0.92)":void 0,boxShadow:te?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:En.w,height:En.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[n.jsx("div",{className:"scan-guide-corner corner-tl"}),n.jsx("div",{className:"scan-guide-corner corner-tr"}),n.jsx("div",{className:"scan-guide-corner corner-bl"}),n.jsx("div",{className:"scan-guide-corner corner-br"}),Be==="barcode"&&n.jsx("div",{className:"scan-laser",children:n.jsx("div",{className:"scan-laser-spark"})})]})}),n.jsxs("div",{className:"cam-hud",children:[n.jsxs("div",{className:"cam-hud-chip",children:[n.jsx(Jt,{size:12})," ",h?"DIRECT":l]}),n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Be==="document"&&n.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[n.jsx(ta,{size:11})," LABEL MODE"]}),n.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[n.jsx(In,{size:12})," ",k.scanNumber,rt==="native"?n.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):n.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),n.jsxs("div",{className:"cam-bottom",children:[Be==="barcode"?n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[n.jsx("div",{children:$==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),Ln>0&&n.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",Ln,"/",An]}),!!te&&n.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:te})]}):n.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[n.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),n.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[n.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:ja,children:"Capture label instead"}),n.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{J(0),re(0),m(""),On("barcode"),v("tap")},children:"Back to barcode mode"})]})]}),n.jsxs("div",{style:{display:"flex",gap:12},children:[n.jsxs("button",{className:"cam-hud-chip",onClick:()=>_n(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[$==="fast"?n.jsx(Qt,{size:13}):n.jsx(Qn,{size:13}),$==="fast"?"FAST":"OCR"]}),n.jsx("button",{className:"cam-hud-chip",onClick:()=>ot(!ye),style:{border:"none",cursor:"pointer"},children:ye?n.jsx(Xt,{size:14}):n.jsx(Zt,{size:14})})]})]})]})}),n.jsx("div",{className:me(s.CAPTURING),children:n.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!Ue&&n.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[n.jsx(Qa,{size:44,color:"#34D399"}),n.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:D||"OCR fallback"}),n.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:D?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),n.jsx("div",{className:"cam-overlay",children:n.jsxs("div",{ref:mn,className:`scan-guide ${oe?"detected":""}`,style:{width:En.w,height:En.h,maxHeight:"75vh",borderRadius:12},children:[n.jsx("div",{className:"scan-guide-corner corner-tl"}),n.jsx("div",{className:"scan-guide-corner corner-tr"}),n.jsx("div",{className:"scan-guide-corner corner-bl"}),n.jsx("div",{className:"scan-guide-corner corner-br"})]})}),n.jsxs("div",{className:"cam-hud",children:[n.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[n.jsx(ta,{size:12})," ",D||"OCR AWB capture"]}),B.length>0&&n.jsxs("div",{className:"cam-hud-chip",children:[n.jsx(na,{size:12})," ",B.length," queued"]})]}),n.jsxs("div",{className:"cam-bottom",children:[n.jsx("div",{style:{color:oe?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:Oa}),P.metrics&&n.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",P.metrics.blurScore," | Glare ",P.metrics.glareRatio,"% | Skew ",P.metrics.perspectiveSkew,"%"]}),n.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Ta,disabled:!kt,style:{opacity:kt?1:.4},children:n.jsx("div",{className:"capture-btn-inner"})}),N&&n.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Pa,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),n.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ae(""),m(""),J(0),re(0),ve.current=!1,v("tap"),p(s.SCANNING)},children:"← Rescan barcode"})]})]})}),n.jsx("div",{className:me(s.PREVIEW),children:n.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[n.jsxs("div",{style:{padding:"52px 20px 16px",background:"linear-gradient(135deg, #0D1B2A, #1E2D3D)",color:"white"},children:[n.jsx("div",{style:{fontSize:"0.6rem",color:"rgba(255,255,255,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4},children:"CAPTURED"}),n.jsx("div",{className:"mono",style:{fontSize:"1.05rem",fontWeight:800,color:"#fff"},children:D||"OCR Capture"}),G.kb>0&&n.jsxs("div",{style:{fontSize:"0.68rem",color:"rgba(255,255,255,0.45)",marginTop:3},children:[G.kb,"KB · ",G.width,"×",G.height]})]}),n.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:U&&n.jsx("img",{src:U,alt:"Captured label",className:"preview-img"})}),n.jsxs("div",{style:{padding:"12px 16px 28px",display:"flex",gap:10,background:i.surface,borderTop:`1px solid ${i.border}`},children:[n.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{se(null),p(s.CAPTURING)},children:[n.jsx(aa,{size:15})," Retake"]}),n.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:za,children:[n.jsx(Ya,{size:15})," Read This Label"]})]})]})}),n.jsx("div",{className:me(s.PROCESSING),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",background:i.bg},children:[n.jsxs("div",{style:{padding:"52px 24px 20px",textAlign:"center",background:"linear-gradient(135deg, #0D1B2A, #1E2D3D)",color:"white"},children:[n.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:999,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",marginBottom:14},children:[n.jsx(Qn,{size:16,color:"#93C5FD",style:{animation:"spin 2s linear infinite"}}),n.jsx("span",{style:{fontSize:"0.72rem",fontWeight:800,color:"#93C5FD",letterSpacing:"0.06em",textTransform:"uppercase"},children:U?"Reading Label":"Saving Scan"})]}),n.jsx("div",{className:"mono",style:{fontSize:"1.1rem",fontWeight:700,color:"#fff",marginBottom:6},children:D||"—"}),n.jsx("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.5)"},children:U?"OCR engine extracting fields...":"Syncing with server..."})]}),n.jsx("div",{style:{padding:"16px 16px",display:"flex",flexDirection:"column",gap:10,flex:1},children:[["Client","55%"],["Consignee","80%"],["Destination","65%"],["Pincode","40%"],["Weight (kg)","35%"],["Order No","50%"]].map(([e,t])=>n.jsxs("div",{className:"field-card",style:{opacity:.8},children:[n.jsx("div",{className:"conf-dot conf-none",style:{background:"#DDE3EC"}}),n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:e}),n.jsx("div",{className:"skeleton",style:{height:16,width:t,marginTop:5}})]})]},e))}),n.jsx("div",{style:{padding:"12px 20px 28px",textAlign:"center"},children:n.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"9px 24px"},onClick:()=>{m("Cancelled by user."),p(s.ERROR)},children:"Cancel"})})]})}),n.jsx("div",{className:me(s.REVIEWING),children:n.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:i.bg},children:[n.jsxs("div",{className:`review-header${Un?" courier-"+Un.toLowerCase():""}`,children:[n.jsxs("div",{className:"review-header-top",children:[n.jsxs("div",{children:[n.jsx("div",{className:"review-title",children:"REVIEW CONSIGNMENT"}),n.jsx("div",{className:"mono review-awb",children:(d==null?void 0:d.awb)||D})]}),n.jsxs("div",{style:{display:"flex",gap:6,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"flex-end"},children:[(I==null?void 0:I.learnedFieldCount)>0&&n.jsxs("div",{className:"source-badge source-learned",children:["AI ",I.learnedFieldCount," corrected"]}),vn.score===0&&n.jsx("div",{style:{fontSize:"0.6rem",background:"rgba(220,38,38,0.22)",color:"#FCA5A5",padding:"3px 9px",borderRadius:7,fontWeight:800,border:"1px solid rgba(220,38,38,0.3)"},children:"OCR failed — fill manually"})]})]}),n.jsxs("div",{className:"review-meta-row",children:[n.jsxs("span",{className:`review-confidence ${vn.level}`,children:[n.jsx(Yt,{size:12}),vn.label," (",Math.round(vn.score*100),"%)"]}),n.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:_a,title:"Tap to change courier",children:[n.jsx(In,{size:12})," ",Un||"Tap to set courier"]}),n.jsxs("span",{className:"review-chip review-chip-date",children:[n.jsx(Kn,{size:12})," ",Ga||"No date"]})]})]}),(()=>{const e=["consignee","destination","weight"],t=e.filter(o=>{const u=g[o];return u!=null&&String(u).trim()!==""&&String(u).trim()!=="0"}).length,a=Math.round(t/e.length*100);return n.jsxs("div",{className:"form-progress-bar-wrap",children:[n.jsx("div",{className:"form-progress-bar-track",children:n.jsx("div",{className:"form-progress-bar-fill",style:{width:a+"%"}})}),n.jsxs("div",{className:"form-progress-label",children:[t,"/",e.length," required"]})]})})(),n.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[n.jsxs("div",{className:`field-card ${(((Mt=ie.clientCode)==null?void 0:Mt.confidence)||0)<.55?"warning":"conf-high"}`,children:[n.jsx("div",{className:et(((Ft=ie.clientCode)==null?void 0:Ft.confidence)||0)}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:5},children:[n.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Tt=ie.clientCode)==null?void 0:Tt.source)&&(()=>{const e=nt(ie.clientCode.source);return e?n.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.clientCode||"",onChange:e=>O(t=>({...t,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code"}),n.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,gap:8},children:[n.jsx("div",{style:{fontSize:"0.6rem",color:i.muted},children:he?n.jsxs("span",{style:{color:i.primary,fontWeight:700},children:["Sticky: ",he]}):"Sticky client off"}),he?n.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>dn(""),children:"Clear"}):n.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>{const e=Ae(g.clientCode||"");e&&e!=="MISC"&&dn(e)},children:"Keep this client"})]}),((Pt=I==null?void 0:I.clientMatches)==null?void 0:Pt.length)>0&&I.clientNeedsConfirmation&&n.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:7},children:I.clientMatches.slice(0,3).map(e=>n.jsxs("button",{type:"button",className:`suggest-chip ${g.clientCode===e.code?"active":""}`,onClick:()=>O(t=>({...t,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),n.jsxs("div",{className:`field-card ${(zt=g.consignee)!=null&&zt.trim()?"conf-high":"required-empty"}`,children:[n.jsx("div",{className:(Lt=g.consignee)!=null&&Lt.trim()?et((($t=ie.consignee)==null?void 0:$t.confidence)||0):"conf-dot conf-low"}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Consignee ",n.jsx("span",{className:"field-required-star",children:"*"}),((Ot=ie.consignee)==null?void 0:Ot.source)&&(()=>{const e=nt(ie.consignee.source);return e?n.jsxs("span",{className:e.className,style:{marginLeft:4},children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.consignee||"",onChange:e=>O(t=>({...t,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name *"})]})]}),n.jsxs("div",{className:`field-card ${(_t=g.destination)!=null&&_t.trim()?"conf-high":"required-empty"}`,children:[n.jsx("div",{className:(Gt=g.destination)!=null&&Gt.trim()?et(((Wt=ie.destination)==null?void 0:Wt.confidence)||0):"conf-dot conf-low"}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Destination ",n.jsx("span",{className:"field-required-star",children:"*"}),((Vt=ie.destination)==null?void 0:Vt.source)&&(()=>{const e=nt(ie.destination.source);return e?n.jsxs("span",{className:e.className,style:{marginLeft:4},children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.destination||"",onChange:e=>O(t=>({...t,destination:e.target.value.toUpperCase()})),placeholder:"City *"}),(I==null?void 0:I.pincodeCity)&&I.pincodeCity!==g.destination&&n.jsxs("button",{type:"button",className:"suggest-chip pincode-suggest",style:{marginTop:6},onClick:()=>O(e=>({...e,destination:I.pincodeCity})),children:["Pincode suggests: ",I.pincodeCity]}),!(I!=null&&I.pincodeCity)&&((qt=g.pincode)==null?void 0:qt.length)===6&&(()=>{const e=ma(g.pincode);return e&&e!==g.destination?n.jsxs("button",{type:"button",className:"suggest-chip pincode-suggest",style:{marginTop:6},onClick:()=>O(t=>({...t,destination:e})),children:[g.pincode," suggests: ",e]}):null})()]})]}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[n.jsx("div",{className:"field-card",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"Pincode"}),n.jsx("input",{className:"field-input",value:g.pincode||"",onChange:e=>{const t=e.target.value.replace(/[^0-9]/g,"").slice(0,6);O(a=>{var u;const o=t.length===6&&!((u=a.destination)!=null&&u.trim())?ma(t):"";return{...a,pincode:t,...o?{destination:o}:{}}})},placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),n.jsx("div",{className:`field-card ${(Ut=I==null?void 0:I.weightAnomaly)!=null&&Ut.anomaly?"warning":!g.weight||String(g.weight).trim()==="0"?"required-empty":"conf-med"}`,children:n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Weight (kg) ",n.jsx("span",{className:"field-required-star",children:"*"})]}),n.jsx("input",{className:"field-input",value:g.weight||"",onChange:e=>O(t=>({...t,weight:e.target.value})),placeholder:"0.0 *",inputMode:"decimal"}),((Ht=I==null?void 0:I.weightAnomaly)==null?void 0:Ht.anomaly)&&n.jsx("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:3,fontWeight:700},children:I.weightAnomaly.warning})]})})]}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[n.jsx("div",{className:"field-card",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"COD Amount (Rs.)"}),n.jsx("input",{className:"field-input",value:g.amount||"",onChange:e=>O(t=>({...t,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),n.jsx("div",{className:"field-card",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"Order No"}),n.jsx("input",{className:"field-input",value:g.orderNo||"",onChange:e=>O(t=>({...t,orderNo:e.target.value})),placeholder:"Optional"})]})})]}),n.jsxs("div",{style:{fontSize:"0.6rem",color:i.mutedLight,textAlign:"center",paddingBottom:4},children:[n.jsx("span",{style:{color:"#E11D48"},children:"*"})," Required fields"]})]}),n.jsxs("div",{style:{padding:"10px 16px 20px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10,background:i.surface},children:[n.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{if(h){w("/scan-mobile");return}ln()},children:[n.jsx(Xa,{size:15})," Skip"]}),n.jsx("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:La,disabled:j===s.APPROVING,children:j===s.APPROVING?n.jsxs(n.Fragment,{children:[n.jsx(jn,{size:15,style:{animation:"spin 1s linear infinite"}})," Saving..."]}):n.jsxs(n.Fragment,{children:[n.jsx(Za,{size:15})," Approve & Save"]})})]})]})}),n.jsx("div",{className:me(s.APPROVING),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[n.jsx("div",{style:{width:72,height:72,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:n.jsx(jn,{size:34,style:{animation:"spin 1s linear infinite",color:i.primary}})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:i.text},children:"Saving Consignment"}),n.jsx("div",{className:"mono",style:{fontSize:"0.95rem",marginTop:8,color:i.muted},children:(d==null?void 0:d.awb)||D}),n.jsxs("div",{style:{fontSize:"0.74rem",color:i.mutedLight,marginTop:6,lineHeight:1.5},children:["Communicating with server...",n.jsx("br",{}),"If this takes too long, go back and retry."]})]}),n.jsx("button",{className:"btn btn-outline",onClick:()=>{clearTimeout(le.current),le.current=null,m("Please tap Approve & Save again."),p(s.REVIEWING)},children:"Back to review"})]})}),n.jsx("div",{className:me(s.SUCCESS),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,gap:20,background:i.bg},children:[(S==null?void 0:S.courier)&&(()=>{const e=Zn(Oe(S.courier));return n.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:999,background:e.light,color:e.bg,fontSize:"0.7rem",fontWeight:800,border:`1px solid ${e.bg}33`,letterSpacing:"0.04em"},children:[n.jsx(In,{size:13})," ",e.label]})})(),n.jsx("div",{style:{position:"relative"},children:n.jsxs("svg",{width:"88",height:"88",viewBox:"0 0 88 88",children:[n.jsx("circle",{cx:"44",cy:"44",r:"38",fill:i.successLight}),n.jsx("circle",{cx:"44",cy:"44",r:"38",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),n.jsx("polyline",{points:"26,46 38,58 62,32",fill:"none",stroke:i.success,strokeWidth:"4",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.1rem",fontWeight:800,color:i.success,marginBottom:6},children:"Saved Successfully"}),n.jsx("div",{className:"mono",style:{fontSize:"1.3rem",fontWeight:700,color:i.text},children:S==null?void 0:S.awb}),(S==null?void 0:S.clientCode)&&n.jsx("div",{style:{marginTop:8,display:"inline-block",padding:"4px 16px",borderRadius:999,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:700,border:"1px solid rgba(29,78,216,0.15)"},children:S.clientName||S.clientCode}),(S==null?void 0:S.destination)&&n.jsxs("div",{style:{marginTop:6,fontSize:"0.78rem",color:i.muted,fontWeight:500},children:[S.destination," ",S.weight?`• ${S.weight}kg`:""]})]}),n.jsxs("div",{style:{fontSize:"0.72rem",color:i.muted,textAlign:"center",lineHeight:1.5},children:[S!=null&&S.offlineQueued?`${B.length} queued for sync`:`Consignment #${k.scanNumber} accepted`,n.jsx("br",{}),n.jsxs("span",{style:{color:i.mutedLight},children:["Auto-continuing in ",$a,"s"]})]}),n.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>ln($==="fast"?s.SCANNING:s.IDLE),style:{maxWidth:320},children:[n.jsx(Jn,{size:18})," ",$==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),n.jsx("div",{className:me(s.ERROR),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[n.jsx("div",{style:{width:72,height:72,borderRadius:"50%",background:i.errorLight,border:"2px solid rgba(220,38,38,0.18)",display:"flex",alignItems:"center",justifyContent:"center"},children:n.jsx(Kt,{size:34,color:i.error})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1rem",fontWeight:800,color:i.error},children:"Scan Error"}),n.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:6,lineHeight:1.5},children:te})]}),n.jsxs("button",{className:"btn btn-primary",onClick:ln,children:[n.jsx(aa,{size:16})," Try Again"]})]})}),C==="disconnected"&&j!==s.IDLE&&n.jsxs("div",{className:"offline-banner",children:[n.jsx(Hn,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",B.length?`(${B.length} queued)`:""]})]}),n.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Ar as default};
