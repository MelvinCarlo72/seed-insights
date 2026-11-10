import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

env.allowLocalModels=false;
env.useBrowserCache=true;
const SUMMARY_MODEL='Xenova/distilbart-cnn-6-6';
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);
$('childBirthDate').max=new Date().toISOString().slice(0,10);
let children=[];
let toastTimer;
let summarizer=null;
let summarizerPromise=null;
let summaryProgressTarget=null;
let summaryInProgress=false;
const fields={first_name:'childFirstName',last_name:'childLastName',date_of_birth:'childBirthDate',branch:'childBranch',guardian_name:'guardianName',guardian_relationship:'guardianRelationship',guardian_phone:'guardianPhone',guardian_email:'guardianEmail',enrolled_service:'enrolledService',developmental_goals:'developmentalGoals',session_history:'sessionHistory',staff_notes:'staffNotes'};

function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));$(`${name}View`).classList.add('active-view');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('breadcrumbCurrent').textContent=name==='overview'?'Overview':'Child profiles';$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
function formatDate(value){if(!value)return 'Not provided';const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.valueOf())?value:d.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});}
function setSummaryProgress(info){
  if(!summaryProgressTarget)return;
  if(info.status==='progress'&&Number.isFinite(info.progress))summaryProgressTarget.textContent=`Loading AI model… ${Math.round(info.progress)}%`;
  else if(info.status==='downloading')summaryProgressTarget.textContent='Downloading AI model…';
  else if(info.status==='initiate')summaryProgressTarget.textContent='Preparing AI model…';
}
async function getSummarizer(){
  if(summarizer)return summarizer;
  if(!summarizerPromise){
    const loading=pipeline('summarization',SUMMARY_MODEL,{dtype:'q8',progress_callback:setSummaryProgress})
      .then(model=>(summarizer=model));
    let timeoutId;
    const timeout=new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(new Error('Summarizer model load timed out')),120000);});
    summarizerPromise=Promise.race([loading,timeout])
      .finally(()=>clearTimeout(timeoutId))
      .catch(error=>{summarizer=null;summarizerPromise=null;throw error;});
  }
  return summarizerPromise;
}
function profileCard(child){
  const name=`${child.first_name||''} ${child.last_name||''}`.trim();
  const guardian=[child.guardian_name,child.guardian_relationship].filter(Boolean).join(' · ');
  const contact=[child.guardian_phone,child.guardian_email].filter(Boolean).join(' · ');
  const hasHistory=Boolean(child.session_history?.trim());
  return `<article class="child-entry"><div class="child-entry-head"><div class="child-avatar">${escapeHTML((child.first_name||'?').slice(0,1).toUpperCase())}</div><div class="child-entry-title"><h3>${escapeHTML(name)}</h3><p>${escapeHTML(child.branch||'Branch not set')} · Date of birth: ${escapeHTML(formatDate(child.date_of_birth))}</p></div><button class="secondary-button child-edit" type="button" data-edit-child="${escapeHTML(child.id)}">Edit profile</button></div><details class="child-details"><summary>View guardian, service, goals, and notes</summary><div class="child-detail-grid"><div><b>Parent or guardian</b><span>${escapeHTML(guardian||'Not provided')}</span><span>${escapeHTML(contact||'No contact details provided')}</span></div><div><b>Enrolled service</b><span>${escapeHTML(child.enrolled_service||'Not provided')}</span></div><div><b>Goals or focus areas</b><span class="preserve-lines">${escapeHTML(child.developmental_goals||'Not provided')}</span></div><div class="session-history-block"><b>Session history</b><span class="preserve-lines">${escapeHTML(child.session_history||'Not provided')}</span><button class="text-button summarize-history" type="button" data-summarize-child="${escapeHTML(child.id)}" ${hasHistory?'':'disabled'}>✦ Draft AI summary</button><div class="ai-summary" id="summary-${escapeHTML(child.id)}" aria-live="polite" hidden></div></div><div><b>Staff notes</b><span class="preserve-lines">${escapeHTML(child.staff_notes||'Not provided')}</span></div></div></details></article>`;
}
function renderChildren(){
  const q=$('searchChildren').value.trim().toLowerCase();
  const branch=$('branchFilter').value;
  const list=children.filter(child=>{
    const haystack=[child.first_name,child.last_name,child.branch,child.guardian_name,child.guardian_phone,child.guardian_email,child.enrolled_service,child.developmental_goals,child.session_history,child.staff_notes].join(' ').toLowerCase();
    return (!q||haystack.includes(q))&&(branch==='all'||child.branch===branch);
  });
  $('allChildren').innerHTML=list.map(profileCard).join('');
  $('recentChildren').innerHTML=[...children].sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at)).slice(0,4).map(profileCard).join('')||'<div class="empty-state">No child profiles yet. Add a profile to get started.</div>';
  $('emptyChildren').classList.toggle('hidden',list.length>0);
  $('childrenNavCount').textContent=String(children.length);
  $('childTotal').textContent=String(children.length);
  $('serviceTotal').textContent=String(children.filter(c=>c.enrolled_service||c.developmental_goals||c.session_history||c.staff_notes).length);
  const branches=[...new Set(children.map(c=>c.branch).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const select=$('branchFilter');
  const current=select.value;
  select.innerHTML='<option value="all">All branches</option>'+branches.map(b=>`<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');
  select.value=branches.includes(current)?current:'all';
  $('branchTotal').textContent=String(branches.length);
}
async function loadChildren(){
  const {data,error}=await supabase.from('child_profiles').select('*').order('last_name',{ascending:true}).order('first_name',{ascending:true});
  if(error){console.error('Child profile load failed:',error.message);children=[];renderChildren();showToast('Could not load profiles. Confirm the staff account is approved and the database setup is applied.');return;}
  children=data||[];renderChildren();
}
function openChildModal(child=null){
  $('childForm').reset();$('childFormError').hidden=true;$('childId').value=child?.id||'';
  $('childModalTitle').textContent=child?'Edit child profile':'Add child profile';
  $('saveChild').textContent=child?'Save changes':'Save profile';
  for(const [field,id] of Object.entries(fields))$(id).value=child?.[field]||'';
  $('childModal').classList.remove('hidden');$('childFirstName').focus();
}
function closeChildModal(){$('childModal').classList.add('hidden');$('childForm').reset();$('childId').value='';$('childFormError').hidden=true;}
function getProfilePayload(){
  const payload={};
  for(const [field,id] of Object.entries(fields)){const value=$(id).value.trim();payload[field]=value||null;}
  payload.first_name=$('childFirstName').value.trim();payload.last_name=$('childLastName').value.trim();
  return payload;
}
async function saveChild(event){
  event.preventDefault();
  const button=$('saveChild');button.disabled=true;button.textContent='Saving…';$('childFormError').hidden=true;
  const id=$('childId').value;
  const payload=getProfilePayload();
  const request=id
    ?supabase.from('child_profiles').update({...payload,updated_at:new Date().toISOString()}).eq('id',id)
    :supabase.from('child_profiles').insert(payload);
  const {error}=await request;
  button.disabled=false;button.textContent=id?'Save changes':'Save profile';
  if(error){console.error('Child profile save failed:',error.message);$('childFormError').textContent='Could not save. Confirm this account is approved for staff access and check the database connection.';$('childFormError').hidden=false;return;}
  closeChildModal();await loadChildren();showToast(id?'Profile updated.':'Child profile saved.');
}
function mapAuthError(error){return error?.message||'Sign-in failed. Check your email and password.';}
async function showAppForSession(session){
  $('authScreen').hidden=!!session;$('appShell').hidden=!session;
  if(session){
    const {data:approved,error}=await supabase.rpc('is_approved_staff');
    if(error||approved!==true){
      $('authScreen').hidden=false;$('appShell').hidden=true;
      $('authError').textContent=error?'Could not verify staff access. Ask an administrator to check the database setup.':'This account is not on the approved staff access list.';
      $('authError').hidden=false;
      void supabase.auth.signOut();
      return;
    }
    $('signedInEmail').textContent=session.user.email||'Staff';await loadChildren();
  }
  else {children=[];renderChildren();}
}

$('staffLoginForm').addEventListener('submit',async event=>{
  event.preventDefault();$('authError').hidden=true;const button=$('staffLoginButton');button.disabled=true;button.textContent='Signing in…';
  const {data,error}=await supabase.auth.signInWithPassword({email:$('staffEmail').value.trim(),password:$('staffPassword').value});
  button.disabled=false;button.textContent='Sign in';
  if(error){$('authError').textContent=mapAuthError(error);$('authError').hidden=false;return;}
  await showAppForSession(data.session);
});
$('staffLogout').addEventListener('click',async()=>{await supabase.auth.signOut();});
supabase.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>void showAppForSession(session),0);});
const {data:{session:initialSession}}=await supabase.auth.getSession();
await showAppForSession(initialSession);

document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.go)));
$('addChildOverview').addEventListener('click',()=>openChildModal());
$('addChildPage').addEventListener('click',()=>openChildModal());
$('closeChildModal').addEventListener('click',closeChildModal);
$('cancelChildModal').addEventListener('click',closeChildModal);
$('childModal').addEventListener('click',event=>{if(event.target===$('childModal'))closeChildModal();});
$('childForm').addEventListener('submit',saveChild);
$('searchChildren').addEventListener('input',renderChildren);
$('branchFilter').addEventListener('change',renderChildren);
$('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
document.addEventListener('click',event=>{const button=event.target.closest('[data-edit-child]');if(!button)return;const child=children.find(item=>item.id===button.dataset.editChild);if(child)openChildModal(child);});
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-summarize-child]');if(!button)return;
  if(summaryInProgress)return;
  const child=children.find(item=>item.id===button.dataset.summarizeChild);if(!child?.session_history?.trim())return;
  summaryInProgress=true;
  const result=$(`summary-${child.id}`);button.disabled=true;button.textContent='Preparing summary…';summaryProgressTarget=button;
  try{
    const model=await getSummarizer();summaryProgressTarget=button;button.textContent='Summarizing in browser…';
    const output=await model(child.session_history.slice(0,3600),{max_new_tokens:100});
    const summary=Array.isArray(output)?output[0]?.summary_text:output?.summary_text;
    if(!summary?.trim())throw new Error('The summarizer returned an empty result.');
    result.innerHTML=`<b>AI draft — review against the original notes</b><span>${escapeHTML(summary.trim())}</span>`;result.hidden=false;button.textContent='↻ Draft again';
  }catch(error){console.error('Session history summarization failed:',error);result.innerHTML='<b>Summary unavailable</b><span>Could not load or run the summarizer. Check the connection and try again.</span>';result.hidden=false;button.textContent='Try summary again';}
  finally{summaryProgressTarget=null;button.disabled=false;summaryInProgress=false;}
});

// Document import creates an unsaved draft; staff review it in the regular profile form.
let selectedDocument=null;
const importModal=$('importModal');
$('importChildFile').addEventListener('click',()=>{selectedDocument=null;$('profileDocument').value='';$('uploadLabel').textContent='Choose a PDF or TXT file';$('analyzeDocument').disabled=true;$('importError').hidden=true;$('importProgress').hidden=true;importModal.classList.remove('hidden');});
$('closeImportModal').addEventListener('click',()=>importModal.classList.add('hidden'));
$('cancelImport').addEventListener('click',()=>importModal.classList.add('hidden'));
importModal.addEventListener('click',event=>{if(event.target===importModal)importModal.classList.add('hidden');});
$('profileDocument').addEventListener('change',event=>{const file=event.target.files?.[0];selectedDocument=null;$('importError').hidden=true;if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','txt'].includes(ext)||file.size>10*1024*1024){$('importError').textContent='Choose a PDF or TXT file under 10 MB.';$('importError').hidden=false;return;}selectedDocument=file;$('uploadLabel').textContent=file.name;$('analyzeDocument').disabled=false;});
async function extractDocumentText(file){
  if(file.name.toLowerCase().endsWith('.txt'))return await file.text();
  const pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;if(pdf.numPages>40)throw new Error('PDF must be 40 pages or fewer.');let text='';
  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){const page=await pdf.getPage(pageNo);const content=await page.getTextContent();text+=content.items.map(item=>item.str).join(' ')+'\n';}
  if(text.trim().length<40)throw new Error('No readable text found. Scanned PDFs need OCR, which is not configured.');return text;
}
$('analyzeDocument').addEventListener('click',async()=>{if(!selectedDocument)return;const button=$('analyzeDocument');button.disabled=true;$('importError').hidden=true;$('importProgress').hidden=false;$('importProgress').textContent='Reading and analyzing…';try{const documentText=await extractDocumentText(selectedDocument);if(documentText.length>40000)throw new Error('Text exceeds the 40,000 character limit.');const {data,error}=await supabase.functions.invoke('extract-child-profile',{body:{documentText}});if(error)throw new Error(error.message||'AI extraction failed.');if(!data?.profile)throw new Error('Invalid extraction response.');const draft={};for(const key of Object.keys(fields))draft[key]=typeof data.profile[key]==='string'?data.profile[key]:'';importModal.classList.add('hidden');openChildModal(draft);$('childFormError').textContent='AI-generated draft. Compare every field with the original before saving.';$('childFormError').hidden=false;showToast('Draft ready for review. Nothing has been saved yet.');}catch(error){console.error('Document extraction failed:',error);$('importError').textContent=error.message||'Could not analyze this file.';$('importError').hidden=false;}finally{button.disabled=false;$('importProgress').hidden=true;}});
