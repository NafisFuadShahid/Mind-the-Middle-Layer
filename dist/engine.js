// Deterministic experimental apparatus. No LLM, compiler, transport or hardware is invoked.
export const STAGES = ['Input / Perception', 'Capability check', 'Agent / Reasoning', 'Code Validation', 'Deployment', 'Execution & Feedback'];
export const MANIFEST = Object.freeze({device:'Rover 01', board:'ESP32', id:'SIM-ESP32-01', version:'1.0', sensors:['Wheel encoders'], actuators:['Left motor','Right motor','Status LED'], absent:['Camera','Microphone','Distance sensor','Gripper'], limits:{maximumDurationSeconds:5, turnDegrees:90}});
export const SCENARIOS = [
  {id:'normal',tag:'00',title:'A simple command',detail:'Follow a successful command through every layer.',command:'Move forward for 2 seconds',fault:'none',probe:'What happens between submitting a command and the robot moving?'},
  {id:'wm2',tag:'WM2',title:'Where did it fail?',detail:'An error in generated code leaves the motors still.',command:'Move forward for 2 seconds',fault:'code',probe:'What caused the failure? What would you try next?'},
  {id:'wm3',tag:'WM3',title:'A capability boundary',detail:'A request needs a camera that is not installed.',command:'Find the red ball',fault:'capability',probe:'Could this robot find a red ball? What would it need?'},
  {id:'wm4',tag:'WM4',title:'A missing memory',detail:'Complete one action, then repeat it after context expires.',command:'Move forward for 2 seconds',fault:'context',probe:'Why did the follow-up fail? Where was the earlier instruction held?'},
  {id:'wm6',tag:'WM6',title:'Who does the thinking?',detail:'The agent is unavailable while the robot stays connected.',command:'Turn left',fault:'agent',probe:'Where is the command interpreted? Why can a connected robot still fail to act?'}
];
export const FAULTS = {none:'No injected fault', code:'Generated-code error', input:'Input delivery failure', deployment:'Upload failure', execution:'Motor feedback failure', capability:'Missing camera', context:'Context expires on follow-up', agent:'Agent service unavailable'};
export const REQUIREMENTS = [
 ['R1','Capability registration','A simulated connection handshake registers the ESP32 identity and manifest.'],
 ['R2','Grounded refusal','Unsupported requests stop before code generation; no partial motion is fabricated.'],
 ['R3','Validate before flash','Simulated static, dry-run and safety checks must all pass before deployment.'],
 ['R4','Episode provenance','Exports include command, illustrative code, checks, flash state, feedback, versions and injected fault.'],
 ['R5','Layer-specific feedback','Transparent mode identifies input, capability, agent/code, deployment and execution failures.'],
 ['R6','Pipeline legibility','Six visible stages and an on-request technical trace expose the middle layer.'],
 ['R7','Context visibility','The interface shows the last available action and explicitly marks context expiry.'],
 ['R8','Change notice','A facilitator can simulate a firmware update and surface the notice in transparent mode.']
];
export const TAXONOMY = [
 ['WM1','Uneven language/code competence','Language- or board-dependent performance misread as a broken robot. Reference only; no bilingual experiment implemented.'],
 ['WM2','Undiagnosed fault source','Distinct causes treated as one permanent failure. Controlled code, input, deployment and execution faults.'],
 ['WM3','No model of actual capabilities','Assuming the robot can do anything expressible in language. Camera-dependent request.'],
 ['WM4','Context-window / memory limits','Context loss misread as forgetting or ignoring. Two-step action and follow-up.'],
 ['WM5','Trust miscalibration','Early successes read as guaranteed reliability. Reference only; no validated trust measure.'],
 ['WM6','Mislocated intelligence','Reasoning attributed to the robot rather than the hidden agent. Agent unavailable, board still connected.'],
 ['WM7','Silent system change','Changed model/firmware behavior violates expectations. Optional update demonstration reduces the motion limit.']
];
export function parseCommand(command, context) {
  const q=command.toLowerCase().trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
  if (/^(do that again|repeat( that)?|again)(,? but slower)?$/.test(q)) return context ? {...context, repeat:true, slower:q.includes('slower')} : {error:'context'};
  if (/\b(ball|camera|see|look|recognize|recognise|photo|color|colour)\b/.test(q)) return {error:'capability'};
  if (/^(please )?stop( now)?$/.test(q)) return {kind:'stop',duration:0};
  if (/^(please )?(blink( the)?( status)? led|blink( the)? light)$/.test(q)) return {kind:'led',duration:1};
  const turn=q.match(/^(please )?turn (left|right)( (by )?90 degrees)?$/);
  if(turn) return {kind:turn[2],duration:1};
  const move=q.match(/^(please )?(move|go) (forward|backward|backwards)( for (\d+(?:\.\d+)?|one|two|three|four|five) (seconds?|s))?$/);
  if(move) { const words={one:1,two:2,three:3,four:4,five:5}; return {kind:move[3].startsWith('back')?'backward':'forward',duration:move[5] ? (words[move[5]] || Number(move[5])) : 2}; }
  return {error:'unsupported'};
}
export function createPlan({command, fault='none', context=null, maximumDuration=5}) {
  const action=parseCommand(command, context);
  const plan={action,failAt:null,cause:null,title:'Action complete',detail:'Execution feedback confirms the requested action in the simulator.',recovery:'You can send another command.',code:null,checks:[],flash:'not_attempted',feedback:'not_started'};
  function fail(stage,cause,title,detail,recovery) { return Object.assign(plan,{failAt:stage,cause,title,detail,recovery}); }
  if(fault==='input') return fail(0,'input_delivery','Input was not delivered','The simulated text input adapter dropped the command before it reached the agent. The robot did not receive new code.','Retry after the facilitator removes the input fault.');
  if(action.error==='capability') return fail(1,'missing_camera','This robot cannot see','The registered capability manifest has no camera. Finding a red ball needs visual input; no code was generated or deployed.','Try “Move forward for 2 seconds” or use a device with a camera.');
  if(action.error==='unsupported') return fail(1,'unsupported_command','This command is outside the demo’s capabilities','The simulator accepts one supported action at a time. No action has been attempted.','Try “Turn left”, “Blink LED”, “Stop”, or “Move forward for 2 seconds”.');
  if(fault==='agent') return fail(2,'agent_unavailable','The agent is unavailable','The simulated agent connection timed out. The ESP32 is connected, but cannot interpret this new request by itself. No new code was generated.','Restore the agent connection in facilitator controls, then retry.');
  if(action.error==='context') return fail(2,'context_expired','The earlier action is no longer in context','“Do that again” needs an earlier action in the agent’s active context. Context expiry does not indicate a robot memory or motor fault.','Restate the full command, for example “Move forward for 2 seconds”.');
  const speed=action.slower?0.1:0.2;
  plan.code=`// Illustrative ESP32 control program — not compiled\n// Bounded action; execution ends with motors stopped\nvoid runCommand() {\n  ${action.kind==='led'?'blinkLED(1000);':action.kind==='stop'?'stopMotors();':action.kind==='left'||action.kind==='right'?`turnDegrees(${action.kind==='left'?'-90':'90'});`:`drive(${action.kind==='backward'?'-':''}${speed.toFixed(1)});\n  delay(${Math.round(action.duration*1000)});`}\n  ${fault==='code'?'stopMotorz(); // injected undefined function':'stopMotors();'}\n}`;
  plan.checks=[{name:'Static check',status:fault==='code'?'failed':'passed',detail:fault==='code'?'Unknown function: stopMotorz().':'All illustrative calls resolve.'},{name:'Dry run',status:fault==='code'?'skipped':'passed',detail:'Simulated termination check.'},{name:'Safety check',status:fault==='code'?'skipped':action.duration>maximumDuration||action.duration<=0&&action.kind!=='stop'?'failed':'passed',detail:`Motion duration must be > 0 and ≤ ${maximumDuration} s; stop is always allowed.`}];
  if(fault==='code') return fail(3,'generated_code','Generated code did not pass validation','Static check found an undefined function: stopMotorz(). Deployment was blocked; the robot was not flashed.','Regenerate after the facilitator removes the injected code fault. The motors do not need replacing.');
  if(plan.checks.some(c=>c.status==='failed')) return fail(3,'safety_limit','The command exceeds the safety envelope',`The simulated safety check blocked the program. Motion must last more than 0 and at most ${maximumDuration} seconds. The robot was not flashed.`,`Use a motion duration from 1 to ${maximumDuration} seconds.`);
  if(fault==='deployment') return fail(4,'upload_failure','Deployment failed','Validation passed, but the simulated upload received no acknowledgement. The new program was not executed.','Restore the simulated upload connection, then retry.');
  if(fault==='execution') return fail(5,'motor_feedback','Execution was not confirmed','The code passed validation and was flashed, but simulated wheel encoders reported no motion. The motors were stopped.','Inspect the motor/encoder connection before retrying.');
  return plan;
}
export async function runPipeline(plan,{wait=(ms)=>new Promise(r=>setTimeout(r,ms)),onStage=()=>{},onDeploy=()=>{},onExecute=()=>{},signal,stepMs=650}={}) {
  const events=[];
  const record=(stage,status)=>{const e={stage,name:STAGES[stage],status,at:new Date().toISOString()};events.push(e);onStage(e);};
  for(let stage=0;stage<STAGES.length;stage++) {
    if(signal?.aborted) return {outcome:'cancelled',events};
    record(stage,'running');
    await wait(stage===2?stepMs*1.5:stepMs);
    if(signal?.aborted) {record(stage,'cancelled');return {outcome:'cancelled',events};}
    if(plan.failAt===stage) {record(stage,'failed');for(let next=stage+1;next<6;next++) record(next,'skipped');return {outcome:'failed',events};}
    if(stage===4) onDeploy();
    if(stage===5) {
      onExecute(plan.action);
      await wait(Math.min(plan.action.duration,5)*500+250);
      if(signal?.aborted){record(stage,'cancelled');return {outcome:'cancelled',events};}
    }
    record(stage,'passed');
  }
  return {outcome:'completed',events};
}
