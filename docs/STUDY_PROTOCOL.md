# Short facilitator protocol (draft apparatus guide)

This supports the proposed pilot; it is not a validated instrument or a completed study. Do not interpret test runs or demonstration logs as participant results. Follow the consent, voluntary participation, pseudonymization and institutional approval provisions in §3.3 of the paper.

## Before a participant

1. Record a pseudonymous participant code outside the app. Do not enter identity into the command field or reflections.
2. Plan an A→B or B→A assignment, balanced across participants. Record order and any deviations. A between-subjects design avoids direct learning carryover but needs a separately justified sampling plan.
3. Export any previous session, then Reset session. Firmware must be 1.0 for the four main scenarios. Keep screen/device and task language consistent.
4. With the participant not looking, choose the interface condition and task; then enable Participant view. Do not reveal the WM code, injected cause or expected answer beforehand. This view hides teaching material but is not locked against a curious participant.
5. Say: “This is a simulated robot-control interface. Some tasks may not complete. Please describe what you expect to happen and what you think is happening as you use it. You can skip an answer or stop.” Avoid teaching the hidden pipeline at baseline.

## Tasks and ground truth (facilitator only)

| Task | Participant instruction | Setup | Expected observation / true cause |
| --- | --- | --- | --- |
| Warm-up | “Make the robot move forward for two seconds.” | Normal; no injected fault | Successful bounded movement |
| WM2 | “Make the robot move forward for two seconds. Explain what happened.” | WM2 / generated-code error | No movement; undefined function fails static validation; no flash |
| WM3 | “Ask the robot to find the red ball.” | WM3 / missing camera | No movement; manifest excludes camera; graceful refusal |
| WM4 step 1 | “Make the robot move forward for two seconds.” | Select WM4 afresh; context-expiry fixture | Successful action becomes active context |
| WM4 step 2 | “Ask it to do that again.” | Keep same scenario; submit prefilled follow-up | Context expires immediately before follow-up; agent cannot resolve reference; no code/flash |
| WM6 | “Ask the robot to turn left. Explain what happened.” | WM6 / agent unavailable | Board remains connected; agent timeout blocks generation |

Optional WM2 variants use the same motion command with input-delivery, upload or motor-feedback fault. Do not substitute microphone failure: this text-first prototype has no microphone. Optional WM7 requires a separate task plan (e.g. run a 4-second command before and after the simulated firmware update).

## After each episode

- Ask, without suggesting a layer: “What do you think happened? What would you try next?”
- Collect the optional explanation and confidence in the post-episode panel; click Save reflection before advancing. For richer think-aloud data, use your separately consented recording/notes process; the app does not record audio.
- Useful neutral follow-ups: “What supports that explanation?” and “What would the system need to do this task?” Ask where interpretation happens only as a planned probe, consistently across conditions.
- Do not assign a WM category from a failure alone. Compare the participant's actual explanation with logged true cause. Keep correct diagnoses and negative cases.
- For WM6, failure itself does not establish agency attribution. Probe the participant's model of where interpretation occurs and what the controller does.

## Changing condition and ending

- Have the participant look away; exit Participant view, choose the next condition and reselect the same scenario to clear active context, then re-enable Participant view.
- WM4 always repeats both steps, not just the failing follow-up. Keep firmware version and injected fault identical across comparisons.
- Stop interrupts an episode; the record is marked interrupted. Treat interrupted episodes separately rather than counting them as fault-localization failures.
- Export JSON before closing, refreshing or resetting. Save it to your approved study storage using the separate pseudonymous code. Inspect counts and verify a reflection was saved for the intended episode.
- Debrief the controlled faults and pipeline after all measured tasks. Provide an opportunity for questions and withdrawal according to your approved protocol.

## Analysis guardrails

Exports are raw simulator provenance, not a results table. No participants or responses are preloaded. Ground-truth fault, condition, session order and actual explanation must be linked before manual coding. Do not report the paper's proposed n≈100 or hypothetical examples as collected data. A planned 6–8-person think-aloud pilot remains future work until actually conducted. The bundled confidence item is a convenience, not a validated mental-model accuracy scale.
