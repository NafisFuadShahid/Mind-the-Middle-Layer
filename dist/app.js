import {STAGES,MANIFEST,SCENARIOS,FAULTS,REQUIREMENTS,TAXONOMY,createPlan,parseCommand,runPipeline} from './engine.js';
const $=id=>document.getElementById(id);
const state={mode:'transparent',scenario:'normal',fault:'none',busy:false,participant:false,context:null,contextExpired:false,version:'1.0',maxDuration:5,episodes:[],session:1,stages:Array(6).fill('waiting'),controller:null,last:null,notices:[]};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const friendly=['Input','Capability check','LLM / code generation','Validation','Deployment','Execution / feedback'];
const stageDescriptions=['Receive command','Match the manifest','Create a program','Static · dry run · safety','Compile & flash','Confirm the action'];
const statuses={waiting:'Waiting',running:'In progress',passed:'Passed',failed:'Failed',skipped:'Not reached',cancelled:'Stopped'};
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function renderStages(){ $('pipeline').innerHTML=state.stages.map((s,i)=>`<li class="stage ${s}" aria-label="${friendly[i]}: ${statuses[s]}"><div class="stage-circle" aria-hidden="true">${s==='passed'?'✓':s==='failed'?'×':s==='skipped'?'–':s==='cancelled'?'■':String(i+1).padStart(2,'0')}</div><strong>${friendly[i]}</strong><small>${s==='waiting'?stageDescriptions[i]:statuses[s]}</small></li>`).join(''); }
function renderContext(){ $('context-status').textContent=state.contextExpired?'Context expired · earlier action unavailable.':state.context?`Available: ${state.context.command}`:'No earlier action in this session.'; }
function renderScenarios(){ $('scenario-list').innerHTML=SCENARIOS.map(s=>`<button class="scenario ${s.id===state.scenario?'active':''}" data-scenario="${s.id}" aria-pressed="${s.id===state.scenario}" ${state.busy?'disabled':''}><span class="scenario-tag">${s.tag}</span><span><strong>${s.title}</strong><small>${s.detail}</small></span></button>`).join('');$('scenario-hint').textContent=state.scenario==='wm4'?'Run the full command first. Then send “Do that again”; the context fault expires the earlier action.':SCENARIOS.find(s=>s.id===state.scenario).probe; }
function setCommand(command){$('command-input').value=command;updateCount();}
function updateCount(){$('char-count').textContent=`${$('command-input').value.length} / 240`;}
function setBusy(busy){state.busy=busy;document.body.classList.toggle('busy',busy);for(const id of ['run-button','command-input','fault-select','opaque-button','transparent-button','update-button','reset-button','facilitator-button','recovery-button','export-button'])$(id).disabled=busy;$('stop-button').disabled=!busy;document.querySelectorAll('[data-command]').forEach(b=>b.disabled=busy);$('run-label').textContent=busy?'Processing…':'Send command';renderScenarios();}
function result(title,detail,kind='ready'){ $('result-title').textContent=title;$('result-detail').textContent=detail;$('result-box').className=`result-box ${kind}`;$('result-symbol').textContent=kind==='failed'?'!':kind==='completed'?'✓':kind==='running'?'◌':'○'; }
function resetPose(){ for(const id of ['rover-position','rover-turn']){$(id).style.transform='';$(id).style.transition='';} $('rover-position').setAttribute('transform','translate(320 150)');$('rover-turn').setAttribute('transform','rotate(0)');$('arena').classList.remove('blinking');$('robot-state').textContent='Stationary'; }
function setMode(mode){if(state.busy)return;state.mode=mode;document.body.classList.toggle('opaque',mode==='opaque');for(const m of ['opaque','transparent']){$(m+'-button').setAttribute('aria-pressed',String(m===mode));$(m+'-button').classList.toggle('selected',m===mode);}state.stages=Array(6).fill('waiting');renderStages();result('Ready when you are','Your robot is connected and waiting for a command.');$('opaque-status').textContent='Waiting for a command.';$('recovery-button').hidden=true;$('pipeline-note').textContent='The agent generates a program. The robot executes it.';$('trace-dialog').close();$('response-panel').hidden=true;}
function chooseScenario(id){if(state.busy)return;const s=SCENARIOS.find(s=>s.id===id);if(!s)return;state.scenario=id;state.fault=s.fault;$('fault-select').value=s.fault;setCommand(s.command);state.context=null;state.contextExpired=false;state.stages=Array(6).fill('waiting');renderContext();renderScenarios();renderStages();resetPose();result('Ready when you are','Your robot is connected and waiting for a command.');$('recovery-button').hidden=true;$('response-panel').hidden=true;$('pipeline-note').textContent='The agent generates a program. The robot executes it.';$('opaque-status').textContent='Waiting for a command.';}
function animateAction(action){ const visualDuration=Math.max(.1,Math.min(action.duration,5)*.5);$('rover-position').style.transition=`transform ${visualDuration}s ease-in-out`;$('rover-turn').style.transition=`transform ${visualDuration}s ease-in-out`; if(action.kind==='forward'||action.kind==='backward'){$('rover-position').setAttribute('transform',`translate(320 ${150+(action.kind==='forward'?-1:1)*Math.min(action.duration*13,60)*(action.slower?.5:1)})`);$('robot-state').textContent=action.kind==='forward'?'Moving forward':'Moving backward';}else if(action.kind==='left'||action.kind==='right'){$('rover-turn').setAttribute('transform',`rotate(${action.kind==='left'?-90:90})`);$('robot-state').textContent='Turning '+action.kind;}else if(action.kind==='led'){$('arena').classList.add('blinking');$('robot-state').textContent='Blinking LED';}else{$('robot-state').textContent='Motors stopped';} }
async function submitCommand(){
  if(state.busy)return;
  const command=$('command-input').value.trim();if(!command){$('command-input').focus();return;}
  // A new episode starts at the same visual origin in both conditions.
  resetPose();setBusy(true);state.stages=Array(6).fill('waiting');renderStages();$('response-panel').hidden=true;$('response-form').reset();$('response-saved').textContent='';$('save-response').disabled=false;$('recovery-button').hidden=true;
  state.controller=new AbortController();
  const before=state.context?structuredClone(state.context):null;
  const parsed=parseCommand(command,state.context);
  const expired=state.fault==='context'&&(parsed.repeat||parsed.error==='context');
  if(expired){state.context=null;state.contextExpired=true;renderContext();}
  const plan=createPlan({command,fault:state.fault,context:state.context,maximumDuration:state.maxDuration});
  const episode={id:`S${String(state.session).padStart(2,'0')}-E${String(state.episodes.length+1).padStart(3,'0')}`,simulation:true,startedAt:new Date().toISOString(),condition:state.mode,participantView:state.participant,scenario:state.scenario,injectedFault:state.fault,command,manifest:structuredClone(MANIFEST),firmwareVersion:state.version,modelVersion:'scripted-agent-1.0',maximumDurationSeconds:state.maxDuration,contextBefore:before,contextExpired:expired,generatedCode:null,validation:[],flashStatus:'not_attempted',executionFeedback:'not_started',events:[],reflection:null,interrupted:false};
  episode.manifest.limits.maximumDurationSeconds=state.maxDuration;episode.manifest.version=state.version;
  state.last={episode,plan};
  result('Processing…',state.mode==='opaque'?'Please wait.':'Following the command through the pipeline.','running');$('opaque-status').textContent='Processing…';
  const start=performance.now();
  const outcome=await runPipeline(plan,{
    signal:state.controller.signal,
    onStage:e=>{
      state.stages[e.stage]=e.status;renderStages();
      episode.events.push(e);
      if(e.stage===2&&e.status==='passed')episode.generatedCode=plan.code;
      if(e.stage===3&&(e.status==='passed'||e.status==='failed'))episode.validation=structuredClone(plan.checks);
      if(e.stage===4&&e.status==='failed')episode.flashStatus='failed';
      if(e.stage===5&&e.status==='failed')episode.executionFeedback='no_motion_confirmed';
      if(state.mode==='transparent'&&e.status==='running'){result(friendly[e.stage]+'…',stageDescriptions[e.stage]+'. All stages are simulated.','running');$('pipeline-note').textContent=e.stage===2?'Agent / Reasoning runs outside the robot in this scenario.':e.stage===3?'All three checks must pass before code can reach the board.':e.stage===4?'Validation passed. The simulated board is receiving the new program.':'The agent generates a program. The robot executes it.';}
    },
    onDeploy:()=>{episode.flashStatus='passed';},
    onExecute:action=>{episode.executionFeedback='running';animateAction(action);}
  });
  episode.outcome=outcome.outcome;episode.durationMs=Math.round(performance.now()-start);episode.endedAt=new Date().toISOString();episode.trueCause=outcome.outcome==='failed'?plan.cause:outcome.outcome==='cancelled'?'operator_stop':null;
  if(outcome.outcome==='completed'){
    episode.executionFeedback='confirmed';state.context={...plan.action,command};state.contextExpired=false;renderContext();
    result('Action complete',state.mode==='transparent'?`${plan.detail} The agent produced the program; Rover 01 ran it.`:'The requested action is complete.','completed');$('opaque-status').textContent='Action complete.';
    if(state.scenario==='wm4'&&state.fault==='context')setCommand('Do that again');
    $('pipeline-note').textContent='Validated → flashed → executed. Feedback confirmed the action.';
  }else if(outcome.outcome==='failed'){
    result(state.mode==='transparent'?plan.title:'Something went wrong',state.mode==='transparent'?`${plan.detail} ${plan.recovery}`:'The command could not be completed. Try again.','failed');$('opaque-status').textContent='Error. Command not completed.';$('pipeline-note').textContent=episode.flashStatus==='passed'?'Code was flashed. Execution feedback did not confirm the action.':'Execution did not begin. No new action was performed.';
    $('recovery-button').hidden=state.mode==='opaque'||state.participant;
  }else{
    episode.interrupted=true;if(episode.executionFeedback==='running')episode.executionFeedback='stopped_by_operator';result('Stopped by you','The episode was interrupted. No further pipeline stages will run.','ready');$('opaque-status').textContent='Stopped by you.';$('pipeline-note').textContent='Operator stop. This episode is marked as interrupted in the log.';
    state.stages=state.stages.map(s=>s==='waiting'?'skipped':s);renderStages();
  }
  episode.contextAfter=state.context?structuredClone(state.context):null;
  $('arena').classList.remove('blinking');$('robot-state').textContent=outcome.outcome==='completed'?'Action complete · stationary':'Stationary';
  state.episodes.push(episode);$('episode-count').textContent=`${state.episodes.length} recorded episode${state.episodes.length===1?'':'s'}`;setBusy(false);$('response-panel').hidden=false;
  return {id:episode.id,outcome:episode.outcome};
}
function exportLog(){const data={schemaVersion:'1.0',prototype:'Middle Layer',paper:'Mind the Middle Layer',notice:'Raw simulator interaction records, not empirical study findings. All system events are simulated. Reflections are only user-entered text; no mental-model scores are inferred.',exportedAt:new Date().toISOString(),session:state.session,retention:'Memory only; export is user-initiated. Refresh or reset clears the session.',notices:state.notices,episodes:state.episodes};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`middle-layer-session-${state.session}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`Exported ${state.episodes.length} recorded episodes.`);}
function showTrace(){if(!state.last||!state.last.episode.outcome){toast('Complete a command to inspect its episode.');return;}const e=state.last.episode;$('trace-heading').textContent=`Episode ${e.id}`;$('trace-content').innerHTML=`<p>Simulated provenance, recorded at each reached stage. No real program was compiled or flashed.</p><div class="trace-meta">${[['CONDITION',e.condition],['SCENARIO / FAULT',e.scenario+' / '+e.injectedFault],['COMMAND',e.command],['TRUE CAUSE',e.trueCause||'No failure'],['FLASH STATUS',e.flashStatus],['EXECUTION',e.executionFeedback],['ELAPSED',`${(e.durationMs/1000).toFixed(2)} seconds`],['CONTEXT EXPIRED',String(e.contextExpired)]].map(([k,v])=>`<div><strong>${k}</strong>${escape(v)}</div>`).join('')}</div><h3>Illustrative generated code</h3><pre>${escape(e.generatedCode||'No code was generated in this episode.')}</pre><h3>Simulated validation</h3>${e.validation.length?`<ul>${e.validation.map(v=>`<li><strong>${escape(v.name)} · ${v.status}</strong> — ${escape(v.detail)}</li>`).join('')}</ul>`:'<p>Validation was not reached.</p>'}<h3>Recorded events</h3><table class="trace-events"><thead><tr><th>Stage</th><th>State</th><th>Time</th></tr></thead><tbody>${e.events.map(v=>`<tr><td>${escape(v.name)}</td><td>${escape(v.status)}</td><td>${escape(v.at.slice(11,23))}</td></tr>`).join('')}</tbody></table>`;$('trace-dialog').showModal();}
function resetSession(){state.episodes=[];state.last=null;state.context=null;state.contextExpired=false;state.version='1.0';state.maxDuration=5;state.notices=[];state.session++;$('update-notice').hidden=true;$('firmware-status').textContent='Firmware 1.0 · max 5 s motion';$('episode-count').textContent='0 recorded episodes';$('session-label').innerHTML=`SESSION ${String(state.session).padStart(2,'0')} <span class="dot"></span>`;chooseScenario('normal');$('reset-dialog').close();toast('New session started. Previous records have been cleared.');}
$('fault-select').innerHTML=Object.entries(FAULTS).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');
$('requirements-list').innerHTML=REQUIREMENTS.map(([id,name,desc])=>`<div class="reference-item"><strong><span>${id}</span>${name}</strong><p>${desc}</p></div>`).join('');
$('taxonomy-list').innerHTML=TAXONOMY.map(([id,name,desc])=>`<div class="reference-item"><strong><span>${id}</span>${name}</strong><p>${desc}</p></div>`).join('');
$('scenario-list').addEventListener('click',e=>{const b=e.target.closest('[data-scenario]');if(b)chooseScenario(b.dataset.scenario);});
$('command-form').addEventListener('submit',e=>{e.preventDefault();void submitCommand();});
$('command-input').addEventListener('input',updateCount);
$('command-input').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();void submitCommand();}});
$('fault-select').addEventListener('change',e=>{state.fault=e.target.value;toast('Fault changed. The next command uses this setting.');});
for(const m of ['opaque','transparent'])$(m+'-button').addEventListener('click',()=>setMode(m));
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>{setCommand(b.dataset.command);$('command-input').focus();}));
$('stop-button').addEventListener('click',()=>{state.controller?.abort();$('arena').classList.remove('blinking');$('robot-state').textContent='Stopped';// Freeze the visual at its current position rather than letting a CSS transition keep moving.
  for(const id of ['rover-position','rover-turn']){const el=$(id);const transform=getComputedStyle(el).transform;el.style.transition='none';el.style.transform=transform;}
});
$('guide-button').addEventListener('click',()=>$('guide-dialog').showModal());
$('trace-button').addEventListener('click',showTrace);
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('facilitator-button').addEventListener('click',()=>{state.participant=!state.participant;document.body.classList.toggle('participant',state.participant);$('facilitator-button').textContent=state.participant?'Exit participant view':'Participant view';$('facilitator-button').setAttribute('aria-pressed',String(state.participant));$('page-description').textContent=state.participant?'Send a command and observe what happens.':'See what happens between a command and an action.';$('recovery-button').hidden=true;});
$('export-button').addEventListener('click',exportLog);
$('reset-button').addEventListener('click',()=>$('reset-dialog').showModal());
$('confirm-reset').addEventListener('click',resetSession);
$('update-button').addEventListener('click',()=>{if(state.version==='1.1'){toast('Firmware 1.1 is already active. Reset the session to restore 1.0.');return;}state.version='1.1';state.maxDuration=3;const notice={at:new Date().toISOString(),type:'firmware_update',from:'1.0',to:'1.1',change:'Maximum motion duration reduced from 5 seconds to 3 seconds.',visible:state.mode==='transparent'};state.notices.push(notice);$('update-notice').textContent='System change · Firmware 1.1 now limits motion to 3 seconds (previously 5). Longer actions will be blocked in validation. R8 / WM7';$('update-notice').hidden=false;$('firmware-status').textContent='Firmware 1.1 · max 3 s motion';toast('Update fixture applied. Try a 4-second movement command.');});
$('recovery-button').addEventListener('click',()=>{if(!state.last)return;const {plan,episode}=state.last;episode.recoverySelectedAt=new Date().toISOString();if(['generated_code','agent_unavailable','input_delivery','upload_failure','motor_feedback'].includes(plan.cause)){state.fault='none';$('fault-select').value='none';toast('Injected fault removed. Send the command to retry.');}else{setCommand('Move forward for 2 seconds');toast('Full supported command loaded. Send it when ready.');}$('recovery-button').hidden=true;$('command-input').focus();});
$('response-form').addEventListener('submit',e=>{e.preventDefault();const episode=state.last?.episode;if(!episode?.outcome)return;episode.reflection={explanation:$('reflection').value,confidence:$('confidence').value?Number($('confidence').value):null,savedAt:new Date().toISOString()};$('response-saved').textContent=`Saved to ${episode.id} in this tab. Export the session to keep it.`;});
// Optional browser-native agent interface; UI and tools share the same actions.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'run_robot_simulation',title:'Run a simulated robot command',description:'Submit a command using the current visible scenario and interface. Runs only a local simulation.',inputSchema:{type:'object',properties:{command:{type:'string',minLength:1,maxLength:240}},required:['command'],additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(typeof input?.command!=='string'||!input.command.trim()||input.command.length>240||Object.keys(input).some(k=>k!=='command'))throw new Error('Provide one nonempty command, at most 240 characters.');if(state.busy)throw new Error('An episode is already running.');setCommand(input.command);return await submitCommand();}},{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional API; the manual interface remains available. */}}
renderScenarios();renderStages();renderContext();updateCount();
