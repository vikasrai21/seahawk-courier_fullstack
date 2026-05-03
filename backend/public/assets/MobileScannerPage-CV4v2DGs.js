import{a0 as pr,u as hr,r,j as n,v as la,e as Bn,bs as nt,bc as da,aq as tt,bd as at,Z as ua,aL as rt,as as pa,bt as gr,bu as ha,bv as ga,aj as it,C as ma,bj as mr,P as Mn,b6 as fa,p as fr,d as ba,G as br,w as st,X as ot}from"./vendor-react-DHsZcx6l.js";import{a as xe,l as xr}from"./index-DJlHs0EZ.js";import{c as wr,n as yr}from"./barcodeEngine-BNihspLg.js";function Aa(l,c){var w,h;try{if(!l||!c)return null;const M=Number(l.videoWidth||0),T=Number(l.videoHeight||0);if(!M||!T)return null;const V=(w=l.getBoundingClientRect)==null?void 0:w.call(l),P=(h=c.getBoundingClientRect)==null?void 0:h.call(c);if(!V||!P)return null;const $=Number(V.width||0),C=Number(V.height||0);if(!$||!C)return null;const x=Math.max($/M,C/T),ne=M*x,y=T*x,F=($-ne)/2,te=(C-y)/2,f=P.left-V.left,I=P.top-V.top,Ge=P.right-V.left,E=P.bottom-V.top,ae=(f-F)/x,U=(I-te)/x,oe=(Ge-F)/x,pe=(E-te)/x,d=(X,Ve,Be)=>Math.max(Ve,Math.min(Be,X)),we=d(Math.min(ae,oe),0,M),g=d(Math.min(U,pe),0,T),W=d(Math.max(ae,oe),0,M),S=d(Math.max(U,pe),0,T),_=Math.max(0,W-we),Ce=Math.max(0,S-g);return!_||!Ce?null:{x:we,y:g,w:_,h:Ce}}catch{return null}}function xa(l=[]){if(!l.length)return"";const c=[];return l.includes("blur")&&c.push("hold steady"),l.includes("glare")&&c.push("reduce glare"),l.includes("angle")&&c.push("straighten angle"),l.includes("dark")&&c.push("add light"),l.includes("low_edge")&&c.push("fill frame"),c.length?`Improve capture: ${c.join(", ")}.`:""}function Cr(l,c){if(!l||!c||!l.videoWidth||!l.videoHeight)return null;const w=Aa(l,c);if(!w)return null;const h=Math.max(0,Math.floor(w.x)),M=Math.max(0,Math.floor(w.y)),T=Math.max(24,Math.floor(w.w)),V=Math.max(24,Math.floor(w.h)),P=128,$=96,C=document.createElement("canvas");C.width=P,C.height=$;const x=C.getContext("2d",{willReadFrequently:!0});if(!x)return null;x.drawImage(l,h,M,Math.min(T,l.videoWidth-h),Math.min(V,l.videoHeight-M),0,0,P,$);const ne=x.getImageData(0,0,P,$).data,y=P*$,F=new Float32Array(y);let te=0,f=0,I=0;for(let H=0,Z=0;H<ne.length;H+=4,Z+=1){const J=.2126*ne[H]+.7152*ne[H+1]+.0722*ne[H+2];F[Z]=J,te+=J,J>=245&&(f+=1),J<=24&&(I+=1)}let Ge=0,E=0,ae=0,U=0,oe=0,pe=0;const d=Math.max(4,Math.floor($*.15)),we=Math.max(4,Math.floor(P*.15)),g=P;for(let H=1;H<$-1;H+=1)for(let Z=1;Z<P-1;Z+=1){const J=H*g+Z,z=F[J],qe=F[J-1],G=F[J+1],Ue=F[J-g],He=F[J+g],Ne=Math.abs(G-qe),un=Math.abs(He-Ue),Me=Ne+un,ht=Math.abs(4*z-qe-G-Ue-He);Ge+=ht,Me>58&&(E+=1),H<=d&&(ae+=Me),H>=$-d&&(U+=Me),Z<=we&&(oe+=Me),Z>=P-we&&(pe+=Me)}const W=Math.max(1,(P-2)*($-2)),S=te/y,_=Ge/W,Ce=E/W,X=f/y,Ve=I/y,Be=Math.abs(ae-U)/Math.max(1,ae+U),D=Math.abs(oe-pe)/Math.max(1,oe+pe),an=Math.max(Be,D),ce=[];return _<22&&ce.push("blur"),X>.18&&ce.push("glare"),(Ve>.55||S<40)&&ce.push("dark"),Ce<.08&&ce.push("low_edge"),an>.62&&ce.push("angle"),{ok:ce.length===0,issues:ce,metrics:{brightness:Number(S.toFixed(1)),blurScore:Number(_.toFixed(1)),glareRatio:Number((X*100).toFixed(1)),edgeRatio:Number((Ce*100).toFixed(1)),perspectiveSkew:Number((an*100).toFixed(1))}}}function Ln(l,c){const w=Number(l);return Number.isFinite(w)&&w>0?w:c}function Nr({samples:l=[],awb:c,now:w=Date.now(),stabilityWindowMs:h=1100,requiredHits:M=3}){const T=Ln(h,1100),V=Math.max(1,Math.floor(Ln(M,3))),P=Ln(w,Date.now()),$=String(c||"").trim(),C=Array.isArray(l)?l.filter(y=>(y==null?void 0:y.awb)&&P-((y==null?void 0:y.at)||0)<=T):[];if(!$)return{samples:C,hits:0,isStable:!1};const x=[...C,{awb:$,at:P}],ne=x.reduce((y,F)=>F.awb===$?y+1:y,0);return{samples:x,hits:ne,isStable:ne>=V}}function kr({currentAttempts:l=0,maxReframeAttempts:c=2}){const w=Math.max(0,Math.floor(Ln(c,2))),h=Math.max(0,Math.floor(Number(l)||0))+1;return h<=w?{action:"reframe",attempts:h}:{action:"switch_to_document",attempts:w}}function vr(){return window.location.origin}const Sr=vr(),wa={w:"90vw",h:"18vw"},Tn={w:"92vw",h:"130vw"},ya=3500,Ca=900,jr=1e4,Ir=12e3,Er=15e3,Ar="mobile_scanner_offline_queue",Rr="mobile_scanner_session_state",Dr="mobile_scanner_sticky_client",Na="mobile_scanner_workflow_mode",ka="mobile_scanner_device_profile",Br=2e4,Mr=500,Tr=1,va=100,Fn=2,ct=2,Fr=500,Sa=960,We=.68,zr=900,ye={phone:"phone-camera",rugged:"rugged-scanner"},zn=["Trackon","DTDC","Delhivery","BlueDart"],_e=/^\d{4}-\d{2}-\d{2}$/,Re=l=>{const c=String(l||"").trim();if(!c)return"";const w=c.toUpperCase();return w.includes("TRACKON")||w.includes("PRIME")?"Trackon":w.includes("DTDC")?"DTDC":w.includes("DELHIVERY")?"Delhivery":w.includes("BLUE")?"BlueDart":c},De=l=>String(l||"").trim().toUpperCase(),Pr=(l="")=>{const c=String(l||"").trim().toUpperCase();return c?/^[ZDX][0-9]/.test(c)||/^7X[0-9]/i.test(c)||/^I[0-9]{8}/.test(c)?"DTDC":/^(299|368)\d{11}$/.test(c)||/^\d{14}$/.test(c)?"Delhivery":/^(100|500)\d{9}$/.test(c)?"Trackon":/^\d{11}$/.test(c)?"BlueDart":/^2000[45]/.test(c)?"Trackon":"":""},ja=l=>{const c=String(l||"").trim();if(!_e.test(c))return c;try{return new Date(`${c}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return c}},nn=(l,c="")=>{const w=String(l||"").trim();if(_e.test(w))return w;const h=String(c||"").trim();return _e.test(h)?h:new Date().toISOString().slice(0,10)},o={IDLE:"IDLE",SCANNING:"SCANNING",CAPTURING:"CAPTURING",PREVIEW:"PREVIEW",PROCESSING:"PROCESSING",REVIEWING:"REVIEWING",APPROVING:"APPROVING",SUCCESS:"SUCCESS",ERROR:"ERROR"};function R(l,c){c instanceof Error?c.message:String(c||"unknown error")}const $r=l=>{var c;try{(c=navigator==null?void 0:navigator.vibrate)==null||c.call(navigator,l)}catch(w){R("vibrate",w)}},Ia={tap:[20],lock:[400,50,200,50,100],success:[18,28,72],warning:[70,50,70],retry:[28,40,28],error:[110,55,110],duplicate:[90,50,90,50,90],review:[200,40,120]},N=(l="tap")=>{$r(Ia[l]||Ia.tap)},On=(l,c,w="sine")=>{try{const h=new(window.AudioContext||window.webkitAudioContext),M=h.createOscillator(),T=h.createGain();M.type=w,M.frequency.setValueAtTime(l,h.currentTime),T.gain.setValueAtTime(.12,h.currentTime),T.gain.exponentialRampToValueAtTime(.01,h.currentTime+c),M.connect(T),T.connect(h.destination),M.start(),M.stop(h.currentTime+c)}catch(h){R("playTone",h)}},tn=()=>{On(880,.12),setTimeout(()=>On(1100,.1),130)},Pn=()=>{try{const l=new(window.AudioContext||window.webkitAudioContext),c=l.createOscillator(),w=l.createGain();c.type="square",c.frequency.setValueAtTime(3800,l.currentTime),c.frequency.setValueAtTime(3200,l.currentTime+.04),w.gain.setValueAtTime(0,l.currentTime),w.gain.linearRampToValueAtTime(.18,l.currentTime+.005),w.gain.setValueAtTime(.18,l.currentTime+.055),w.gain.exponentialRampToValueAtTime(.001,l.currentTime+.13),c.connect(w),w.connect(l.destination),c.start(l.currentTime),c.stop(l.currentTime+.14)}catch(l){R("playHardwareBeep",l)}},Lr=()=>On(600,.08),Q=()=>On(200,.25,"sawtooth"),lt=l=>{try{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const c=new SpeechSynthesisUtterance(l);c.rate=1.2,c.pitch=1,c.lang="en-IN",window.speechSynthesis.speak(c)}catch(c){R("speak",c)}},Ea=()=>{var l;try{if(typeof window>"u")return!1;if(window.isSecureContext)return!0;const c=((l=window.location)==null?void 0:l.hostname)||"";return c==="localhost"||c==="127.0.0.1"}catch{return!1}},i={bg:"#F8FAFF",surface:"#FFFFFF",border:"rgba(15,23,42,0.09)",text:"#0D1B2A",muted:"#5B6B7C",mutedLight:"#8FA0B0",primary:"#1D4ED8",primaryLight:"#EFF6FF",success:"#059669",successLight:"#ECFDF5",warning:"#D97706",warningLight:"#FFFBEB",error:"#DC2626",errorLight:"#FFF1F1"},Or={DTDC:{bg:"#C8102E",light:"#FFF0F1",text:"#fff",label:"DTDC"},Delhivery:{bg:"#00A0A0",light:"#E6FAFA",text:"#fff",label:"Delhivery"},Trackon:{bg:"#E65C00",light:"#FFF3EC",text:"#fff",label:"Trackon"},BlueDart:{bg:"#1A3A8C",light:"#EDF2FF",text:"#fff",label:"BlueDart"}},$n=(l="")=>{const c=String(l||"").trim();return Or[c]||{bg:"#1D4ED8",light:"#EFF6FF",text:"#fff",label:c||"Unknown"}},Wr={110001:"New Delhi",110002:"New Delhi",110003:"New Delhi",110004:"New Delhi",110005:"New Delhi",110006:"New Delhi",110007:"New Delhi",110008:"New Delhi",110009:"New Delhi",110010:"New Delhi",110011:"New Delhi",110012:"New Delhi",110013:"New Delhi",110014:"New Delhi",110015:"New Delhi",110016:"New Delhi",110017:"New Delhi",110018:"New Delhi",110019:"New Delhi",110020:"New Delhi",110021:"New Delhi",110022:"New Delhi",110023:"New Delhi",110024:"New Delhi",110025:"New Delhi",110026:"New Delhi",110027:"New Delhi",110028:"New Delhi",110029:"New Delhi",110030:"New Delhi",110031:"New Delhi",110032:"New Delhi",110033:"New Delhi",110034:"New Delhi",110035:"New Delhi",110036:"New Delhi",110037:"New Delhi",110038:"New Delhi",110039:"New Delhi",110040:"New Delhi",110041:"New Delhi",110042:"New Delhi",110043:"New Delhi",110044:"New Delhi",110045:"New Delhi",110046:"New Delhi",110047:"New Delhi",110048:"New Delhi",110049:"New Delhi",110051:"New Delhi",110052:"New Delhi",110053:"New Delhi",110054:"New Delhi",110055:"New Delhi",110056:"New Delhi",110057:"New Delhi",110058:"New Delhi",110059:"New Delhi",110060:"New Delhi",110061:"New Delhi",110062:"New Delhi",110063:"New Delhi",110064:"New Delhi",110065:"New Delhi",110066:"New Delhi",110067:"New Delhi",110068:"New Delhi",110069:"New Delhi",110070:"New Delhi",110071:"New Delhi",110072:"New Delhi",110073:"New Delhi",110074:"New Delhi",110075:"New Delhi",110076:"New Delhi",110077:"New Delhi",110078:"New Delhi",110081:"New Delhi",110082:"New Delhi",110083:"New Delhi",110084:"New Delhi",110085:"New Delhi",110086:"New Delhi",110087:"New Delhi",110088:"New Delhi",110089:"New Delhi",110091:"New Delhi",110092:"New Delhi",110093:"New Delhi",110094:"New Delhi",110095:"New Delhi",110096:"New Delhi",121001:"Faridabad",121002:"Faridabad",121003:"Faridabad",121004:"Faridabad",122001:"Gurugram",122002:"Gurugram",122003:"Gurugram",122004:"Gurugram",122006:"Gurugram",122007:"Gurugram",122008:"Gurugram",122009:"Gurugram",122010:"Gurugram",122011:"Gurugram",122015:"Gurugram",122016:"Gurugram",122017:"Gurugram",122018:"Gurugram",122051:"Gurugram",201001:"Ghaziabad",201002:"Ghaziabad",201003:"Ghaziabad",201004:"Ghaziabad",201005:"Ghaziabad",201006:"Ghaziabad",201007:"Ghaziabad",201008:"Ghaziabad",201009:"Ghaziabad",201010:"Ghaziabad",201011:"Ghaziabad",201012:"Ghaziabad",201013:"Ghaziabad",201014:"Ghaziabad",201015:"Ghaziabad",201016:"Ghaziabad",201017:"Ghaziabad",201301:"Noida",201302:"Noida",201303:"Noida",201304:"Noida",201305:"Noida",201306:"Noida",201307:"Noida",201308:"Noida",400001:"Mumbai",400002:"Mumbai",400003:"Mumbai",400004:"Mumbai",400005:"Mumbai",400006:"Mumbai",400007:"Mumbai",400008:"Mumbai",400009:"Mumbai",400010:"Mumbai",400011:"Mumbai",400012:"Mumbai",400013:"Mumbai",400014:"Mumbai",400015:"Mumbai",400016:"Mumbai",400017:"Mumbai",400018:"Mumbai",400019:"Mumbai",400020:"Mumbai",400050:"Mumbai",400051:"Mumbai",400052:"Mumbai",400053:"Mumbai",400054:"Mumbai",400055:"Mumbai",400056:"Mumbai",400057:"Mumbai",400058:"Mumbai",400059:"Mumbai",400060:"Mumbai",400061:"Mumbai",400062:"Mumbai",400063:"Mumbai",400064:"Mumbai",400065:"Mumbai",400066:"Mumbai",400067:"Mumbai",400068:"Mumbai",400069:"Mumbai",400070:"Mumbai",400071:"Mumbai",400072:"Mumbai",400074:"Mumbai",400075:"Mumbai",400076:"Mumbai",400077:"Mumbai",400078:"Mumbai",400079:"Mumbai",400080:"Mumbai",400081:"Mumbai",400082:"Mumbai",400083:"Mumbai",400084:"Mumbai",400085:"Mumbai",400086:"Mumbai",400087:"Mumbai",400088:"Mumbai",400089:"Mumbai",400090:"Mumbai",400091:"Mumbai",400092:"Mumbai",400093:"Mumbai",400094:"Mumbai",400095:"Mumbai",400097:"Mumbai",400098:"Mumbai",400099:"Mumbai",400101:"Mumbai",400102:"Mumbai",400103:"Mumbai",400104:"Mumbai",560001:"Bangalore",560002:"Bangalore",560003:"Bangalore",560004:"Bangalore",560005:"Bangalore",560006:"Bangalore",560007:"Bangalore",560008:"Bangalore",560009:"Bangalore",560010:"Bangalore",560011:"Bangalore",560012:"Bangalore",560013:"Bangalore",560014:"Bangalore",560015:"Bangalore",560016:"Bangalore",560017:"Bangalore",560018:"Bangalore",560019:"Bangalore",560020:"Bangalore",560021:"Bangalore",560022:"Bangalore",560023:"Bangalore",560024:"Bangalore",560025:"Bangalore",560026:"Bangalore",560027:"Bangalore",560028:"Bangalore",560029:"Bangalore",560030:"Bangalore",560032:"Bangalore",560033:"Bangalore",560034:"Bangalore",560035:"Bangalore",560036:"Bangalore",560037:"Bangalore",560038:"Bangalore",560040:"Bangalore",560041:"Bangalore",560042:"Bangalore",560043:"Bangalore",560044:"Bangalore",560045:"Bangalore",560047:"Bangalore",560048:"Bangalore",560050:"Bangalore",560051:"Bangalore",560052:"Bangalore",560053:"Bangalore",560054:"Bangalore",560055:"Bangalore",560056:"Bangalore",560057:"Bangalore",560058:"Bangalore",560059:"Bangalore",560060:"Bangalore",560061:"Bangalore",560062:"Bangalore",560063:"Bangalore",560064:"Bangalore",560065:"Bangalore",560066:"Bangalore",560067:"Bangalore",560068:"Bangalore",560069:"Bangalore",560070:"Bangalore",560071:"Bangalore",560072:"Bangalore",560073:"Bangalore",560074:"Bangalore",560075:"Bangalore",560076:"Bangalore",560077:"Bangalore",560078:"Bangalore",560079:"Bangalore",560080:"Bangalore",560081:"Bangalore",560082:"Bangalore",560083:"Bangalore",560085:"Bangalore",560086:"Bangalore",560087:"Bangalore",560088:"Bangalore",560089:"Bangalore",560090:"Bangalore",560091:"Bangalore",560092:"Bangalore",560093:"Bangalore",560094:"Bangalore",560095:"Bangalore",560096:"Bangalore",560097:"Bangalore",560098:"Bangalore",560099:"Bangalore",560100:"Bangalore",560102:"Bangalore",560103:"Bangalore",560104:"Bangalore",560105:"Bangalore",600001:"Chennai",600002:"Chennai",600003:"Chennai",600004:"Chennai",600005:"Chennai",600006:"Chennai",600007:"Chennai",600008:"Chennai",600009:"Chennai",600010:"Chennai",600011:"Chennai",600012:"Chennai",600013:"Chennai",600014:"Chennai",600015:"Chennai",600016:"Chennai",600017:"Chennai",600018:"Chennai",600019:"Chennai",600020:"Chennai",600021:"Chennai",600022:"Chennai",600023:"Chennai",600024:"Chennai",600025:"Chennai",600026:"Chennai",600028:"Chennai",600029:"Chennai",600030:"Chennai",600031:"Chennai",600032:"Chennai",600033:"Chennai",600034:"Chennai",600035:"Chennai",600036:"Chennai",600037:"Chennai",600038:"Chennai",600039:"Chennai",600040:"Chennai",600041:"Chennai",600042:"Chennai",600043:"Chennai",600044:"Chennai",600045:"Chennai",600047:"Chennai",600048:"Chennai",600049:"Chennai",600050:"Chennai",600051:"Chennai",600052:"Chennai",600053:"Chennai",600054:"Chennai",600055:"Chennai",600056:"Chennai",600057:"Chennai",600058:"Chennai",600059:"Chennai",600060:"Chennai",600061:"Chennai",600062:"Chennai",600063:"Chennai",600064:"Chennai",600065:"Chennai",600066:"Chennai",600067:"Chennai",600068:"Chennai",600069:"Chennai",600070:"Chennai",600071:"Chennai",600072:"Chennai",600073:"Chennai",600074:"Chennai",600075:"Chennai",600076:"Chennai",600077:"Chennai",600078:"Chennai",600079:"Chennai",600080:"Chennai",600081:"Chennai",600082:"Chennai",600083:"Chennai",600084:"Chennai",600085:"Chennai",600086:"Chennai",600087:"Chennai",600088:"Chennai",600089:"Chennai",600090:"Chennai",600091:"Chennai",600092:"Chennai",600093:"Chennai",600094:"Chennai",600095:"Chennai",600096:"Chennai",600097:"Chennai",600099:"Chennai",600100:"Chennai",600101:"Chennai",600102:"Chennai",600103:"Chennai",600104:"Chennai",600105:"Chennai",600106:"Chennai",600107:"Chennai",600108:"Chennai",600109:"Chennai",600110:"Chennai",600111:"Chennai",600112:"Chennai",600113:"Chennai",600114:"Chennai",600115:"Chennai",600116:"Chennai",600117:"Chennai",600119:"Chennai",600120:"Chennai",600121:"Chennai",600122:"Chennai",600123:"Chennai",600125:"Chennai",600126:"Chennai",600127:"Chennai",600128:"Chennai",700001:"Kolkata",700002:"Kolkata",700003:"Kolkata",700004:"Kolkata",700005:"Kolkata",700006:"Kolkata",700007:"Kolkata",700008:"Kolkata",700009:"Kolkata",700010:"Kolkata",700011:"Kolkata",700012:"Kolkata",700013:"Kolkata",700014:"Kolkata",700015:"Kolkata",700016:"Kolkata",700017:"Kolkata",700018:"Kolkata",700019:"Kolkata",700020:"Kolkata",500001:"Hyderabad",500002:"Hyderabad",500003:"Hyderabad",500004:"Hyderabad",500005:"Hyderabad",500006:"Hyderabad",500007:"Hyderabad",500008:"Hyderabad",500009:"Hyderabad",500010:"Hyderabad",500011:"Hyderabad",500012:"Hyderabad",500013:"Hyderabad",500014:"Hyderabad",500015:"Hyderabad",500016:"Hyderabad",500017:"Hyderabad",500018:"Hyderabad",500019:"Hyderabad",500020:"Hyderabad",380001:"Ahmedabad",380002:"Ahmedabad",380003:"Ahmedabad",380004:"Ahmedabad",380005:"Ahmedabad",380006:"Ahmedabad",380007:"Ahmedabad",380008:"Ahmedabad",380009:"Ahmedabad",380010:"Ahmedabad",380013:"Ahmedabad",380014:"Ahmedabad",380015:"Ahmedabad",380016:"Ahmedabad",380017:"Ahmedabad",380018:"Ahmedabad",380019:"Ahmedabad",380021:"Ahmedabad",380022:"Ahmedabad",380023:"Ahmedabad",380024:"Ahmedabad",380025:"Ahmedabad",380026:"Ahmedabad",380027:"Ahmedabad",380028:"Ahmedabad",302001:"Jaipur",302002:"Jaipur",302003:"Jaipur",302004:"Jaipur",302005:"Jaipur",302006:"Jaipur",302007:"Jaipur",302008:"Jaipur",302009:"Jaipur",302010:"Jaipur",302011:"Jaipur",302012:"Jaipur",302013:"Jaipur",302015:"Jaipur",302016:"Jaipur",302017:"Jaipur",302018:"Jaipur",302019:"Jaipur",302020:"Jaipur",302021:"Jaipur",302022:"Jaipur",302023:"Jaipur",302026:"Jaipur",302027:"Jaipur",302028:"Jaipur",302029:"Jaipur",302030:"Jaipur",302031:"Jaipur",302033:"Jaipur",302034:"Jaipur",302036:"Jaipur",302037:"Jaipur",226001:"Lucknow",226002:"Lucknow",226003:"Lucknow",226004:"Lucknow",226005:"Lucknow",226006:"Lucknow",226007:"Lucknow",226008:"Lucknow",226009:"Lucknow",226010:"Lucknow",226011:"Lucknow",226012:"Lucknow",226013:"Lucknow",226014:"Lucknow",226015:"Lucknow",226016:"Lucknow",226017:"Lucknow",226018:"Lucknow",226019:"Lucknow",226020:"Lucknow",226021:"Lucknow",226022:"Lucknow",226023:"Lucknow",226024:"Lucknow",226025:"Lucknow",226026:"Lucknow",226028:"Lucknow",226029:"Lucknow",411001:"Pune",411002:"Pune",411003:"Pune",411004:"Pune",411005:"Pune",411006:"Pune",411007:"Pune",411008:"Pune",411009:"Pune",411010:"Pune",411011:"Pune",411012:"Pune",411013:"Pune",411014:"Pune",411015:"Pune",411016:"Pune",411017:"Pune",411018:"Pune",411019:"Pune",411020:"Pune",411021:"Pune",411022:"Pune",411023:"Pune",411024:"Pune",411025:"Pune",411026:"Pune",411027:"Pune",411028:"Pune",411029:"Pune",411030:"Pune",411031:"Pune",411032:"Pune",411033:"Pune",411034:"Pune",411035:"Pune",411036:"Pune",411037:"Pune",411038:"Pune",411039:"Pune",411040:"Pune",411041:"Pune",411042:"Pune",411043:"Pune",411044:"Pune",411045:"Pune",411046:"Pune",411047:"Pune",411048:"Pune",411049:"Pune",411051:"Pune",411052:"Pune",411053:"Pune",411057:"Pune",411058:"Pune",411060:"Pune",411061:"Pune",411062:"Pune",411067:"Pune",160001:"Chandigarh",160002:"Chandigarh",160003:"Chandigarh",160004:"Chandigarh",160005:"Chandigarh",160006:"Chandigarh",160007:"Chandigarh",160008:"Chandigarh",160009:"Chandigarh",160010:"Chandigarh",160011:"Chandigarh",160012:"Chandigarh",160014:"Chandigarh",160015:"Chandigarh",160016:"Chandigarh",160017:"Chandigarh",160018:"Chandigarh",160019:"Chandigarh",160020:"Chandigarh",160022:"Chandigarh",160023:"Chandigarh",160024:"Chandigarh",160025:"Chandigarh",160026:"Chandigarh",160028:"Chandigarh",160030:"Chandigarh",160031:"Chandigarh",160036:"Chandigarh",160047:"Chandigarh",160059:"Chandigarh",160061:"Chandigarh",160062:"Chandigarh",160071:"Chandigarh",440001:"Nagpur",440002:"Nagpur",440003:"Nagpur",440004:"Nagpur",440005:"Nagpur",440006:"Nagpur",440007:"Nagpur",440008:"Nagpur",440009:"Nagpur",440010:"Nagpur",440011:"Nagpur",440012:"Nagpur",440013:"Nagpur",440014:"Nagpur",440015:"Nagpur",440016:"Nagpur",440017:"Nagpur",440018:"Nagpur",440019:"Nagpur",440020:"Nagpur",440021:"Nagpur",440022:"Nagpur",440023:"Nagpur",440024:"Nagpur",440025:"Nagpur",440026:"Nagpur",440027:"Nagpur",440028:"Nagpur",440032:"Nagpur",440033:"Nagpur",440034:"Nagpur",440035:"Nagpur",440036:"Nagpur",440037:"Nagpur",530001:"Visakhapatnam",530002:"Visakhapatnam",530003:"Visakhapatnam",530004:"Visakhapatnam",530005:"Visakhapatnam",530006:"Visakhapatnam",530007:"Visakhapatnam",530008:"Visakhapatnam",530009:"Visakhapatnam",530010:"Visakhapatnam",530011:"Visakhapatnam",530012:"Visakhapatnam",530013:"Visakhapatnam",530014:"Visakhapatnam",530015:"Visakhapatnam",530016:"Visakhapatnam",530017:"Visakhapatnam",530018:"Visakhapatnam",530020:"Visakhapatnam",530022:"Visakhapatnam",530023:"Visakhapatnam",530024:"Visakhapatnam",530025:"Visakhapatnam",530026:"Visakhapatnam",530027:"Visakhapatnam",530028:"Visakhapatnam",530029:"Visakhapatnam",530031:"Visakhapatnam",530032:"Visakhapatnam",530040:"Visakhapatnam",530041:"Visakhapatnam",530043:"Visakhapatnam",530044:"Visakhapatnam",530045:"Visakhapatnam",530046:"Visakhapatnam",530047:"Visakhapatnam",530048:"Visakhapatnam",530049:"Visakhapatnam",530051:"Visakhapatnam"},dt=(l="")=>{const c=String(l||"").replace(/\D/g,"").trim();return c.length!==6?"":Wr[c]||""},_r=`
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

/* ══ SWIPE TO APPROVE ══════════════════════════════════════════════════════════ */
.review-swipe-root {
  display: flex; flex-direction: column; height: 100%;
  position: relative; overflow: hidden; touch-action: pan-y;
}
.swipe-hint-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px 4px;
  background: ${i.surface};
  border-bottom: 1px solid ${i.border};
}
.swipe-hint-side {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.62rem; font-weight: 700; color: ${i.mutedLight};
  letter-spacing: 0.05em;
  opacity: 0.7;
}
.swipe-action-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; opacity: 0;
  transition: opacity 0.15s;
  border-radius: 0;
}
.swipe-action-overlay.approve {
  background: linear-gradient(135deg, rgba(5,150,105,0.92), rgba(16,185,129,0.92));
}
.swipe-action-overlay.skip {
  background: linear-gradient(135deg, rgba(220,38,38,0.85), rgba(239,68,68,0.85));
}
.swipe-action-label {
  font-size: 1.6rem; font-weight: 900; color: white; letter-spacing: 0.04em;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}

/* ══ WEIGHT QUICK PICKS ══════════════════════════════════════════════════════ */
.weight-quick-picks {
  display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px;
}
.weight-chip {
  padding: 5px 11px; border-radius: 8px;
  border: 1.5px solid ${i.border};
  background: ${i.bg}; color: ${i.muted};
  font-size: 0.7rem; font-weight: 800; cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.15s; touch-action: manipulation;
}
.weight-chip:active { transform: scale(0.92); }
.weight-chip.active {
  background: ${i.primaryLight}; color: ${i.primary};
  border-color: rgba(29,78,216,0.3);
}

/* ══ FIELD STAGGER ANIMATION ═════════════════════════════════════════════════ */
@keyframes fieldSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.field-card-animated {
  animation: fieldSlideIn 0.28s ease-out both;
}
.field-card-animated:nth-child(1) { animation-delay: 0.04s; }
.field-card-animated:nth-child(2) { animation-delay: 0.09s; }
.field-card-animated:nth-child(3) { animation-delay: 0.14s; }
.field-card-animated:nth-child(4) { animation-delay: 0.19s; }
.field-card-animated:nth-child(5) { animation-delay: 0.24s; }
.field-card-animated:nth-child(6) { animation-delay: 0.29s; }

/* ══ COPY AWB ════════════════════════════════════════════════════════════════ */
.awb-copyable {
  cursor: pointer; position: relative;
  transition: opacity 0.15s;
  display: inline-flex; align-items: center; gap: 7px;
}
.awb-copyable:active { opacity: 0.6; }
.copy-flash {
  position: absolute; left: 50%; top: -28px;
  transform: translateX(-50%);
  background: rgba(5,150,105,0.92); color: white;
  font-size: 0.6rem; font-weight: 800; padding: 3px 10px;
  border-radius: 999px; white-space: nowrap;
  pointer-events: none; letter-spacing: 0.05em;
}

/* ══ HAPTIC RING on scan lock ════════════════════════════════════════════════ */
@keyframes lockRingExpand {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
.lock-ring-flash {
  position: fixed; top: 50%; left: 50%;
  width: 60px; height: 60px;
  border-radius: 50%;
  border: 3px solid #10B981;
  transform: translate(-50%, -50%);
  animation: lockRingExpand 0.55s ease-out forwards;
  pointer-events: none; z-index: 20;
}

/* ══ SESSION SUMMARY MODAL ═══════════════════════════════════════════════════ */
.session-modal-overlay {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(13,27,42,0.82); backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
}
.session-modal {
  background: ${i.surface}; border-radius: 24px 24px 0 0;
  width: 100%; max-width: 460px;
  padding: 20px 20px 36px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.2);
}
.session-modal-handle {
  width: 36px; height: 4px; border-radius: 999px;
  background: ${i.border}; margin: 0 auto 18px;
}
.session-summary-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; margin: 16px 0;
}
.session-summary-tile {
  background: ${i.bg}; border-radius: 14px;
  padding: 12px; text-align: center;
  border: 1px solid ${i.border};
}
.session-summary-num { font-size: 1.6rem; font-weight: 900; color: ${i.text}; }
.session-summary-lbl { font-size: 0.6rem; font-weight: 700; color: ${i.muted}; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 3px; }
`,Ra=l=>l>=.85?"high":l>=.55?"med":"low",ut=l=>`conf-dot conf-${Ra(l)}`,pt=l=>l==="learned"?{className:"source-badge source-learned",icon:"AI",text:"Learned"}:l==="awb_master"?{className:"source-badge source-ai",icon:"DB",text:"Lookup"}:l==="courier_api"?{className:"source-badge source-history",icon:"API",text:"Courier"}:l==="fuzzy_match"?{className:"source-badge source-ai",icon:"🔍",text:"Matched"}:l==="fuzzy_history"||l==="consignee_pattern"?{className:"source-badge source-history",icon:"📊",text:"History"}:l==="delhivery_pincode"||l==="india_post"||l==="pincode_lookup"||l==="indiapost_lookup"?{className:"source-badge source-pincode",icon:"📍",text:"Pincode"}:null,Gr=l=>{const c=Math.floor(l/6e4);return c<60?`${c}m`:`${Math.floor(c/60)}h ${c%60}m`};function Kr({standalone:l=!1}){var _t,Gt,Dn,Vt,qt,Ut,Ht,Kt,Jt,Yt,Qt,Xt,Zt,ea,na,ta,aa,ra,ia,sa,oa,ca;const{pin:c}=pr(),w=hr(),h=!!l,M=`${Ar}:${h?"direct":c||"unknown"}`,T=r.useMemo(()=>`${Rr}:${h?"direct":c||"unknown"}`,[h,c]),V=r.useMemo(()=>`${Dr}:${h?"direct":c||"unknown"}`,[h,c]),P=r.useMemo(()=>`mobile_scanner_daily_count:${new Date().toISOString().slice(0,10)}`,[]),$=r.useMemo(()=>{try{return typeof window>"u"?"":new URLSearchParams(window.location.search).get("mockBarcodeRaw")||""}catch{return""}},[]),C=r.useMemo(()=>{try{if(typeof window>"u")return!1;const e=new URLSearchParams(window.location.search);return e.get("mock")==="1"||e.get("e2e")==="1"}catch{return!1}},[]),[x,ne]=r.useState(null),[y,F]=r.useState("connecting"),[te,f]=r.useState(""),[I,Ge]=r.useState(o.IDLE),[E,ae]=r.useState(""),[U,oe]=r.useState(null),[,pe]=r.useState({}),[d,we]=r.useState(null),[g,W]=r.useState({}),[S,_]=r.useState(null),[Ce,X]=r.useState(null),[Ve,Be]=r.useState(""),[D,an]=r.useState([]),[ce,H]=r.useState(!1),[Z,J]=r.useState(0),[z,qe]=r.useState({ok:!1,issues:[],metrics:null}),[G,Ue]=r.useState({kb:0,width:0,height:0,quality:We}),[He,Ne]=r.useState(!1),[un,Me]=r.useState("0m"),[ht,Wn]=r.useState("Connected"),[rn,gt]=r.useState(""),[_n,Da]=r.useState(!1),[mt,Gn]=r.useState("idle"),[he,Ba]=r.useState(null),[Ma,Ta]=r.useState(0),[Vn,Fa]=r.useState(0),[ft,qn]=r.useState(null),[Te,Un]=r.useState("barcode"),[L,Hn]=r.useState(()=>{if(typeof window>"u")return"fast";try{const e=localStorage.getItem(Na);if(e==="fast"||e==="ocr")return e}catch(e){R("read workflow mode",e)}return C?"ocr":"fast"}),[ge,bt]=r.useState(()=>{if(typeof window>"u")return ye.phone;try{const e=localStorage.getItem(ka);if(e===ye.phone||e===ye.rugged)return e}catch(e){R("read device profile",e)}return ye.phone}),Kn=r.useRef(0),[k,Ke]=r.useState(()=>{const e={scannedAwbs:new Set,clientFreq:{},scanNumber:0,dominantClient:null,dominantClientCount:0,startedAt:Date.now(),scannedItems:[]};if(typeof window>"u")return e;try{const t=localStorage.getItem(T);if(!t)return e;const a=JSON.parse(t);if(!a||typeof a!="object")return e;const s=new Set(Array.isArray(a.scannedAwbs)?a.scannedAwbs.map(u=>De(u)).filter(Boolean):[]);return{...e,clientFreq:a.clientFreq&&typeof a.clientFreq=="object"?a.clientFreq:{},scanNumber:Number.isFinite(Number(a.scanNumber))?Number(a.scanNumber):0,dominantClient:De(a.dominantClient||"")||null,dominantClientCount:Number.isFinite(Number(a.dominantClientCount))?Number(a.dominantClientCount):0,startedAt:Number.isFinite(Number(a.startedAt))?Number(a.startedAt):e.startedAt,scannedItems:Array.isArray(a.scannedItems)?a.scannedItems:[],scannedAwbs:s}}catch(t){return R("hydrate session state",t),e}}),[me,pn]=r.useState(()=>{if(typeof window>"u")return"";try{return De(localStorage.getItem(V)||"")}catch(e){return R("read sticky client",e),""}}),[ke,xt]=r.useState(!1),[za,hn]=r.useState(""),[gn,mn]=r.useState(""),[Fe,fn]=r.useState(""),[B,wt]=r.useState(()=>{const e=new Date().toISOString().slice(0,10);try{const t=localStorage.getItem("seahawk_scanner_session_date");if(t&&_e.test(t)&&t===e)return t}catch(t){R("read session date",t)}return e}),ee=r.useRef(null),bn=r.useRef(null),ve=r.useRef(null),Se=r.useRef(null),je=r.useRef(!1),xn=r.useRef(null),Pa=r.useRef(!1),le=r.useRef(o.IDLE),Jn=r.useRef(null),de=r.useRef(null),sn=r.useRef(0),ze=r.useRef(null),wn=r.useRef(new Set),on=r.useRef([]),yn=r.useRef({awb:"",hits:0,lastSeenAt:0}),yt=r.useRef(0),cn=r.useRef(!1),Ct=r.useRef(0),Pe=r.useRef(null),$a=r.useRef(null),Yn=r.useRef({message:"",at:0}),fe=r.useRef({lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]}),Ie=r.useRef(null),Nt=r.useRef(null),kt=r.useRef({}),Cn=r.useRef(null),Nn=r.useRef(null),kn=r.useRef(null),vn=r.useRef(null),vt=r.useRef(null),Qn=r.useRef(0),[Je,Xn]=r.useState(0),St=r.useRef(null),[jt,La]=r.useState(""),[Oa,It]=r.useState(!1),[Wa,Sn]=r.useState(!1),[_a,Et]=r.useState(!1),p=r.useCallback(e=>{Ge(e)},[]),Y=r.useCallback(e=>{Kn.current=e,Ta(e)},[]),re=r.useCallback(e=>{yt.current=e,Fa(e)},[]),Zn=r.useCallback((e,t="warning")=>{if(!e)return;const a=Date.now();Yn.current.message===e&&a-Yn.current.at<zr||(Yn.current={message:e,at:a},f(e),t&&N(t))},[]),At=r.useCallback(e=>{Y(0),re(0),Un("document"),f(e||'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'),N("warning")},[Y,re]),jn=r.useCallback(()=>{const e=kr({currentAttempts:yt.current,maxReframeAttempts:Fn});if(e.action==="reframe"){re(e.attempts),Y(0),f(`No lock yet. Reframe ${e.attempts}/${Fn}: move closer, reduce glare, keep barcode horizontal.`),N("retry");return}At("No stable barcode lock after reframe retries. Capture label for OCR fallback.")},[At,Y,re]),Ga=r.useCallback(()=>{ae(""),f(""),p(o.CAPTURING)},[p]),Rt=r.useCallback(e=>{const t=Date.now(),a=Nr({samples:on.current,awb:e,now:t,stabilityWindowMs:Mr,requiredHits:Tr});return on.current=a.samples,yn.current={awb:e,hits:a.hits,lastSeenAt:t},a.isStable},[]),$e=r.useCallback(async()=>{var a;if(!Ea())throw new Error("Camera requires HTTPS (or localhost). Open this page over https:// on your phone.");if(!((a=navigator==null?void 0:navigator.mediaDevices)!=null&&a.getUserMedia))throw new Error("Camera not supported on this browser/device.");if(!ee.current)throw new Error("Camera element not ready.");const e=ee.current.srcObject;if(e&&typeof e.getTracks=="function"&&e.getTracks().some(u=>u.readyState==="live")){await ee.current.play();return}let t=null;try{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:"continuous"},{exposureMode:"continuous"}]}})}catch{t=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}}})}ee.current.srcObject=t,await ee.current.play()},[]);r.useEffect(()=>{const e=setInterval(()=>Me(Gr(Date.now()-k.startedAt)),3e4);return()=>clearInterval(e)},[k.startedAt]),r.useEffect(()=>{const e=()=>{const s=new Date,u=new Date(s);return u.setHours(24,0,0,0),u-s};let t;const a=()=>{t=setTimeout(()=>{const s=new Date().toISOString().slice(0,10);wt(s);try{localStorage.setItem("seahawk_scanner_session_date",s)}catch{}a()},e()+500)};return a(),()=>clearTimeout(t)},[]),r.useEffect(()=>{wn.current=k.scannedAwbs instanceof Set?k.scannedAwbs:new Set},[k.scannedAwbs]),r.useEffect(()=>{try{localStorage.setItem(T,JSON.stringify({scanNumber:Number(k.scanNumber||0),clientFreq:k.clientFreq||{},dominantClient:k.dominantClient||null,dominantClientCount:Number(k.dominantClientCount||0),startedAt:Number(k.startedAt||Date.now()),scannedItems:Array.isArray(k.scannedItems)?k.scannedItems:[],scannedAwbs:Array.from(k.scannedAwbs||[])}))}catch(e){R("persist session state",e)}},[k,T]),r.useEffect(()=>{try{me?localStorage.setItem(V,me):localStorage.removeItem(V)}catch(e){R("persist sticky client",e)}},[me,V]);const ln=r.useCallback(e=>{an(e);try{e.length?localStorage.setItem(M,JSON.stringify(e)):localStorage.removeItem(M)}catch(t){R("persist offline queue",t)}},[M]),Ye=r.useCallback(e=>{const t={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,queuedAt:Date.now(),payload:e};return ln([...D,t]),t},[D,ln]),Dt=r.useCallback(async e=>{if(String((e==null?void 0:e.scanMode)||"").toLowerCase()==="fast_barcode_only"){await xe.post("/shipments/scan",{awb:e.awb,courier:"AUTO",captureOnly:!0,sessionContext:e.sessionContext||{}});return}await xe.post("/shipments/scan-mobile",{awb:e.awb,imageBase64:e.imageBase64,focusImageBase64:e.focusImageBase64||e.imageBase64,sessionContext:e.sessionContext||{}})},[]),dn=r.useCallback(async()=>{var e;if(D.length){if(h){if(!navigator.onLine)return;const t=[];for(const a of D)if((e=a==null?void 0:a.payload)!=null&&e.awb)try{await Dt(a.payload)}catch{t.push(a)}ln(t),t.length?f(`Uploaded partially. ${t.length} scan(s) still queued.`):f("");return}!x||!x.connected||(D.forEach(t=>{var a;(a=t==null?void 0:t.payload)!=null&&a.awb&&x.emit("scanner:scan",t.payload)}),ln([]))}},[h,x,D,ln,Dt]),q=r.useCallback(e=>{Ke(t=>{const a={...e,awb:String((e==null?void 0:e.awb)||"").trim().toUpperCase(),queueId:(e==null?void 0:e.queueId)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:nn(e==null?void 0:e.date,B),time:(e==null?void 0:e.time)||Date.now()},s={...t,scannedItems:[a,...t.scannedItems]};try{localStorage.setItem(P,String(s.scanNumber))}catch(u){R("persist daily count",u)}return s})},[P,B]),Bt=r.useCallback((e,t="")=>{e&&(Ke(a=>{const s=a.scannedItems.filter(v=>v.queueId!==e),u=new Set(a.scannedAwbs),b=String(t||"").trim().toUpperCase();return b&&u.delete(b),wn.current=u,{...a,scannedItems:s,scannedAwbs:u}}),hn(a=>a===e?"":a))},[]),Va=r.useCallback(e=>{e!=null&&e.queueId&&(hn(e.queueId),mn(nn(e.date,B)))},[B]),qa=r.useCallback(()=>{hn(""),mn("")},[]),Ua=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const t=String(gn||"").trim();if(!_e.test(t)){window.alert("Please select a valid date.");return}fn(e.queueId);try{e.shipmentId&&await xe.put(`/shipments/${e.shipmentId}`,{date:t}),Ke(a=>({...a,scannedItems:a.scannedItems.map(s=>s.queueId===e.queueId?{...s,date:t}:s)})),hn(""),mn("")}catch(a){window.alert((a==null?void 0:a.message)||"Could not update consignment date.")}finally{fn("")}},[gn]),Ha=r.useCallback(async e=>{if(!(e!=null&&e.queueId))return;const t=String(e.awb||"").trim()||"this consignment",a=e.shipmentId?`Delete ${t}? This will remove it from accepted consignments and from the server.`:`Remove ${t} from accepted consignments?`;if(window.confirm(a)){fn(e.queueId);try{e.shipmentId&&await xe.delete(`/shipments/${e.shipmentId}`),Bt(e.queueId,e.awb)}catch(s){window.alert((s==null?void 0:s.message)||"Could not delete consignment.")}finally{fn("")}}},[Bt]);r.useEffect(()=>{Cn.current=q},[q]),r.useEffect(()=>{Nt.current=d},[d]),r.useEffect(()=>{kt.current=g},[g]);const Ka=r.useCallback(()=>{if(y!=="paired"){f(h?"Scanner is offline. Reconnect internet and retry.":"Phone is not connected to the desktop session.");return}if(f(""),C){p(o.SCANNING);return}$e().then(()=>p(o.SCANNING)).catch(e=>f((e==null?void 0:e.message)||"Camera access failed."))},[y,$e,p,C,h]),Ja=r.useCallback(e=>{var a;e==null||e.preventDefault();const t=rn.trim().toUpperCase();if(!t||t.length<6){f("Enter a valid AWB number (min 6 chars)");return}if(y!=="paired"){f(h?"Scanner is offline. Reconnect internet and retry.":"Not connected to desktop session.");return}if(f(""),gt(""),ae(t),C){Ne(!0),p(o.CAPTURING);return}if(L==="fast"){(a=Pe.current)==null||a.call(Pe,t);return}Ne(!0),p(o.CAPTURING)},[rn,y,p,C,h,L]),Ya=r.useCallback(()=>{if(window.confirm(h?"Exit this scanner session on the phone?":"End this mobile scanner session on the phone?")){try{localStorage.removeItem(T)}catch(e){R("clear session state on terminate",e)}if(h){w("/app/scan");return}x!=null&&x.connected?x.emit("scanner:end-session",{reason:"Mobile ended the session"}):w("/")}},[x,w,h,T]),Qa=r.useCallback(()=>{if(D.length>0){dn();return}window.alert(h?"No queued scans to upload.":"Everything is already synced.")},[D.length,dn,h]);r.useEffect(()=>{le.current=I},[I]);const Ee=r.useCallback((e=null)=>{e&&we(e),pe({}),f(""),p(o.CAPTURING)},[p]),Qe=r.useCallback(e=>{if(!e)return;const t=De(e.clientCode||""),a=De(me||t);we(e);const s=ue=>{const se=String(ue||"").trim().toUpperCase();return se==="UNKNOWN"||se==="N/A"||se==="NA"||se==="NONE"?"":String(ue||"").trim()},u=Re(e.courier||""),b=Pr(e.awb||E),v=u||b||"";La(b);const O=s(e.destination),m=e.pincode||"",K=!O&&m.length===6?dt(m):"";if(W({clientCode:a,consignee:s(e.consignee),destination:O||K,pincode:m,weight:e.weight||0,amount:e.amount||0,orderNo:e.orderNo||"",courier:v,date:e.date||B||new Date().toISOString().slice(0,10)}),pe({}),e.reviewRequired){N("review"),Pn(),p(o.REVIEWING);return}tn(),N("success"),ke&&lt(`Auto approved. ${e.clientName||""}. ${e.destination||""}.`);const j={awb:e.awb,clientCode:a||e.clientCode,clientName:e.clientName,destination:e.destination||"",weight:e.weight||0,autoApproved:!0,shipmentId:e.shipmentId||null,date:nn(e.date,B)};_(j),q(j),p(o.SUCCESS)},[q,p,ke,B,me]);r.useEffect(()=>{Nn.current=Ee},[Ee]),r.useEffect(()=>{kn.current=Qe},[Qe]),r.useEffect(()=>{if(C){F("paired"),Wn("Mock Mode"),f(""),p(o.IDLE);return}if(h){ne(null),F("paired"),Wn("Direct Mode"),f(""),p(o.IDLE);return}if(!c){f("No PIN provided.");return}const e=xr(Sr,{auth:{scannerPin:c},transports:["websocket","polling"],reconnection:!0,reconnectionDelay:1500,reconnectionAttempts:20});return e.on("connect",()=>F("connecting")),e.on("scanner:paired",({userEmail:t})=>{F("paired"),Wn(t?t.split("@")[0]:"Connected"),f("");const a=le.current;a===o.PROCESSING||a===o.REVIEWING||a===o.APPROVING||a===o.SUCCESS||p(o.IDLE)}),e.on("scanner:error",({message:t})=>{f(t),F("disconnected")}),e.on("scanner:session-ended",({reason:t})=>{F("disconnected"),f(t||"Session ended by desktop.");try{localStorage.removeItem(T)}catch(a){R("clear session state on end",a)}w("/")}),e.on("scanner:desktop-disconnected",({message:t})=>{F("paired"),f(t||"Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.")}),e.on("disconnect",()=>F("disconnected")),e.on("reconnect",()=>{const t=le.current;if(t===o.PROCESSING||t===o.REVIEWING||t===o.APPROVING||t===o.SUCCESS){F("paired");return}F("paired"),p(o.SCANNING)}),e.on("scanner:scan-processed",t=>{var s,u;const a=le.current;if(!(a!==o.PROCESSING&&a!==o.REVIEWING)){if(t.status==="error"){if(a!==o.PROCESSING)return;X("error"),Q(),N("error"),p(o.ERROR),f(t.error||"Scan failed on desktop.");return}if(t.status==="photo_required"||t.requiresImageCapture){(s=Nn.current)==null||s.call(Nn,t);return}(u=kn.current)==null||u.call(kn,t)}}),e.on("scanner:approval-result",({success:t,message:a,awb:s,shipmentId:u})=>{var O;clearTimeout(de.current),de.current=null;const b=Nt.current||{},v=kt.current||{};if(t){Pn(),N("success"),X("success");const m=De(v.clientCode||"");m&&pn(m==="MISC"?"":m),m&&m!=="MISC"&&Ke(j=>{var Ae,en;const ue={...j.clientFreq};ue[m]=(ue[m]||0)+1;const se=Object.entries(ue).sort((dr,ur)=>ur[1]-dr[1]);return{...j,clientFreq:ue,dominantClient:((Ae=se[0])==null?void 0:Ae[1])>=2?se[0][0]:null,dominantClientCount:((en=se[0])==null?void 0:en[1])||0}});const K={awb:(b==null?void 0:b.awb)||s,clientCode:v.clientCode,clientName:(b==null?void 0:b.clientName)||v.clientCode,destination:v.destination||"",weight:parseFloat(v.weight)||0,shipmentId:u||(b==null?void 0:b.shipmentId)||null,date:nn(v.date||(b==null?void 0:b.date),"")};_(K),(O=Cn.current)==null||O.call(Cn,K),p(o.SUCCESS);return}le.current===o.APPROVING&&(Q(),N("error"),f(a||"Approval failed. Please review and try again."),p(o.REVIEWING))}),e.on("scanner:ready-for-next",()=>{}),ne(e),()=>{e.disconnect()}},[c,p,w,C,h,T]),r.useEffect(()=>{if(C||h||!x||y!=="paired"||!x.connected)return;const e=()=>{x.emit("scanner:heartbeat",{},()=>{})};e();const t=setInterval(e,Br);return()=>clearInterval(t)},[x,y,C,h]),r.useEffect(()=>{try{const e=localStorage.getItem(M);if(!e)return;const t=JSON.parse(e);Array.isArray(t)&&t.length&&an(t)}catch(e){R("hydrate offline queue",e)}},[M]),r.useEffect(()=>{try{localStorage.setItem(Na,L)}catch(e){R("persist workflow mode",e)}},[L]),r.useEffect(()=>{try{localStorage.setItem(ka,ge)}catch(e){R("persist device profile",e)}},[ge]),r.useEffect(()=>{if(D.length){if(h){y==="paired"&&navigator.onLine&&dn();return}y==="paired"&&(x!=null&&x.connected)&&dn()}},[y,x,D.length,dn,h]);const Xe=r.useCallback(async()=>{var e;try{if(Ne(!1),Ie.current&&Ie.current.stop(),Se.current){try{const t=Se.current;t!=null&&t.barcodeScanner&&await t.barcodeScanner.dispose()}catch(t){R("dispose scanbot camera scanner",t)}Se.current=null}if(ve.current){try{await ve.current.reset()}catch(t){R("reset camera scanner",t)}ve.current=null}(e=ee.current)!=null&&e.srcObject&&(ee.current.srcObject.getTracks().forEach(t=>t.stop()),ee.current.srcObject=null)}catch(t){R("stopCamera",t)}},[]),Ze=r.useCallback(async()=>{try{if(Gn("idle"),Ie.current&&Ie.current.stop(),Se.current){try{await Se.current.barcodeScanner.dispose()}catch(e){R("dispose barcode scanner",e)}Se.current=null}if(ve.current){try{ve.current._type==="native"?ve.current.reset():await ve.current.reset()}catch(e){R("reset barcode scanner",e)}ve.current=null}}catch(e){R("stopBarcodeScanner",e)}},[]),Mt=r.useCallback(async()=>{if(ee.current){await Ze();try{sn.current=Date.now(),await $e(),Ie.current||(Ie.current=wr()),await Ie.current.start(ee.current,bn.current,{onDetected:(e,t)=>{var u;if(je.current)return;Y(0);const a=(t==null?void 0:t.format)||"unknown",s=(t==null?void 0:t.engine)||"unknown";Ba({value:e,format:a,engine:s,at:Date.now(),sinceStartMs:sn.current?Date.now()-sn.current:null,candidateCount:(t==null?void 0:t.candidateCount)||1,ambiguous:!1,alternatives:(t==null?void 0:t.alternatives)||[]}),Gn(s),(u=ze.current)==null||u.call(ze,e,{candidateCount:(t==null?void 0:t.candidateCount)||1,ambiguous:!1,alternatives:(t==null?void 0:t.alternatives)||[],format:a,engine:s})},onFail:()=>{const e=Kn.current+1;Y(e),e>=va&&jn()},onEngineReady:e=>{console.log(`[MobileScanner] Barcode engine ready: ${e}`),Gn(e)}})}catch(e){f("Camera access failed: "+e.message)}}},[$e,Ze,jn,Y]),Tt=r.useCallback((e,t={})=>{var b;const a=String(e||"").trim().replace(/\s+/g,"").toUpperCase(),s=yr(e)||a;if(je.current||le.current!==o.SCANNING)return;if(!s||s.length<8){a.replace(/[^A-Z0-9]/g,"").length>=4&&Zn("Partial barcode detected. Move closer so full AWB is visible.");return}if(t!=null&&t.ambiguous){const v=Kn.current+1;Y(v),Zn("Multiple barcodes detected. Keep only the AWB barcode inside the strip.","retry"),v>=va&&jn();return}if(!C&&!Rt(s))return;if(je.current=!0,wn.current.has(s)){N("duplicate"),Q(),Be(s),setTimeout(()=>{Be(""),je.current=!1,yn.current={awb:"",hits:0,lastSeenAt:0},on.current=[]},2500);return}clearTimeout(Jn.current),N("lock"),Pn(),Et(!0),ae(s);const u=sn.current?Date.now()-sn.current:null;if(qn(u),fe.current={lockTimeMs:u,candidateCount:Number((t==null?void 0:t.candidateCount)||1),ambiguous:!!(t!=null&&t.ambiguous),alternatives:Array.isArray(t==null?void 0:t.alternatives)?t.alternatives.slice(0,3):[]},re(0),Y(0),f(""),Ke(v=>{const O={...v,scanNumber:v.scanNumber+1};return O.scannedAwbs=new Set(v.scannedAwbs),O.scannedAwbs.add(s),wn.current=O.scannedAwbs,O}),L==="fast"){(b=Pe.current)==null||b.call(Pe,s);return}Ne(!0),p(o.CAPTURING)},[p,Rt,L,C,Y,re,Zn,jn]);r.useEffect(()=>{ze.current=Tt},[Tt]),r.useEffect(()=>{if(I===o.SCANNING&&(je.current=!1,yn.current={awb:"",hits:0,lastSeenAt:0},on.current=[],fe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},qn(null),re(0),Y(0),Un("barcode"),Mt(),C&&$)){const e=setTimeout(()=>{var t;le.current===o.SCANNING&&((t=ze.current)==null||t.call(ze,$))},50);return()=>clearTimeout(e)}return()=>{I===o.SCANNING&&Ze()}},[I,Mt,Ze,Y,re,C,$]);const Ft=r.useCallback(async()=>{if(C){Ne(!0);return}await Ze();try{await $e(),Ne(!0)}catch(e){f("Camera access failed: "+e.message)}},[$e,Ze,C]);r.useEffect(()=>{I===o.CAPTURING&&Ft()},[I,Ft]);const In=r.useCallback(()=>{const e=ee.current,t=bn.current;return Cr(e,t)},[]);r.useEffect(()=>{if(I!==o.CAPTURING){H(!1),J(0),qe({ok:!1,issues:[],metrics:null}),Pa.current=!1,cn.current=!1;return}const e=setInterval(()=>{const t=In();t&&(qe(t),H(t.ok),J(a=>{const s=t.ok?Math.min(a+1,8):0;return s>=ct&&!cn.current&&(N("tap"),cn.current=!0),t.ok||(cn.current=!1),s}))},280);return()=>clearInterval(e)},[I,In]);const zt=r.useCallback((e={})=>{const t=ee.current,a=bn.current;if(!t||!a||!t.videoWidth)return null;const s=Aa(t,a);if(!s)return null;const u=s.x,b=s.y,v=s.w,O=s.h;if(!v||!O)return null;const m=Math.max(640,Number(e.maxWidth||Sa)),K=Math.min(.85,Math.max(.55,Number(e.quality||We))),j=document.createElement("canvas");j.width=Math.min(m,Math.round(v)),j.height=Math.round(j.width/v*O),j.getContext("2d").drawImage(t,u,b,v,O,0,0,j.width,j.height);const Ae=j.toDataURL("image/jpeg",K).split(",")[1]||"";if(!Ae)return null;const en=Math.floor(Ae.length*3/4);return{base64:Ae,width:j.width,height:j.height,approxBytes:en,quality:K}},[]),Xa=r.useCallback(()=>{const e=Date.now();if(e-Ct.current<Fr)return;Ct.current=e;const t=In()||z;if(!(t!=null&&t.ok)||Z<ct){f(xa(t==null?void 0:t.issues)||"Capture quality is low. Hold steady and align the AWB in the frame."),N("warning"),Q();return}X("white"),Lr(),N("tap");const a=zt({maxWidth:Sa,quality:We});if(!(a!=null&&a.base64)){f("Could not capture image. Try again."),je.current=!1;return}Ue({kb:Math.round((a.approxBytes||0)/1024),width:a.width||0,height:a.height||0,quality:a.quality||We}),oe(`data:image/jpeg;base64,${a.base64}`),Xe(),p(o.PREVIEW)},[zt,Xe,p,In,z,Z]),Za=r.useCallback(()=>{if(!C)return;const e="data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl";Ue({kb:0,width:0,height:0,quality:We}),oe(e),Xe(),p(o.PREVIEW)},[p,C,Xe]),Le=r.useCallback(()=>{var e,t,a;return{scanNumber:k.scanNumber,recentClient:k.dominantClient,dominantClient:k.dominantClient,dominantClientCount:k.dominantClientCount,stickyClientCode:me||void 0,sessionDurationMin:Math.round((Date.now()-k.startedAt)/6e4),sessionDate:B,scanWorkflowMode:L,scanMode:Te,deviceProfile:ge,hardwareClass:ge===ye.rugged?"rugged":"phone",captureQuality:{ok:!!z.ok,issues:Array.isArray(z.issues)?z.issues.slice(0,8):[],metrics:z.metrics||null},captureMeta:{kb:G.kb||0,width:G.width||0,height:G.height||0,quality:G.quality||We},lockTimeMs:Number.isFinite(Number((e=fe.current)==null?void 0:e.lockTimeMs))?Number(fe.current.lockTimeMs):null,lockCandidateCount:Number.isFinite(Number((t=fe.current)==null?void 0:t.candidateCount))?Number(fe.current.candidateCount):1,lockAlternatives:Array.isArray((a=fe.current)==null?void 0:a.alternatives)?fe.current.alternatives.slice(0,3):[]}},[k,B,L,Te,ge,z,G,me]),Pt=r.useCallback(async e=>{var s,u;const t=String(e||"").trim().toUpperCase();if(!t)return;if(p(o.PROCESSING),C){setTimeout(()=>{const b={awb:t,clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:B};_(b),q(b),p(o.SUCCESS)},120);return}const a={awb:t,imageBase64:null,focusImageBase64:null,scanMode:"fast_barcode_only",sessionContext:Le()};if(h){if(!navigator.onLine){Ye(a),tn(),N("success");const b={awb:t,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:B};_({...b,offlineQueued:!0}),q(b),p(o.SUCCESS);return}try{const b=await xe.post("/shipments/scan",{awb:t,courier:"AUTO",captureOnly:!0,sessionContext:Le()}),v=((s=b==null?void 0:b.data)==null?void 0:s.shipment)||{},O={awb:v.awb||t,clientCode:v.clientCode||"MISC",clientName:((u=v.client)==null?void 0:u.company)||v.clientCode||"Scanned",destination:v.destination||"",weight:v.weight||0,shipmentId:v.id||null,date:nn(v.date,B)};_(O),q(O),tn(),N("success"),p(o.SUCCESS)}catch(b){f((b==null?void 0:b.message)||"Barcode processing failed. Please try again."),Q(),N("error"),p(o.ERROR)}return}if(!x||!x.connected||y!=="paired"){Ye(a),tn(),N("success");const b={awb:t,clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:B};_({...b,offlineQueued:!0}),q(b),p(o.SUCCESS);return}x.emit("scanner:scan",a),setTimeout(()=>{le.current===o.PROCESSING&&(f("Barcode processing timed out. Please try scanning again."),Q(),N("error"),p(o.ERROR))},jr)},[x,y,p,C,Ye,q,Le,h,B]);r.useEffect(()=>{Pe.current=Pt},[Pt]);const $t=r.useCallback(async e=>{const t=String(e||"").trim().toUpperCase();if(!t)return;if(p(o.PROCESSING),C){p(o.CAPTURING);return}const a={awb:t,scanMode:"lookup_first",sessionContext:Le()};if(h){if(!navigator.onLine){Ee({awb:t,status:"photo_required",requiresImageCapture:!0});return}try{const s=await xe.post("/shipments/scan-mobile",a),u=(s==null?void 0:s.data)||s;if(u.status==="error"||!u.success){X("error"),Q(),N("error"),p(o.ERROR),f(u.error||u.message||"Lookup failed.");return}if(u.status==="photo_required"||u.requiresImageCapture){Ee(u);return}Qe(u)}catch(s){f((s==null?void 0:s.message)||"Lookup failed. Please try again."),Q(),N("error"),p(o.ERROR)}return}if(!x||!x.connected||y!=="paired"){Ee({awb:t,status:"photo_required",requiresImageCapture:!0});return}x.emit("scanner:scan",a),setTimeout(()=>{le.current===o.PROCESSING&&(f("Lookup timed out. Capture the label photo and continue."),p(o.CAPTURING))},Ir)},[x,y,p,C,Le,h,Ee,Qe]);r.useEffect(()=>{$a.current=$t},[$t]);const er=r.useCallback(async()=>{if(!U)return;if(p(o.PROCESSING),C){setTimeout(()=>{const a={awb:E||"100454974120",clientCode:"MOCKCL",clientName:"Mock Client",destination:"Delhi",weight:1.25,date:B};_(a),q(a),p(o.SUCCESS)},250);return}const e=U.split(",")[1]||U,t={awb:E||"",imageBase64:e,focusImageBase64:e,scanMode:"ocr_label",sessionContext:Le()};if(h){if(!navigator.onLine){Ye(t),tn(),N("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:B};_({...a,offlineQueued:!0}),q(a),p(o.SUCCESS);return}try{const a=await xe.post("/shipments/scan-mobile",t),s=(a==null?void 0:a.data)||a;if(s.status==="error"||!s.success){X("error"),Q(),N("error"),p(o.ERROR),f(s.error||s.message||"Scan failed.");return}if(s.status==="photo_required"||s.requiresImageCapture){Ee(s);return}Qe(s)}catch(a){f((a==null?void 0:a.message)||"Server error. Please try again."),Q(),N("error"),p(o.ERROR)}return}if(!x||!x.connected||y!=="paired"){Ye(t),tn(),N("success");const a={awb:E||"PENDING_OCR",clientCode:"OFFLINE",clientName:"Queued Offline",destination:"",weight:0,date:B};_({...a,offlineQueued:!0}),q(a),p(o.SUCCESS);return}x.emit("scanner:scan",t),setTimeout(()=>{le.current===o.PROCESSING&&(f("OCR timed out after 40 seconds. Retake the label photo and try again."),Q(),N("error"),p(o.ERROR))},4e4)},[x,E,U,p,y,Ye,q,C,Le,h,Qe,Ee,B]),et=r.useCallback(async()=>{var v,O;if(!d)return;p(o.APPROVING);let e=!1;const t=g.date||B||new Date().toISOString().slice(0,10);if(C){setTimeout(()=>{const m={awb:d.awb||E,clientCode:g.clientCode||"MOCKCL",clientName:d.clientName||g.clientCode||"Mock Client",destination:g.destination||"",weight:parseFloat(g.weight)||0,shipmentId:d.shipmentId||null,date:t};_(m),q(m),X("success"),e=!0,p(o.SUCCESS)},200);return}const a={clientCode:d.clientCode||"",clientName:d.clientName||"",consignee:d.consignee||"",destination:d.destination||""},s={clientCode:g.clientCode||"",clientName:g.clientCode||"",consignee:g.consignee||"",destination:g.destination||""},u={clientCode:g.clientCode,consignee:g.consignee,destination:g.destination,pincode:g.pincode,weight:parseFloat(g.weight)||0,amount:parseFloat(g.amount)||0,orderNo:g.orderNo||"",courier:g.courier||"",date:t};if(h)try{(d.ocrExtracted||d)&&await xe.post("/shipments/learn-corrections",{ocrFields:a,approvedFields:s});let m=null;if(d.shipmentId){const j=await xe.put(`/shipments/${d.shipmentId}`,u);m=(j==null?void 0:j.data)||null}else{const j=await xe.post("/shipments",{awb:d.awb||E,...u});m=(j==null?void 0:j.data)||null}Pn(),N("success"),X("success");const K={awb:(m==null?void 0:m.awb)||(d==null?void 0:d.awb)||E,clientCode:(m==null?void 0:m.clientCode)||g.clientCode,clientName:(d==null?void 0:d.clientName)||((v=m==null?void 0:m.client)==null?void 0:v.company)||g.clientCode,destination:(m==null?void 0:m.destination)||g.destination||"",weight:parseFloat((m==null?void 0:m.weight)??g.weight)||0,shipmentId:(m==null?void 0:m.id)||(d==null?void 0:d.shipmentId)||null,date:nn(m==null?void 0:m.date,t)};_(K),q(K),e=!0,p(o.SUCCESS)}catch(m){p(o.REVIEWING),Q(),N("error"),f((m==null?void 0:m.message)||"Approval failed.")}else{if(!x){p(o.REVIEWING),f("Not connected to desktop session.");return}(d.ocrExtracted||d)&&x.emit("scanner:learn-corrections",{pin:c,ocrFields:a,approvedFields:s,courier:(d==null?void 0:d.courier)||((O=d==null?void 0:d.ocrExtracted)==null?void 0:O.courier)||"",deviceProfile:ge}),x.emit("scanner:approval-submit",{shipmentId:d.shipmentId,awb:d.awb||E,fields:u},m=>{m!=null&&m.success||(clearTimeout(de.current),de.current=null,p(o.REVIEWING),Q(),N("error"),f((m==null?void 0:m.message)||"Approval failed."))}),clearTimeout(de.current),de.current=setTimeout(()=>{le.current===o.APPROVING&&(Q(),N("error"),f("Save confirmation timed out. Please tap Approve & Save again."),p(o.REVIEWING))},Er)}const b=De(g.clientCode||"");e&&b&&pn(b==="MISC"?"":b),e&&b&&b!=="MISC"&&Ke(m=>{var ue,se;const K={...m.clientFreq};K[b]=(K[b]||0)+1;const j=Object.entries(K).sort((Ae,en)=>en[1]-Ae[1]);return{...m,clientFreq:K,dominantClient:((ue=j[0])==null?void 0:ue[1])>=2?j[0][0]:null,dominantClientCount:((se=j[0])==null?void 0:se[1])||0}})},[x,d,g,E,c,p,q,C,ge,h,B]),Oe=r.useCallback((e=o.IDLE)=>{clearTimeout(xn.current),clearTimeout(Jn.current),clearTimeout(de.current),de.current=null,ae(""),oe(null),Ue({kb:0,width:0,height:0,quality:We}),we(null),W({}),pe({}),_(null),qn(null),f(""),Be(""),H(!1),J(0),qe({ok:!1,issues:[],metrics:null}),je.current=!1,yn.current={awb:"",hits:0,lastSeenAt:0},on.current=[],fe.current={lockTimeMs:null,candidateCount:1,ambiguous:!1,alternatives:[]},cn.current=!1,re(0),p(e)},[p,re]);r.useEffect(()=>{if(I===o.SUCCESS){const e=L==="fast"?o.SCANNING:o.IDLE,t=L==="fast"?Ca:ya;return xn.current=setTimeout(()=>Oe(e),t),()=>clearTimeout(xn.current)}},[I,Oe,L]),r.useEffect(()=>{if(ke)if(I===o.REVIEWING&&d){const e=[d.clientName||d.clientCode,d.destination,d.weight?`${d.weight} kilograms`:""].filter(Boolean);e.length&&lt(e.join(". "))}else I===o.SUCCESS&&S&&lt(`${S.clientName||S.clientCode||"Shipment"} Verified.`)},[ke,I,d,S]),r.useEffect(()=>()=>{Xe(),clearTimeout(xn.current),clearTimeout(Jn.current),clearTimeout(de.current)},[Xe]);const be=e=>`msp-step ${I===e?"active":""}`,nr=Math.max(1,Math.round((L==="fast"?Ca:ya)/1e3)),tr=z.ok?"AWB quality looks good - press shutter":xa(z.issues)||"Fit AWB slip fully in frame and hold steady",Lt=He&&z.ok&&Z>=ct,ie=r.useMemo(()=>{if(!d)return{};const e=d.ocrExtracted||d;return{clientCode:{confidence:(e==null?void 0:e.clientNameConfidence)||0,source:(e==null?void 0:e.clientNameSource)||null},consignee:{confidence:(e==null?void 0:e.consigneeConfidence)||0,source:(e==null?void 0:e.consigneeSource)||null},destination:{confidence:(e==null?void 0:e.destinationConfidence)||0,source:(e==null?void 0:e.destinationSource)||null},pincode:{confidence:(e==null?void 0:e.pincodeConfidence)||0,source:(e==null?void 0:e.pincodeSource)||null},weight:{confidence:(e==null?void 0:e.weightConfidence)||0,source:(e==null?void 0:e.weightSource)||null}}},[d]),ar=r.useCallback(async e=>{if(e)try{await navigator.clipboard.writeText(e),It(!0),N("tap"),setTimeout(()=>It(!1),1800)}catch{}},[]),rr=r.useCallback(()=>{W(e=>{const t=Re(e.courier||(d==null?void 0:d.courier)||""),a=zn.findIndex(u=>u.toUpperCase()===t.toUpperCase()),s=zn[(a+1+zn.length)%zn.length];return{...e,courier:s}})},[d]),ir=r.useCallback(e=>{const t=e.touches[0];vn.current=t.clientX,vt.current=t.clientY,Qn.current=0,Xn(0)},[]),sr=r.useCallback(e=>{if(vn.current===null)return;const t=e.touches[0],a=t.clientX-vn.current,s=t.clientY-vt.current;if(Math.abs(s)>Math.abs(a)*1.4)return;Qn.current=a;const u=Math.max(-1,Math.min(1,a/140));cancelAnimationFrame(St.current),St.current=requestAnimationFrame(()=>Xn(u))},[]),or=r.useCallback(()=>{const e=Qn.current;vn.current=null,Xn(0),e>110?(N("success"),et()):e<-110&&(N("warning"),h?w("/scan-mobile"):Oe())},[et,Oe,h,w]),En=r.useMemo(()=>{const e=Object.values(ie).map(u=>Number((u==null?void 0:u.confidence)||0)).filter(u=>u>0),t=e.length?e.reduce((u,b)=>u+b,0)/e.length:0,a=Ra(t);return{score:t,level:a,label:a==="high"?"High Confidence":a==="med"?"Medium Confidence":"Low Confidence"}},[ie]),An=Re(g.courier||(d==null?void 0:d.courier)||((_t=d==null?void 0:d.ocrExtracted)==null?void 0:_t.courier)||""),Ot=g.date||(d==null?void 0:d.date)||B||"",cr=r.useMemo(()=>ja(Ot),[Ot]),Rn=k.scannedItems.reduce((e,t)=>e+(t.weight||0),0),A=((Gt=d==null?void 0:d.ocrExtracted)==null?void 0:Gt.intelligence)||(d==null?void 0:d.intelligence)||null,Wt=(qt=(Vt=(Dn=Ie.current)==null?void 0:Dn.getDiagnostics)==null?void 0:Vt.call(Dn))==null?void 0:qt.wasmFailReason,lr=[["Step",I],["Connection",y],["Engine",mt],...Wt?[["WASM Error",Wt]]:[],["Workflow",L],["Device",ge],["Scan mode",Te],["Fail count",String(Ma)],["Reframe retries",`${Vn}/${Fn}`],["Camera",He?"ready":"waiting"],["Doc detect",ce?`yes (${Z})`:"no"],["Capture quality",z.ok?"good":z.issues.join(", ")||"pending"],["Capture metrics",z.metrics?`blur ${z.metrics.blurScore} | glare ${z.metrics.glareRatio}% | skew ${z.metrics.perspectiveSkew}%`:"-"],["JPEG last shot",G.kb?`${G.kb}KB ${G.width}x${G.height} q=${G.quality}`:"-"],["Secure ctx",Ea()?"yes":"no"],["AWB lock",E||"-"],["Lock ms",ft!=null?String(ft):"-"],["Lock candidates",String(((Ut=fe.current)==null?void 0:Ut.candidateCount)||1)],["Queued",String(D.length)],["Scans",String(k.scanNumber)],["Last format",(he==null?void 0:he.format)||"-"],["Last code",(he==null?void 0:he.value)||"-"],["Decode ms",(he==null?void 0:he.sinceStartMs)!=null?String(he.sinceStartMs):"-"],["False-lock",(Ht=d==null?void 0:d.scanTelemetry)!=null&&Ht.falseLock?"yes":"no"]];return n.jsxs(n.Fragment,{children:[n.jsx("style",{children:_r}),n.jsxs("div",{className:"msp-root",children:[Ce&&n.jsx("div",{className:`flash-overlay flash-${Ce}`,onAnimationEnd:()=>X(null)}),Ve&&n.jsxs("div",{style:{position:"fixed",inset:0,zIndex:60,background:"rgba(220,38,38,0.9)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12},className:"shake",children:[n.jsx(la,{size:48,color:"white"}),n.jsx("div",{style:{color:"white",fontSize:"1.1rem",fontWeight:700,textAlign:"center"},children:"DUPLICATE AWB"}),n.jsx("div",{className:"mono",style:{color:"rgba(255,255,255,0.9)",fontSize:"1.3rem",fontWeight:700},children:Ve}),n.jsx("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"0.8rem"},children:"Already scanned in this session"})]}),n.jsx("button",{type:"button","data-testid":"scanner-diag-toggle",onClick:()=>Da(e=>!e),style:{position:"fixed",top:12,right:12,zIndex:70,border:"1px solid rgba(255,255,255,0.18)",background:_n?"rgba(79,70,229,0.92)":"rgba(15,23,42,0.72)",color:"#fff",borderRadius:999,padding:"8px 12px",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.04em",backdropFilter:"blur(10px)",cursor:"pointer"},children:_n?"Hide Diag":"Show Diag"}),_n&&n.jsxs("div",{"data-testid":"scanner-diag-panel",style:{position:"fixed",top:56,right:12,zIndex:69,width:"min(92vw, 320px)",background:"rgba(15,23,42,0.88)",color:"#E5EEF8",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:14,backdropFilter:"blur(14px)",boxShadow:"0 12px 30px rgba(0,0,0,0.25)"},children:[n.jsx("div",{style:{fontSize:"0.72rem",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,color:"#A5B4FC"},children:"Scanner Diagnostics"}),n.jsx("div",{style:{display:"grid",gap:6},children:lr.map(([e,t])=>n.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"space-between",alignItems:"flex-start",fontSize:"0.76rem"},children:[n.jsx("div",{style:{color:"rgba(226,232,240,0.72)",minWidth:88},children:e}),n.jsx("div",{className:"mono",style:{textAlign:"right",wordBreak:"break-word",maxWidth:180},children:t})]},e))}),n.jsx("div",{style:{marginTop:10,fontSize:"0.68rem",color:"rgba(226,232,240,0.7)",lineHeight:1.4},children:"Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start."})]}),y!=="paired"&&n.jsx("div",{className:be(o.IDLE),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},children:[n.jsx("div",{style:{width:64,height:64,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:y==="connecting"?n.jsx(Bn,{size:28,color:i.primary,style:{animation:"spin 1s linear infinite"}}):n.jsx(nt,{size:28,color:i.error})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.1rem",fontWeight:700,marginBottom:4},children:y==="connecting"?"Connecting...":"Disconnected"}),n.jsx("div",{style:{fontSize:"0.82rem",color:i.muted},children:te||(h?"Preparing direct scanner session":`Connecting to session ${c}`)})]}),y==="disconnected"&&n.jsxs("button",{className:"btn btn-primary",onClick:()=>window.location.reload(),children:[n.jsx(Bn,{size:16})," Reconnect"]})]})}),n.jsx("video",{ref:ee,autoPlay:!0,playsInline:!0,muted:!0,onClick:()=>{$e().catch(e=>{f((e==null?void 0:e.message)||"Camera access failed.")})},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,display:(I===o.SCANNING||I===o.CAPTURING)&&!Se.current?"block":"none"}}),n.jsx("div",{className:be(o.IDLE),children:n.jsxs("div",{className:"home-root",children:[n.jsxs("div",{className:"home-hero",children:[n.jsxs("div",{className:"home-hero-top",children:[n.jsxs("div",{className:"home-brand",children:[n.jsx("div",{className:"home-brand-logo",children:n.jsx("img",{src:"/images/logo.png",alt:"Sea Hawk",style:{width:26,height:26,objectFit:"contain"}})}),n.jsxs("div",{children:[n.jsx("div",{className:"home-brand-name",children:"Sea Hawk Scanner"}),n.jsx("div",{className:"home-brand-tagline",children:"Courier Management"})]})]}),n.jsxs("div",{className:`home-conn-pill ${y==="paired"?"connected":""}`,children:[y==="paired"?n.jsx(da,{size:11}):n.jsx(nt,{size:11}),y==="paired"?"Live":y==="connecting"?"Connecting...":"Offline"]})]}),n.jsxs("div",{className:"home-stats-band",children:[n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:k.scanNumber}),n.jsx("div",{className:"home-stat-lbl",children:"Scanned"})]}),n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:Rn>0?Rn.toFixed(1):"0"}),n.jsx("div",{className:"home-stat-lbl",children:"Total kg"})]}),n.jsxs("div",{className:"home-stat-tile",children:[n.jsx("div",{className:"home-stat-num",children:un}),n.jsx("div",{className:"home-stat-lbl",children:"Session"})]})]}),n.jsxs("div",{className:"home-date-tile",children:[n.jsx(tt,{size:18,color:"#60A5FA"}),n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"home-date-lbl",children:"Scan Date"}),n.jsxs("div",{className:"home-date-val",children:[new Date(B+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),B===new Date().toISOString().slice(0,10)&&n.jsx("span",{className:"home-date-today-badge",children:"TODAY"})]})]}),n.jsx("div",{className:"home-date-change",children:"Change ▸"}),n.jsx("input",{type:"date",value:B,max:new Date().toISOString().slice(0,10),onChange:e=>{const t=e.target.value;if(t&&_e.test(t)){wt(t);try{localStorage.setItem("seahawk_scanner_session_date",t)}catch(a){R("persist session date",a)}N("tap")}}})]})]}),n.jsxs("div",{className:"home-scan-zone",children:[n.jsxs("div",{className:"home-scan-btn-wrap",children:[n.jsx("div",{className:"home-scan-ring"}),n.jsx("div",{className:"home-scan-ring home-scan-ring2"}),n.jsxs("button",{"data-testid":"start-scan-btn",className:"home-scan-btn",onClick:Ka,children:[n.jsx(at,{size:36,color:"white"}),n.jsx("span",{className:"home-scan-btn-lbl",children:"Scan"})]})]}),n.jsx("div",{className:"home-cta",children:k.scanNumber===0?"Tap to scan your first parcel":"Ready — tap to scan next parcel"}),n.jsxs("div",{className:"mode-toggle-row",children:[n.jsxs("button",{type:"button","data-testid":"workflow-fast-btn",className:`mode-pill ${L==="fast"?"active":""}`,onClick:()=>Hn("fast"),children:[n.jsx(ua,{size:13})," Fast scan"]}),n.jsxs("button",{type:"button","data-testid":"workflow-ocr-btn",className:`mode-pill ${L==="ocr"?"active":""}`,onClick:()=>Hn("ocr"),children:[n.jsx(rt,{size:13})," OCR label"]})]}),n.jsxs("div",{className:"mode-toggle-row",style:{marginTop:7},children:[n.jsxs("button",{type:"button","data-testid":"device-profile-phone-btn",className:`mode-pill ${ge===ye.phone?"active":""}`,onClick:()=>bt(ye.phone),children:[n.jsx(at,{size:13})," Phone lens"]}),n.jsxs("button",{type:"button","data-testid":"device-profile-rugged-btn",className:`mode-pill ${ge===ye.rugged?"active":""}`,onClick:()=>bt(ye.rugged),children:[n.jsx(pa,{size:13})," Rugged"]})]}),n.jsxs("div",{style:{width:"100%",maxWidth:320,marginTop:14},children:[n.jsx("div",{style:{fontSize:"0.6rem",fontWeight:700,color:i.mutedLight,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7,textAlign:"center"},children:"Can't scan? Enter AWB manually"}),n.jsxs("div",{className:"manual-awb-row",children:[n.jsx("input",{"data-testid":"manual-awb-input",className:"manual-awb-input",value:rn,onChange:e=>gt(e.target.value.toUpperCase()),placeholder:"e.g. Z67086879",inputMode:"text",autoCapitalize:"characters",onFocus:e=>e.target.style.borderColor=i.primary,onBlur:e=>e.target.style.borderColor=i.border}),n.jsx("button",{type:"button","data-testid":"manual-awb-submit",disabled:rn.trim().length<6,className:"btn btn-primary",style:{padding:"10px 16px",fontSize:"0.8rem",borderRadius:12,opacity:rn.trim().length>=6?1:.42},onClick:Ja,children:"Go →"})]})]}),n.jsxs("div",{className:"action-strip",children:[n.jsxs("button",{className:`action-tile ${D.length>0?"upload-active":""}`,onClick:Qa,children:[n.jsx(gr,{size:14})," ",D.length>0?`Upload (${D.length})`:"Synced"]}),n.jsxs("button",{className:"action-tile",onClick:()=>xt(e=>!e),children:[ke?n.jsx(ha,{size:14}):n.jsx(ga,{size:14})," Voice ",ke?"On":"Off"]}),n.jsxs("button",{className:"action-tile danger",onClick:()=>Sn(!0),children:[n.jsx(it,{size:14})," End"]})]}),D.length>0&&n.jsxs("div",{style:{marginTop:10,fontSize:"0.7rem",color:i.warning,fontWeight:700,display:"flex",alignItems:"center",gap:5},children:[n.jsx(ma,{size:12})," ",D.length," pending sync"]})]}),n.jsxs("div",{className:"home-manifest",children:[n.jsxs("div",{className:"manifest-head",children:[n.jsxs("div",{className:"manifest-title",children:[n.jsx(mr,{size:11})," Accepted Consignments"]}),k.scannedItems.length>0&&n.jsx("div",{className:"manifest-count",children:k.scannedItems.length})]}),k.scannedItems.length>0&&(()=>{const e={};return k.scannedItems.forEach(t=>{const a=Re(t.courier||"");a&&(e[a]=(e[a]||0)+1)}),Object.keys(e).length>0?n.jsx("div",{className:"manifest-courier-bar",children:Object.entries(e).map(([t,a])=>{const s=$n(t);return n.jsxs("span",{className:"courier-chip",style:{background:s.light,color:s.bg,border:`1px solid ${s.bg}22`},children:[t," ",a]},t)})}):null})(),n.jsx("div",{className:"manifest-list",children:k.scannedItems.length===0?n.jsxs("div",{className:"manifest-empty",children:[n.jsx("div",{className:"manifest-empty-icon",children:n.jsx(Mn,{size:28,color:i.mutedLight})}),n.jsxs("div",{className:"manifest-empty-text",children:["No consignments yet.",n.jsx("br",{}),"Tap the scan button above to begin."]})]}):k.scannedItems.map((e,t)=>{const a=$n(Re(e.courier||""));return n.jsxs("div",{className:"manifest-item",children:[n.jsx("div",{className:"manifest-item-icon",style:{background:a.light,color:a.bg},children:Re(e.courier||"")||"PKG"}),n.jsxs("div",{className:"manifest-main",children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[n.jsx("div",{className:"manifest-awb",children:e.awb}),e.weight>0&&n.jsxs("div",{className:"manifest-weight",children:[e.weight,"kg"]})]}),n.jsxs("div",{className:"manifest-meta",children:[e.clientCode==="OFFLINE"?n.jsx("span",{className:"manifest-tag",style:{background:i.warningLight,color:i.warning},children:"Offline"}):e.clientCode&&n.jsx("span",{className:"manifest-tag",style:{background:i.primaryLight,color:i.primary},children:e.clientCode}),e.consignee&&n.jsx("span",{children:e.consignee}),e.destination&&n.jsxs("span",{children:["→ ",e.destination]}),e.date&&n.jsx("span",{className:"manifest-tag",style:{background:"#EFF6FF",color:"#1D4ED8"},children:ja(e.date)})]}),za===e.queueId?n.jsxs("div",{style:{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginTop:6},children:[n.jsx("input",{type:"date",className:"queue-date-input",value:gn,max:new Date().toISOString().slice(0,10),onChange:s=>mn(s.target.value),disabled:Fe===e.queueId}),n.jsx("button",{type:"button",className:"manifest-action-btn primary",onClick:()=>Ua(e),disabled:Fe===e.queueId||!_e.test(gn),children:Fe===e.queueId?"Saving...":"Save"}),n.jsx("button",{type:"button",className:"manifest-action-btn",onClick:qa,disabled:Fe===e.queueId,children:"Cancel"})]}):n.jsxs("div",{className:"manifest-actions",children:[n.jsxs("button",{type:"button",className:"manifest-action-btn",onClick:()=>Va(e),disabled:Fe===e.queueId,children:[n.jsx(tt,{size:11})," Date"]}),n.jsxs("button",{type:"button",className:"manifest-action-btn danger",onClick:()=>Ha(e),disabled:Fe===e.queueId,children:[n.jsx(it,{size:11})," ",Fe===e.queueId?"Removing...":"Remove"]})]})]})]},e.queueId||`${e.awb}-${t}`)})})]})]})}),n.jsx("div",{className:be(o.SCANNING),children:n.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[n.jsx("div",{id:"scanbot-camera-container",style:{position:"absolute",inset:0,display:Se.current?"block":"none"}}),n.jsx("div",{className:"cam-overlay",children:n.jsxs("div",{className:"scan-guide",style:Te==="barcode"?{width:wa.w,height:wa.h,borderRadius:10,maxHeight:"20vw",transition:"all 0.4s ease",borderColor:te?"rgba(248,113,113,0.92)":void 0,boxShadow:te?"0 0 0 3px rgba(248,113,113,0.2)":void 0}:{width:Tn.w,height:Tn.h,borderRadius:14,maxHeight:"75vh",transition:"all 0.4s ease",borderColor:"rgba(251,191,36,0.85)",boxShadow:"0 0 0 3px rgba(251,191,36,0.2)"},children:[n.jsx("div",{className:"scan-guide-corner corner-tl"}),n.jsx("div",{className:"scan-guide-corner corner-tr"}),n.jsx("div",{className:"scan-guide-corner corner-bl"}),n.jsx("div",{className:"scan-guide-corner corner-br"}),Te==="barcode"&&n.jsx("div",{className:"scan-laser",children:n.jsx("div",{className:"scan-laser-spark"})})]})}),n.jsxs("div",{className:"cam-hud",children:[n.jsxs("div",{className:"cam-hud-chip",children:[n.jsx(da,{size:12})," ",h?"DIRECT":c]}),n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[Te==="document"&&n.jsxs("div",{className:"cam-hud-chip",style:{background:"rgba(251,191,36,0.22)",color:"#FDE68A",fontWeight:700,fontSize:"0.65rem",gap:4},children:[n.jsx(fa,{size:11})," LABEL MODE"]}),n.jsxs("div",{className:"cam-hud-chip",style:{gap:4},children:[n.jsx(Mn,{size:12})," ",k.scanNumber,mt==="native"?n.jsx("span",{style:{color:"#34D399",fontSize:"0.6rem",fontWeight:800},children:"⚡ NATIVE"}):n.jsx("span",{style:{color:"#F59E0B",fontSize:"0.6rem",fontWeight:800},children:"ZXING"})]})]})]}),n.jsxs("div",{className:"cam-bottom",children:[Te==="barcode"?n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6,color:"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center"},children:[n.jsx("div",{children:L==="fast"?"Align barcode inside the strip - auto-save on lock":"Align barcode inside the strip - camera opens for label capture after lock"}),Vn>0&&n.jsxs("div",{style:{color:"#FDE68A",fontSize:"0.74rem",fontWeight:700},children:["Reframe retry ",Vn,"/",Fn]}),!!te&&n.jsx("div",{style:{color:"#FCA5A5",fontSize:"0.72rem",fontWeight:700},children:te})]}):n.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:6},children:[n.jsx("div",{style:{color:"rgba(251,191,36,0.95)",fontSize:"0.82rem",fontWeight:700,textAlign:"center"},children:"No barcode found - capture the label and we will read the printed AWB"}),n.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"},children:[n.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:Ga,children:"Capture label instead"}),n.jsx("button",{className:"cam-hud-chip",style:{border:"none",cursor:"pointer",fontSize:"0.7rem",fontWeight:700},onClick:()=>{Y(0),re(0),f(""),Un("barcode"),N("tap")},children:"Back to barcode mode"})]})]}),n.jsxs("div",{style:{display:"flex",gap:12},children:[n.jsxs("button",{className:"cam-hud-chip",onClick:()=>Hn(e=>e==="fast"?"ocr":"fast"),style:{border:"none",cursor:"pointer",gap:5},children:[L==="fast"?n.jsx(ua,{size:13}):n.jsx(rt,{size:13}),L==="fast"?"FAST":"OCR"]}),n.jsx("button",{className:"cam-hud-chip",onClick:()=>xt(!ke),style:{border:"none",cursor:"pointer"},children:ke?n.jsx(ha,{size:14}):n.jsx(ga,{size:14})})]})]})]})}),n.jsx("div",{className:be(o.CAPTURING),children:n.jsxs("div",{className:"cam-viewport",style:{background:"transparent"},children:[!He&&n.jsxs("div",{style:{position:"absolute",inset:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"rgba(15,23,42,0.82)",backdropFilter:"blur(4px)",color:"white"},children:[n.jsx(fr,{size:44,color:"#34D399"}),n.jsx("div",{className:"mono",style:{fontSize:"1.4rem",fontWeight:700,color:"#34D399"},children:E||"OCR fallback"}),n.jsx("div",{style:{color:"rgba(255,255,255,0.72)",fontSize:"0.8rem"},children:E?"Barcode locked - Preparing camera...":"Preparing label capture for printed AWB OCR..."})]}),n.jsx("div",{className:"cam-overlay",children:n.jsxs("div",{ref:bn,className:`scan-guide ${ce?"detected":""}`,style:{width:Tn.w,height:Tn.h,maxHeight:"75vh",borderRadius:12},children:[n.jsx("div",{className:"scan-guide-corner corner-tl"}),n.jsx("div",{className:"scan-guide-corner corner-tr"}),n.jsx("div",{className:"scan-guide-corner corner-bl"}),n.jsx("div",{className:"scan-guide-corner corner-br"})]})}),n.jsxs("div",{className:"cam-hud",children:[n.jsxs("div",{className:"cam-hud-chip mono",style:{fontSize:"0.68rem"},children:[n.jsx(fa,{size:12})," ",E||"OCR AWB capture"]}),D.length>0&&n.jsxs("div",{className:"cam-hud-chip",children:[n.jsx(ma,{size:12})," ",D.length," queued"]})]}),n.jsxs("div",{className:"cam-bottom",children:[n.jsx("div",{style:{color:ce?"rgba(16,185,129,0.95)":"rgba(255,255,255,0.85)",fontSize:"0.82rem",fontWeight:600,textAlign:"center",transition:"color 0.3s"},children:tr}),z.metrics&&n.jsxs("div",{style:{color:"rgba(255,255,255,0.66)",fontSize:"0.72rem",textAlign:"center"},children:["Blur ",z.metrics.blurScore," | Glare ",z.metrics.glareRatio,"% | Skew ",z.metrics.perspectiveSkew,"%"]}),n.jsx("button",{className:"capture-btn","data-testid":"capture-photo-btn",onClick:Xa,disabled:!Lt,style:{opacity:Lt?1:.4},children:n.jsx("div",{className:"capture-btn-inner"})}),C&&n.jsx("button",{type:"button","data-testid":"mock-capture-btn",onClick:Za,style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},children:"Mock capture"}),n.jsx("button",{style:{background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:"0.72rem",padding:"6px 16px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontWeight:600},onClick:()=>{ae(""),f(""),Y(0),re(0),je.current=!1,N("tap"),p(o.SCANNING)},children:"← Rescan barcode"})]})]})}),n.jsx("div",{className:be(o.PREVIEW),children:n.jsxs("div",{style:{background:i.bg,display:"flex",flexDirection:"column",height:"100%"},children:[n.jsxs("div",{style:{padding:"52px 20px 16px",background:"linear-gradient(135deg, #0D1B2A, #1E2D3D)",color:"white"},children:[n.jsx("div",{style:{fontSize:"0.6rem",color:"rgba(255,255,255,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4},children:"CAPTURED"}),n.jsx("div",{className:"mono",style:{fontSize:"1.05rem",fontWeight:800,color:"#fff"},children:E||"OCR Capture"}),G.kb>0&&n.jsxs("div",{style:{fontSize:"0.68rem",color:"rgba(255,255,255,0.45)",marginTop:3},children:[G.kb,"KB · ",G.width,"×",G.height]})]}),n.jsx("div",{style:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20},children:U&&n.jsx("img",{src:U,alt:"Captured label",className:"preview-img"})}),n.jsxs("div",{style:{padding:"12px 16px 28px",display:"flex",gap:10,background:i.surface,borderTop:`1px solid ${i.border}`},children:[n.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{oe(null),p(o.CAPTURING)},children:[n.jsx(ba,{size:15})," Retake"]}),n.jsxs("button",{"data-testid":"use-photo-btn",className:"btn btn-primary",style:{flex:2},onClick:er,children:[n.jsx(br,{size:15})," Read This Label"]})]})]})}),n.jsx("div",{className:be(o.PROCESSING),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",background:i.bg},children:[n.jsxs("div",{style:{padding:"52px 24px 20px",textAlign:"center",background:"linear-gradient(135deg, #0D1B2A, #1E2D3D)",color:"white"},children:[n.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:999,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",marginBottom:14},children:[n.jsx(rt,{size:16,color:"#93C5FD",style:{animation:"spin 2s linear infinite"}}),n.jsx("span",{style:{fontSize:"0.72rem",fontWeight:800,color:"#93C5FD",letterSpacing:"0.06em",textTransform:"uppercase"},children:U?"Reading Label":"Saving Scan"})]}),n.jsx("div",{className:"mono",style:{fontSize:"1.1rem",fontWeight:700,color:"#fff",marginBottom:6},children:E||"—"}),n.jsx("div",{style:{fontSize:"0.72rem",color:"rgba(255,255,255,0.5)"},children:U?"OCR engine extracting fields...":"Syncing with server..."})]}),n.jsx("div",{style:{padding:"16px 16px",display:"flex",flexDirection:"column",gap:10,flex:1},children:[["Client","55%"],["Consignee","80%"],["Destination","65%"],["Pincode","40%"],["Weight (kg)","35%"],["Order No","50%"]].map(([e,t])=>n.jsxs("div",{className:"field-card",style:{opacity:.8},children:[n.jsx("div",{className:"conf-dot conf-none",style:{background:"#DDE3EC"}}),n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:e}),n.jsx("div",{className:"skeleton",style:{height:16,width:t,marginTop:5}})]})]},e))}),n.jsx("div",{style:{padding:"12px 20px 28px",textAlign:"center"},children:n.jsx("button",{className:"btn btn-outline",style:{fontSize:"0.75rem",padding:"9px 24px"},onClick:()=>{f("Cancelled by user."),p(o.ERROR)},children:"Cancel"})})]})}),n.jsx("div",{className:be(o.REVIEWING),children:n.jsxs("div",{className:"review-swipe-root",onTouchStart:ir,onTouchMove:sr,onTouchEnd:or,children:[n.jsx("div",{className:"swipe-action-overlay approve",style:{opacity:Math.max(0,Je)*1.1},children:n.jsxs("div",{className:"swipe-action-label",children:[n.jsx(st,{size:44,color:"white",strokeWidth:3}),"APPROVE"]})}),n.jsx("div",{className:"swipe-action-overlay skip",style:{opacity:Math.max(0,-Je)*1.1},children:n.jsxs("div",{className:"swipe-action-label",children:[n.jsx(ot,{size:44,color:"white",strokeWidth:3}),"SKIP"]})}),n.jsxs("div",{className:`review-header${An?" courier-"+An.toLowerCase():""}`,style:{transform:`translateX(${Je*18}px)`,transition:Je===0?"transform 0.25s ease":"none"},children:[n.jsxs("div",{className:"review-header-top",children:[n.jsxs("div",{children:[n.jsx("div",{className:"review-title",children:"REVIEW CONSIGNMENT"}),n.jsxs("div",{className:"mono review-awb awb-copyable",onClick:()=>ar((d==null?void 0:d.awb)||E),children:[(d==null?void 0:d.awb)||E,Oa&&n.jsx("span",{className:"copy-flash",children:"COPIED"})]}),jt&&!An&&n.jsxs("div",{style:{fontSize:"0.6rem",color:"rgba(255,255,255,0.5)",marginTop:2},children:["AWB suggests: ",jt]})]}),n.jsxs("div",{style:{display:"flex",gap:6,alignItems:"flex-start",flexWrap:"wrap",justifyContent:"flex-end"},children:[(A==null?void 0:A.learnedFieldCount)>0&&n.jsxs("div",{className:"source-badge source-learned",children:["AI ",A.learnedFieldCount," corrected"]}),En.score===0&&n.jsx("div",{style:{fontSize:"0.6rem",background:"rgba(220,38,38,0.22)",color:"#FCA5A5",padding:"3px 9px",borderRadius:7,fontWeight:800,border:"1px solid rgba(220,38,38,0.3)"},children:"OCR failed — fill manually"})]})]}),n.jsxs("div",{className:"review-meta-row",children:[n.jsxs("span",{className:`review-confidence ${En.level}`,children:[n.jsx(pa,{size:12}),En.label," (",Math.round(En.score*100),"%)"]}),n.jsxs("button",{type:"button",className:"review-chip review-chip-courier",onClick:rr,title:"Tap to change courier",children:[n.jsx(Mn,{size:12})," ",An||"Set courier →"]}),n.jsxs("span",{className:"review-chip review-chip-date",children:[n.jsx(tt,{size:12})," ",cr||"No date"]})]})]}),n.jsxs("div",{className:"swipe-hint-bar",children:[n.jsxs("div",{className:"swipe-hint-side",style:{color:Je<-.2?i.error:i.mutedLight},children:[n.jsx(ot,{size:11})," SKIP"]}),n.jsx("div",{style:{fontSize:"0.6rem",color:i.mutedLight,fontWeight:600,letterSpacing:"0.05em"},children:"SWIPE TO APPROVE OR SKIP"}),n.jsxs("div",{className:"swipe-hint-side",style:{color:Je>.2?i.success:i.mutedLight},children:["SAVE ",n.jsx(st,{size:11})]})]}),(()=>{const e=["consignee","destination","weight"],t=e.filter(s=>{const u=g[s];return u!=null&&String(u).trim()!==""&&String(u).trim()!=="0"}).length,a=Math.round(t/e.length*100);return n.jsxs("div",{className:"form-progress-bar-wrap",children:[n.jsx("div",{className:"form-progress-bar-track",children:n.jsx("div",{className:"form-progress-bar-fill",style:{width:a+"%"}})}),n.jsx("div",{className:"form-progress-label",style:{color:a===100?i.success:i.muted},children:a===100?"✓ Ready to save":`${t}/${e.length} required`})]})})(),n.jsxs("div",{className:"scroll-panel",style:{display:"flex",flexDirection:"column",gap:10},children:[n.jsxs("div",{className:`field-card field-card-animated ${(((Kt=ie.clientCode)==null?void 0:Kt.confidence)||0)<.55?"warning":"conf-high"}`,children:[n.jsx("div",{className:ut(((Jt=ie.clientCode)==null?void 0:Jt.confidence)||0)}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:5},children:[n.jsx("span",{className:"field-label",style:{margin:0},children:"Client"}),((Yt=ie.clientCode)==null?void 0:Yt.source)&&(()=>{const e=pt(ie.clientCode.source);return e?n.jsxs("span",{className:e.className,children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.clientCode||"",onChange:e=>W(t=>({...t,clientCode:e.target.value.toUpperCase()})),placeholder:"Client code",autoCapitalize:"characters"}),n.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,gap:8},children:[n.jsx("div",{style:{fontSize:"0.6rem",color:i.muted},children:me?n.jsxs("span",{style:{color:i.primary,fontWeight:700},children:["📌 Sticky: ",me]}):"Sticky off"}),me?n.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>pn(""),children:"Clear"}):n.jsx("button",{type:"button",className:"suggest-chip",onClick:()=>{const e=De(g.clientCode||"");e&&e!=="MISC"&&pn(e)},children:"Keep this client"})]}),((Qt=A==null?void 0:A.clientMatches)==null?void 0:Qt.length)>0&&A.clientNeedsConfirmation&&n.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:7},children:A.clientMatches.slice(0,3).map(e=>n.jsxs("button",{type:"button",className:`suggest-chip ${g.clientCode===e.code?"active":""}`,onClick:()=>W(t=>({...t,clientCode:e.code})),children:[e.code," (",Math.round(e.score*100),"%)"]},e.code))})]})]}),n.jsxs("div",{className:`field-card field-card-animated ${(Xt=g.consignee)!=null&&Xt.trim()?"conf-high":"required-empty"}`,children:[n.jsx("div",{className:(Zt=g.consignee)!=null&&Zt.trim()?ut(((ea=ie.consignee)==null?void 0:ea.confidence)||0):"conf-dot conf-low"}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Consignee ",n.jsx("span",{className:"field-required-star",children:"*"}),((na=ie.consignee)==null?void 0:na.source)&&(()=>{const e=pt(ie.consignee.source);return e?n.jsxs("span",{className:e.className,style:{marginLeft:4},children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.consignee||"",onChange:e=>W(t=>({...t,consignee:e.target.value.toUpperCase()})),placeholder:"Recipient name *",autoCapitalize:"words"})]})]}),n.jsxs("div",{className:`field-card field-card-animated ${(ta=g.destination)!=null&&ta.trim()?"conf-high":"required-empty"}`,children:[n.jsx("div",{className:(aa=g.destination)!=null&&aa.trim()?ut(((ra=ie.destination)==null?void 0:ra.confidence)||0):"conf-dot conf-low"}),n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Destination ",n.jsx("span",{className:"field-required-star",children:"*"}),((ia=ie.destination)==null?void 0:ia.source)&&(()=>{const e=pt(ie.destination.source);return e?n.jsxs("span",{className:e.className,style:{marginLeft:4},children:[e.icon," ",e.text]}):null})()]}),n.jsx("input",{className:"field-input",value:g.destination||"",onChange:e=>W(t=>({...t,destination:e.target.value.toUpperCase()})),placeholder:"City *",autoCapitalize:"words"}),(A==null?void 0:A.pincodeCity)&&A.pincodeCity!==g.destination&&n.jsxs("button",{type:"button",className:"suggest-chip pincode-suggest",style:{marginTop:6},onClick:()=>W(e=>({...e,destination:A.pincodeCity})),children:["📍 Pincode → ",A.pincodeCity]}),!(A!=null&&A.pincodeCity)&&((sa=g.pincode)==null?void 0:sa.length)===6&&(()=>{const e=dt(g.pincode);return e&&e!==g.destination?n.jsxs("button",{type:"button",className:"suggest-chip pincode-suggest",style:{marginTop:6},onClick:()=>W(t=>({...t,destination:e})),children:["📍 ",g.pincode," → ",e]}):null})()]})]}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[n.jsx("div",{className:"field-card field-card-animated",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"Pincode"}),n.jsx("input",{className:"field-input",value:g.pincode||"",onChange:e=>{const t=e.target.value.replace(/[^0-9]/g,"").slice(0,6);W(a=>{var u;const s=t.length===6&&!((u=a.destination)!=null&&u.trim())?dt(t):"";return{...a,pincode:t,...s?{destination:s}:{}}})},placeholder:"6 digits",maxLength:6,inputMode:"numeric"})]})}),n.jsx("div",{className:`field-card field-card-animated ${(oa=A==null?void 0:A.weightAnomaly)!=null&&oa.anomaly?"warning":!g.weight||String(g.weight).trim()==="0"?"required-empty":"conf-med"}`,children:n.jsxs("div",{style:{flex:1},children:[n.jsxs("div",{className:"field-label",children:["Weight (kg) ",n.jsx("span",{className:"field-required-star",children:"*"})]}),n.jsx("input",{className:"field-input",value:g.weight||"",onChange:e=>W(t=>({...t,weight:e.target.value})),placeholder:"0.0 *",inputMode:"decimal"}),((ca=A==null?void 0:A.weightAnomaly)==null?void 0:ca.anomaly)&&n.jsx("div",{style:{fontSize:"0.6rem",color:i.warning,marginTop:3,fontWeight:700},children:A.weightAnomaly.warning})]})})]}),n.jsx("div",{className:"weight-quick-picks",children:[.5,1,1.5,2,3,5,10].map(e=>n.jsxs("button",{type:"button",className:`weight-chip ${String(g.weight)===String(e)?"active":""}`,onClick:()=>{W(t=>({...t,weight:e})),N("tap")},children:[e,"kg"]},e))}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},children:[n.jsx("div",{className:"field-card field-card-animated",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"COD Amount (Rs.)"}),n.jsx("input",{className:"field-input",value:g.amount||"",onChange:e=>W(t=>({...t,amount:e.target.value})),placeholder:"0",inputMode:"decimal"})]})}),n.jsx("div",{className:"field-card field-card-animated",children:n.jsxs("div",{style:{flex:1},children:[n.jsx("div",{className:"field-label",children:"Order No"}),n.jsx("input",{className:"field-input",value:g.orderNo||"",onChange:e=>W(t=>({...t,orderNo:e.target.value})),placeholder:"Optional"})]})})]}),n.jsxs("div",{style:{fontSize:"0.6rem",color:i.mutedLight,textAlign:"center",paddingBottom:4},children:[n.jsx("span",{style:{color:"#E11D48"},children:"*"})," Required  ·  Swipe right to save instantly"]})]}),n.jsxs("div",{style:{padding:"10px 16px 24px",borderTop:`1px solid ${i.border}`,display:"flex",gap:10,background:i.surface},children:[n.jsxs("button",{className:"btn btn-outline",style:{flex:1},onClick:()=>{if(h){w("/scan-mobile");return}Oe()},children:[n.jsx(ot,{size:15})," Skip"]}),n.jsx("button",{"data-testid":"approve-save-btn",className:"btn btn-success btn-lg",style:{flex:2},onClick:et,disabled:I===o.APPROVING,children:I===o.APPROVING?n.jsxs(n.Fragment,{children:[n.jsx(Bn,{size:15,style:{animation:"spin 1s linear infinite"}})," Saving..."]}):n.jsxs(n.Fragment,{children:[n.jsx(st,{size:15})," Approve & Save"]})})]})]})}),n.jsx("div",{className:be(o.APPROVING),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[n.jsx("div",{style:{width:72,height:72,borderRadius:"50%",background:i.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"},children:n.jsx(Bn,{size:34,style:{animation:"spin 1s linear infinite",color:i.primary}})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:i.text},children:"Saving Consignment"}),n.jsx("div",{className:"mono",style:{fontSize:"0.95rem",marginTop:8,color:i.muted},children:(d==null?void 0:d.awb)||E}),n.jsxs("div",{style:{fontSize:"0.74rem",color:i.mutedLight,marginTop:6,lineHeight:1.5},children:["Communicating with server...",n.jsx("br",{}),"If this takes too long, go back and retry."]})]}),n.jsx("button",{className:"btn btn-outline",onClick:()=>{clearTimeout(de.current),de.current=null,f("Please tap Approve & Save again."),p(o.REVIEWING)},children:"Back to review"})]})}),n.jsx("div",{className:be(o.SUCCESS),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,gap:20,background:i.bg},children:[(S==null?void 0:S.courier)&&(()=>{const e=$n(Re(S.courier));return n.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:999,background:e.light,color:e.bg,fontSize:"0.7rem",fontWeight:800,border:`1px solid ${e.bg}33`,letterSpacing:"0.04em"},children:[n.jsx(Mn,{size:13})," ",e.label]})})(),n.jsx("div",{style:{position:"relative"},children:n.jsxs("svg",{width:"88",height:"88",viewBox:"0 0 88 88",children:[n.jsx("circle",{cx:"44",cy:"44",r:"38",fill:i.successLight}),n.jsx("circle",{cx:"44",cy:"44",r:"38",fill:"none",stroke:i.success,strokeWidth:"3",className:"success-check-circle"}),n.jsx("polyline",{points:"26,46 38,58 62,32",fill:"none",stroke:i.success,strokeWidth:"4",strokeLinecap:"round",strokeLinejoin:"round",className:"success-check-mark"})]})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.1rem",fontWeight:800,color:i.success,marginBottom:6},children:"Saved Successfully"}),n.jsx("div",{className:"mono",style:{fontSize:"1.3rem",fontWeight:700,color:i.text},children:S==null?void 0:S.awb}),(S==null?void 0:S.clientCode)&&n.jsx("div",{style:{marginTop:8,display:"inline-block",padding:"4px 16px",borderRadius:999,background:i.primaryLight,color:i.primary,fontSize:"0.78rem",fontWeight:700,border:"1px solid rgba(29,78,216,0.15)"},children:S.clientName||S.clientCode}),(S==null?void 0:S.destination)&&n.jsxs("div",{style:{marginTop:6,fontSize:"0.78rem",color:i.muted,fontWeight:500},children:[S.destination," ",S.weight?`• ${S.weight}kg`:""]})]}),n.jsxs("div",{style:{fontSize:"0.72rem",color:i.muted,textAlign:"center",lineHeight:1.5},children:[S!=null&&S.offlineQueued?`${D.length} queued for sync`:`Consignment #${k.scanNumber} accepted`,n.jsx("br",{}),n.jsxs("span",{style:{color:i.mutedLight},children:["Auto-continuing in ",nr,"s"]})]}),n.jsxs("button",{"data-testid":"scan-next-btn",className:"btn btn-primary btn-lg btn-full",onClick:()=>Oe(L==="fast"?o.SCANNING:o.IDLE),style:{maxWidth:320},children:[n.jsx(at,{size:18})," ",L==="fast"?"Keep Scanning":"Scan Next Parcel"]})]})}),n.jsx("div",{className:be(o.ERROR),children:n.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:i.bg},children:[n.jsx("div",{style:{width:72,height:72,borderRadius:"50%",background:i.errorLight,border:"2px solid rgba(220,38,38,0.18)",display:"flex",alignItems:"center",justifyContent:"center"},children:n.jsx(la,{size:34,color:i.error})}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1rem",fontWeight:800,color:i.error},children:"Scan Error"}),n.jsx("div",{style:{fontSize:"0.82rem",color:i.muted,marginTop:6,lineHeight:1.5},children:te})]}),n.jsxs("button",{className:"btn btn-primary",onClick:Oe,children:[n.jsx(ba,{size:16})," Try Again"]})]})}),y==="disconnected"&&I!==o.IDLE&&n.jsxs("div",{className:"offline-banner",children:[n.jsx(nt,{size:12,style:{display:"inline",verticalAlign:-2,marginRight:4}}),"Offline â€” Reconnecting... ",D.length?`(${D.length} queued)`:""]}),_a&&n.jsx("div",{className:"lock-ring-flash",onAnimationEnd:()=>Et(!1)}),Wa&&n.jsx("div",{className:"session-modal-overlay",onClick:()=>Sn(!1),children:n.jsxs("div",{className:"session-modal",onClick:e=>e.stopPropagation(),children:[n.jsx("div",{className:"session-modal-handle"}),n.jsx("div",{style:{fontSize:"1rem",fontWeight:800,color:i.text,marginBottom:4},children:"End Session?"}),n.jsx("div",{style:{fontSize:"0.78rem",color:i.muted,marginBottom:12},children:"Summary before you go"}),n.jsxs("div",{className:"session-summary-grid",children:[n.jsxs("div",{className:"session-summary-tile",children:[n.jsx("div",{className:"session-summary-num",children:k.scanNumber}),n.jsx("div",{className:"session-summary-lbl",children:"Parcels Scanned"})]}),n.jsxs("div",{className:"session-summary-tile",children:[n.jsx("div",{className:"session-summary-num",children:Rn>0?Rn.toFixed(1):"0"}),n.jsx("div",{className:"session-summary-lbl",children:"Total Weight kg"})]}),n.jsxs("div",{className:"session-summary-tile",children:[n.jsx("div",{className:"session-summary-num",children:un}),n.jsx("div",{className:"session-summary-lbl",children:"Duration"})]}),n.jsxs("div",{className:"session-summary-tile",children:[n.jsx("div",{className:"session-summary-num",children:D.length}),n.jsx("div",{className:"session-summary-lbl",children:"Pending Sync"})]})]}),k.scannedItems.length>0&&(()=>{const e={};return k.scannedItems.forEach(t=>{const a=Re(t.courier||"")||"Other";e[a]=(e[a]||0)+1}),n.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16},children:Object.entries(e).map(([t,a])=>{const s=$n(t);return n.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:999,background:s.light,color:s.bg,fontSize:"0.7rem",fontWeight:800,border:`1px solid ${s.bg}33`},children:[t," × ",a]},t)})})})(),n.jsxs("div",{style:{display:"flex",gap:10},children:[n.jsx("button",{className:"btn btn-outline btn-full",onClick:()=>Sn(!1),children:"Keep Scanning"}),n.jsxs("button",{className:"btn btn-danger btn-full",onClick:()=>{Sn(!1),Ya()},children:[n.jsx(it,{size:15})," End Session"]})]})]})})]}),n.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})}export{Kr as default};
