import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,parseCommand,runPipeline} from '../dist/engine.js';
const fast={wait:async()=>{}};
test('valid commands traverse all stages in order; deployment precedes motion',async()=>{
  const calls=[]; const p=createPlan({command:'Move forward for 2 seconds'});
  const r=await runPipeline(p,{...fast,onDeploy:()=>calls.push('flash'),onExecute:a=>calls.push(a.kind)});
  assert.equal(r.outcome,'completed');assert.deepEqual(calls,['flash','forward']);
  assert.deepEqual(r.events.filter(e=>e.status==='passed').map(e=>e.stage),[0,1,2,3,4,5]);
});
for(const [fault,stage,cause,flashed] of [['input',0,'input_delivery',false],['code',3,'generated_code',false],['deployment',4,'upload_failure',false],['execution',5,'motor_feedback',true],['agent',2,'agent_unavailable',false]]){
  test(`${fault}: exact fault source and no execution beyond failure`,async()=>{let deploy=false;let execute=false;const p=createPlan({command:'Move forward for 2 seconds',fault});const r=await runPipeline(p,{...fast,onDeploy:()=>deploy=true,onExecute:()=>execute=true});assert.equal(p.cause,cause);assert.equal(p.failAt,stage);assert.equal(r.outcome,'failed');assert.equal(deploy,flashed);assert.equal(execute,false);assert.ok(r.events.filter(e=>e.stage>stage).every(e=>e.status==='skipped'));});
}
test('WM3 refuses absent camera before generation, even with another fault selected',async()=>{const p=createPlan({command:'Find the red ball',fault:'code'});assert.equal(p.cause,'missing_camera');assert.equal(p.code,null);const r=await runPipeline(p,fast);assert.equal(r.events.find(e=>e.status==='failed').stage,1);});
test('WM4 resolves available context and blocks missing context',()=>{const prior=parseCommand('Move forward for 2 seconds');const good=createPlan({command:'Do that again, but slower',context:prior});assert.equal(good.failAt,null);assert.equal(good.action.slower,true);const lost=createPlan({command:'Do that again',context:null});assert.equal(lost.cause,'context_expired');assert.equal(lost.failAt,2);assert.equal(lost.code,null);});
test('empty, ambiguous, compound and unsupported requests never become partial actions',()=>{for(const command of ['', 'hello', 'move forward and turn left','Move forward for -3 seconds','Fly up','Move forward for 2 hours']){assert.equal(createPlan({command}).cause,'unsupported_command');}});
test('safety envelope prevents zero or too-long motion and changes with firmware',()=>{for(const duration of [0,6,999]){const p=createPlan({command:`Move forward for ${duration} seconds`});assert.equal(p.failAt,3);assert.equal(p.cause,'safety_limit');}assert.equal(createPlan({command:'Move forward for 4 seconds',maximumDuration:5}).failAt,null);assert.equal(createPlan({command:'Move forward for 4 seconds',maximumDuration:3}).cause,'safety_limit');assert.equal(createPlan({command:'Stop'}).failAt,null);});
test('operator stop before deployment cannot flash or execute',async()=>{const controller=new AbortController();let deploy=false;const r=await runPipeline(createPlan({command:'Turn left'}),{wait:async()=>controller.abort(),signal:controller.signal,onDeploy:()=>deploy=true});assert.equal(r.outcome,'cancelled');assert.equal(deploy,false);assert.ok(r.events.some(e=>e.status==='cancelled'));});
test('operator stop during execution records interruption',async()=>{const controller=new AbortController();const r=await runPipeline(createPlan({command:'Turn right'}),{...fast,signal:controller.signal,onExecute:()=>controller.abort()});assert.equal(r.outcome,'cancelled');assert.equal(r.events.at(-1).stage,5);});
test('condition is not an input to the simulator: equal command, context and fault produce equal plans',()=>{const a=createPlan({command:'Move forward for two seconds',fault:'code',condition:'opaque'});const b=createPlan({command:'Move forward for two seconds',fault:'code',condition:'transparent'});assert.deepEqual(a,b);});
