import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let feedback = [];
let sentimentPipeline = null;
let modelPromise = null;
const $ = (id) => document.getElementById(id);
const topics = ['Staff and therapist experience','Parent communication','Scheduling','Service experience','Facility and environment','Parent support','Other'];
const topicTerms = {
  'Staff and therapist experience':['staff','therapist','therapists','professional','friendly','accommodating','respectful','rude','helpful','approachable'],
  'Parent communication':['communication','update','updates','inform','informed','message','messages','explain','explained','response','responsive','feedback'],
  'Scheduling':['schedule','scheduling','appointment','appointments','reschedule','rescheduled','availability','late','waiting','wait time','delay','cancelled'],
  'Service experience':['service','assessment','process','program','programs','session','sessions','experience','support'],
  'Facility and environment':['facility','facilities','clean','cleanliness','room','rooms','environment','safe','safety','accessible','accessibility','parking'],
  'Parent support':['parent','parents','guidance','coaching','support','orientation','resources','understanding']
};
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function classifyTopic(text){const lower=text.toLowerCase();let best='Other',bestCount=0;for(const [topic,terms] of Object.entries(topicTerms)){const count=terms.reduce((n,term)=>n+(lower.includes(term)?1:0),0);if(count>bestCount){best=topic;bestCount=count;}}return best;}
function sentimentLabel(result){const label=(result?.label||'').toLowerCase();if(label.includes('positive'))return 'positive';if(label.includes('negative'))return 'negative';if(label==='label_1')return 'positive';if(label==='label_0')return 'negative';return 'neutral';}
async function getModel(){if(sentimentPipeline)return sentimentPipeline;if(!modelPromise){modelPromise=(async()=>{setAIStatus('Loading multilingual AI model…',true);sentimentPipeline=await pipeline('text-classification','Horizon-Labs/multilingual-sentiment-small',{dtype:'q8'});setAIStatus('AI engine ready',false);return sentimentPipeline;})().catch(err=>{modelPromise=null;sentimentPipeline=null;setAIStatus('AI model unavailable',false);throw err;});}return modelPromise;}
function setAIStatus(label,loading){$('sidebarStatus').textContent=label;$('sidebarStatusDot').style.background=loading?'#d5a34e':label.includes('unavailable')?'#d17b70':'#6ab783';}
async function analyzeText(text){const model=await getModel();const result=await model(text.slice(0,512));const item=Array.isArray(result)?result[0]:result;return {sentiment:sentimentLabel(item),score:Number(item?.score||0)};}
function formatDate(date){if(!date)return 'Date not set';return new Date(`${date}T12:00:00`).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});}
function sentimentIcon(s){return s==='positive'?'↗':s==='negative'?'!':'–';}
function entryHTML(item){return `<div class="feedback-entry"><div class="sentiment-mark ${item.sentiment}">${sentimentIcon(item.sentiment)}</div><div class="entry-main"><div class="entry-text">${escapeHTML(item.text)}</div><div class="entry-meta"><span>${formatDate(item.date)}</span><span>·</span><span>${escapeHTML(item.source)}${item.branch?` · ${escapeHTML(item.branch)}`:''}</span><span class="topic-tag">${escapeHTML(item.topic||'Other')}</span><span class="sentiment-tag ${item.sentiment}">${item.sentiment}</span></div></div></div>`;}
function countBy(key){return feedback.reduce((acc,item)=>{const value=item[key]||'Other';acc[value]=(acc[value]||0)+1;return acc;},{});}
function renderOverview(){const total=feedback.length;const counts=countBy('sentiment');const pos=counts.positive||0,neg=counts.negative||0,neu=counts.neutral||0;const pct=n=>total?Math.round(n/total*100):0;$('totalMetric').textContent=total;$('positiveMetric').innerHTML=`${pct(pos)}<span class="metric-unit">%</span>`;$('negativeMetric').innerHTML=`${pct(neg)}<span class="metric-unit">%</span>`;$('positiveCount').textContent=`${pos} positive`;$('negativeCount').textContent=`${neg} negative`;$('donutTotal').textContent=total;
 const topicCounts=countBy('topic');const top=Object.entries(topicCounts).sort((a,b)=>b[1]-a[1])[0];$('topTopicMetric').textContent=top?top[0]:'—';const posPct=pct(pos),negPct=pct(neg),neuPct=Math.max(0,100-posPct-negPct);$('sentimentDonut').style.background=`conic-gradient(#4e9365 0 ${posPct}%,#d27a6c ${posPct}% ${posPct+negPct}%,#d7ded8 ${posPct+negPct}% 100%)`;$('sentimentLegend').innerHTML=[['Positive',pos,'#4e9365'],['Negative',neg,'#d27a6c'],['Neutral',neu,'#d7ded8']].map(([name,n,color])=>`<div class="legend-row"><i class="legend-swatch" style="background:${color}"></i>${name}<b>${n}</b></div>`).join('');
 const sortedTopics=Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);$('topicBars').innerHTML=sortedTopics.length?sortedTopics.map(([name,n])=>`<div class="topic-row"><span>${escapeHTML(name)}</span><div class="topic-track"><div class="topic-fill" style="width:${Math.max(4,n/total*100)}%"></div></div><b>${n}</b></div>`).join(''):'<div class="empty-state">No topics yet.</div>';$('recentFeedback').innerHTML=[...feedback].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(entryHTML).join('')||'<div class="empty-state">No feedback yet.</div>';$('feedbackNavCount').textContent=total;}
function renderFeedback(){const q=$('searchFeedback').value.toLowerCase().trim(),sent=$('sentimentFilter').value,topic=$('topicFilter').value;const filtered=[...feedback].sort((a,b)=>b.date.localeCompare(a.date)).filter(x=>(!q||x.text.toLowerCase().includes(q))&&(sent==='all'||x.sentiment===sent)&&(topic==='all'||x.topic===topic));$('allFeedback').innerHTML=filtered.map(entryHTML).join('');$('emptyState').classList.toggle('hidden',filtered.length>0);}
function renderInsights(){
  const total=feedback.length;
  const positives=feedback.filter(x=>x.sentiment==='positive');
  const negatives=feedback.filter(x=>x.sentiment==='negative');
  const neutrals=feedback.filter(x=>x.sentiment==='neutral');
  const avgRating=feedback.filter(x=>Number(x.rating)>0);
  const average=avgRating.length?(avgRating.reduce((sum,x)=>sum+Number(x.rating),0)/avgRating.length).toFixed(1):'—';
  const negativeRate=total?Math.round(negatives.length/total*100):0;
  const topicStats={};
  feedback.forEach(x=>{const topic=x.topic||'Other';if(!topicStats[topic])topicStats[topic]={total:0,negative:0,positive:0,neutral:0,comments:[]};const row=topicStats[topic];row.total++;row[x.sentiment||'neutral']=(row[x.sentiment||'neutral']||0)+1;row.comments.push(x.text);});
  const rankedTopics=Object.entries(topicStats).sort((a,b)=>((b[1].negative/Math.max(1,b[1].total))-(a[1].negative/Math.max(1,a[1].total)))||b[1].negative-a[1].negative);
  const mostConcern=rankedTopics.filter(([,v])=>v.negative>0).sort((a,b)=>b[1].negative-a[1].negative)[0];
  const summaryCards=[
    ['Analyzed feedback',total,'All available records'],
    ['Negative feedback',`${negativeRate}%`,`${negatives.length} of ${total} comments`],
    ['Average rating',average==='—'?'—':`${average}/5`,`${avgRating.length} ratings available`],
    ['Top concern',mostConcern?mostConcern[0]:'None yet',mostConcern?`${mostConcern[1].negative} negative mention${mostConcern[1].negative===1?'':'s'}`:'No negative topics detected']
  ];
  $('insightSummary').innerHTML=summaryCards.map(([label,value,detail])=>`<article class="insight-stat"><span>${escapeHTML(label)}</span><b>${escapeHTML(value)}</b><small>${escapeHTML(detail)}</small></article>`).join('');
  const themeHTML=(items,negative)=>{
    const grouped={};items.forEach(x=>{const t=x.topic||'Other';grouped[t]=grouped[t]||[];grouped[t].push(x.text);});
    const sorted=Object.entries(grouped).sort((a,b)=>b[1].length-a[1].length);
    return sorted.length?sorted.slice(0,4).map(([topic,comments])=>`<div class="theme-item ${negative?'negative':''}"><i class="theme-bullet"></i><div><b>${escapeHTML(topic)} · ${comments.length} mention${comments.length>1?'s':''}</b><span>“${escapeHTML(comments[0].slice(0,115))}${comments[0].length>115?'…':''}”</span></div></div>`).join(''):'<div class="empty-state">No entries in this group yet.</div>';
  };
  $('positiveThemes').innerHTML=themeHTML(positives,false);
  $('negativeThemes').innerHTML=themeHTML(negatives,true);
  const recommendationMap={
    'Staff and therapist experience':['Review staff and therapist experience','Review recurring comments about respectful communication, professionalism, responsiveness, and the overall interaction.'],
    'Parent communication':['Review parent communication practices','Look for repeated feedback about updates, explanations, response times, and how information is shared with families.'],
    'Scheduling':['Review scheduling and appointment coordination','Check whether feedback points to appointment availability, schedule changes, delays, or notification practices.'],
    'Service experience':['Review the overall service experience','Read the original comments to understand which parts of the center experience parents are describing.'],
    'Facility and environment':['Review the center environment','Check recurring comments about cleanliness, comfort, accessibility, safety, or the physical environment.'],
    'Parent support':['Review parent support and guidance','Look for feedback about the clarity, accessibility, and usefulness of information and support provided to parents.'],
    'Other':['Review uncategorized comments','Read these comments manually and consider expanding the topic keywords if a repeated theme appears.']
  };
  const recs=rankedTopics.filter(([,v])=>v.negative>0).slice(0,3).map(([topic,v])=>({title:recommendationMap[topic]?.[0]||`Review ${topic}`,desc:`${v.negative} of ${v.total} comments in this topic are negative. ${recommendationMap[topic]?.[1]||'Review the original comments for a recurring issue.'}`}));
  if(!recs.length&&total)recs.push({title:'Maintain positive customer experiences',desc:`${positives.length} positive, ${neutrals.length} neutral, and ${negatives.length} negative comments are currently recorded. Continue monitoring new feedback for changes.`});
  if(!total)recs.push({title:'Start collecting parent and guardian feedback',desc:'Once parent and guardian comments are submitted, SeedInsights can identify recurring service-experience themes for staff to review.'});
  $('recommendations').innerHTML=recs.map(r=>`<div class="recommendation"><b>${escapeHTML(r.title)}</b><p>${escapeHTML(r.desc)}</p></div>`).join('');
}
function renderAll(){renderOverview();renderFeedback();renderInsights();}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));$(`${name}View`).classList.add('active-view');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('breadcrumbCurrent').textContent=name==='overview'?'Overview':name==='feedback'?'Feedback':name==='qr'?'Parent feedback QR':'AI insights';$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
let toastTimer;function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
function openModal(){ $('feedbackModal').classList.remove('hidden');$('feedbackDate').value=new Date().toISOString().slice(0,10);$('feedbackText').focus();}
function closeModal(){ $('feedbackModal').classList.add('hidden');$('feedbackForm').reset();}
async function exportCSV(){const rows=[['Feedback','Date','Source','Branch','Rating','Sentiment','Confidence','Topic'],...feedback.map(x=>[x.text,x.date,x.source,x.branch||'',x.rating??'',x.sentiment,x.score??'',x.topic])];const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='seedinsights-feedback.csv';a.click();URL.revokeObjectURL(url);toast('Feedback exported as CSV.');}
async function loadFeedback(){
  const {data,error}=await supabase.from('feedback').select('id,text,source,date,rating,sentiment,score,topic,branch,created_at').order('created_at',{ascending:false});
  if(error){console.error(error);toast('Could not load feedback. Check database access.');return;}
  feedback=(data||[]).map(x=>({...x,date:x.date||x.created_at?.slice(0,10)||''}));
  renderAll();
}
function mapAuthError(error){return error?.message||'Sign-in failed. Check your email and password.';}
async function showAppForSession(session){
  $('authScreen').hidden=!!session;
  $('appShell').hidden=!session;
  if(session){$('signedInEmail').textContent=session.user.email||'Staff';await loadFeedback();
    supabase.removeAllChannels();
    supabase.channel('feedback-changes').on('postgres_changes',{event:'*',schema:'public',table:'feedback'},()=>loadFeedback()).subscribe();
    if(!window.__seedInsightsRefresh){window.__seedInsightsRefresh=setInterval(()=>{if(document.visibilityState==='visible')loadFeedback();},15000);}
  } else {feedback=[];}
}
$('staffLoginForm').addEventListener('submit',async e=>{
  e.preventDefault();$('authError').hidden=true;const btn=$('staffLoginButton');btn.disabled=true;btn.textContent='Signing in…';
  const {data,error}=await supabase.auth.signInWithPassword({email:$('staffEmail').value.trim(),password:$('staffPassword').value});
  btn.disabled=false;btn.textContent='Sign in';
  if(error){$('authError').textContent=mapAuthError(error);$('authError').hidden=false;return;}
  await showAppForSession(data.session);
});
$('staffLogout').addEventListener('click',async()=>{await supabase.auth.signOut();});
supabase.auth.onAuthStateChange((_event,session)=>{showAppForSession(session);});
const {data:{session:initialSession}}=await supabase.auth.getSession();
await showAppForSession(initialSession);

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));$('addFeedbackTop').addEventListener('click',openModal);$('addFeedbackPage').addEventListener('click',openModal);$('closeModal').addEventListener('click',closeModal);$('cancelModal').addEventListener('click',closeModal);$('feedbackModal').addEventListener('click',e=>{if(e.target===$('feedbackModal'))closeModal();});$('dismissNotice').addEventListener('click',()=>document.querySelector('.notice').remove());$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));$('exportTop').addEventListener('click',exportCSV);$('searchFeedback').addEventListener('input',renderFeedback);$('sentimentFilter').addEventListener('change',renderFeedback);$('topicFilter').addEventListener('change',renderFeedback);
$('feedbackForm').addEventListener('submit',async e=>{e.preventDefault();const text=$('feedbackText').value.trim();if(!text)return;const saveButton=$('saveFeedback');saveButton.disabled=true;saveButton.textContent='Analyzing…';try{const analysis=await analyzeText(text);const item={text,source:$('feedbackSource').value,date:$('feedbackDate').value||new Date().toISOString().slice(0,10),sentiment:analysis.sentiment,score:analysis.score,topic:classifyTopic(text),branch:$('feedbackBranch').value.trim()||null};const {error}=await supabase.from('feedback').insert(item);if(error)throw error;await loadFeedback();closeModal();showView('feedback');toast('Feedback saved and analyzed.');}catch(error){console.error('Staff feedback analysis or save failed.',error);toast('Could not analyze or save feedback. Check your connection and try again.');}finally{saveButton.disabled=false;saveButton.textContent='Save feedback';}});
$('generateQR').addEventListener('click',()=>{const url=$('customerPageUrl').value.trim();if(!url||!/^https:\/\//i.test(url)){toast('Enter a valid public page URL first.');return;}if(!window.QRCode){toast('QR generator could not load. Check your connection.');return;}$('qrCode').innerHTML='';new QRCode($('qrCode'),{text:url,width:210,height:210,colorDark:'#17251b',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});$('downloadQR').disabled=false;toast('QR code generated.');});
$('downloadQR').addEventListener('click',()=>{const box=$('qrCode');const canvas=box.querySelector('canvas');const img=box.querySelector('img');const src=canvas?canvas.toDataURL('image/png'):img?.src;if(!src){toast('Generate the QR code first.');return;}const a=document.createElement('a');a.href=src;a.download='seedinsights-parent-feedback-qr.png';a.click();});
$('customerPageUrl').value=new URL('customer.html',window.location.href).href;
$('reanalyzeButton').addEventListener('click',async()=>{const button=$('reanalyzeButton');button.disabled=true;button.textContent='Analyzing…';try{const model=await getModel();for(const item of feedback){const result=await model(item.text.slice(0,512));const r=Array.isArray(result)?result[0]:result;item.sentiment=sentimentLabel(r);item.score=Number(r?.score||0);item.topic=classifyTopic(item.text);}const updates=feedback.map(x=>supabase.from('feedback').update({sentiment:x.sentiment,score:x.score,topic:x.topic}).eq('id',x.id));const results=await Promise.all(updates);const failed=results.some(x=>x.error);if(failed)throw new Error('Database update permission is missing.');await loadFeedback();toast('Feedback analysis updated.');}catch(err){console.error(err);toast('Could not update analysis. Check staff update permissions.');}finally{button.disabled=false;button.textContent='↻ Re-analyze feedback';}});
