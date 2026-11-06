import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

env.allowLocalModels = false;
env.useBrowserCache = true;
const SENTIMENT_MODEL = 'Horizon-Labs/multilingual-sentiment-small';
let sentimentPipeline = null;
let modelPromise = null;

async function analyzeSentiment(text) {
  if (!modelPromise) {
    modelPromise = pipeline('text-classification', SENTIMENT_MODEL, { dtype: 'q8' })
      .then(model => (sentimentPipeline = model))
      .catch(error => { modelPromise = null; sentimentPipeline = null; throw error; });
  }
  const model = sentimentPipeline || await modelPromise;
  const result = await model(text.slice(0, 512));
  const item = Array.isArray(result) ? result[0] : result;
  const sentiment = String(item?.label || '').toLowerCase();
  if (!['positive', 'negative', 'neutral'].includes(sentiment) || !Number.isFinite(Number(item?.score))) {
    throw new Error('Unexpected sentiment model response');
  }
  return { sentiment, score: Number(item.score) };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
let rating = 0;
$('ratingStars').innerHTML = [1,2,3,4,5].map(n => `<button type="button" data-rating="${n}" aria-label="${n} star${n>1?'s':''}">★</button>`).join('');
$('ratingStars').addEventListener('click', e => {
  const n = Number(e.target.dataset.rating); if (!n) return; rating = n;
  [...$('ratingStars').children].forEach((b,i) => b.classList.toggle('selected', i<n));
  $('ratingCaption').textContent = `${n} out of 5 — ${['','Poor','Fair','Good','Very good','Excellent'][n]}`;
});
const topicTerms = {
  'Staff and therapist experience':['staff','therapist','therapists','professional','friendly','accommodating','respectful','rude','helpful','approachable'],
  'Parent communication':['communication','update','updates','inform','informed','message','messages','explain','explained','response','responsive','feedback'],
  'Scheduling':['schedule','scheduling','appointment','appointments','reschedule','rescheduled','availability','late','waiting','wait time','delay','cancelled'],
  'Service experience':['service','assessment','process','program','programs','session','sessions','experience','support'],
  'Facility and environment':['facility','facilities','clean','cleanliness','room','rooms','environment','safe','safety','accessible','accessibility','parking'],
  'Parent support':['parent','parents','guidance','coaching','support','orientation','resources','understanding']
};
function inferTopic(text, selected) {
  const lower=text.toLowerCase(); let best=selected||'Other', count=0;
  for (const [topic,terms] of Object.entries(topicTerms)) { const hits=terms.reduce((n,t)=>n+(lower.includes(t)?1:0),0); if(hits>count){best=topic;count=hits;} }
  return best;
}
$('customerForm').addEventListener('submit', async e => {
  e.preventDefault(); $('formError').hidden=true;
  const text=$('customerComment').value.trim();
  if(!rating || !text){$('formError').textContent=!rating?'Please select a star rating.':'Please enter a comment.';$('formError').hidden=false;return;}
  const btn=$('submitFeedback'); btn.disabled=true; btn.textContent='Submitting…';
  const selected=document.querySelector('input[name="topic"]:checked')?.value||'Other';
  let analysis;
  try {
    btn.textContent='Analyzing feedback…';
    analysis=await analyzeSentiment(text);
  } catch(error) {
    console.error('Sentiment model failed to load or analyze feedback.', error);
    $('formError').textContent='We could not analyze your feedback right now. Please try again in a moment.';
    $('formError').hidden=false; btn.disabled=false; btn.textContent='Submit feedback'; return;
  }
  btn.textContent='Saving feedback…';
  const payload={text,source:'QR parent feedback form',date:$('visitDate').value||new Date().toISOString().slice(0,10),rating,sentiment:analysis.sentiment,score:analysis.score,topic:inferTopic(text,selected),branch:$('branchName').value.trim()||null};
  const {error}=await supabase.from('feedback').insert(payload);
  if(error){console.error(error);$('formError').textContent='We could not submit your feedback. Please check your connection and try again.';$('formError').hidden=false;btn.disabled=false;btn.textContent='Submit feedback';return;}
  $('formPanel').hidden=true; $('successPanel').hidden=false;
  $('successPanel').querySelector('p').textContent='Your response has been securely recorded. Thank you for helping the center review its parent and guardian experience!';
});
