# Mind the Middle Layer — HCI demo

A polished, local HCI prototype based on Md Akib Haider's **Mind the Middle Layer: A Requirements-Driven Study of Wrong Mental Models in LLM-Agent-Controlled Robots** (`hci.pdf`, working draft, 2026), especially Table 1, §5–7 and Table 2. This implements the current plan's opaque-vs-transparent comparison and four priority scenarios.

**All LLM, code-generation, validation, deployment and robot behavior is simulated.** No hardware, API key, account, package installation or internet service is required. There are no fabricated participant records, study findings, scores or claims of effectiveness.

## Start locally

Requires Node.js 18 or newer. Clone this repository and enter its folder:

```sh
git clone https://github.com/NafisFuadShahid/Mind-the-Middle-Layer.git
cd Mind-the-Middle-Layer
```

Then start the demo:

```sh
npm start
```

Open **http://127.0.0.1:4173**. Leave the terminal running; press Ctrl+C to stop. No `npm install` is needed. If that port is occupied:

```sh
PORT=4174 npm start
```

Then use http://127.0.0.1:4174.

Alternatively, from the project folder with Python 3:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Serve the `dist` folder over HTTP; opening `index.html` directly is not supported because it uses JavaScript modules. The server binds to loopback only. All assets, fonts and application code are local; there is no analytics, network API, camera or microphone access.

## Quick demonstration

1. Choose **WM2 — Where did it fail?** from the scenario library.
2. Select **A Opaque**, send the prefilled command. The robot stays still and returns a generic error.
3. Select **B Transparent**, resend the same command without changing the fault. The pipeline identifies Code Validation, shows downstream stages as not reached, and explains that the robot was not flashed.
4. Open **Inspect episode** for the command, illustrative generated code, simulated validation checks, flash state and execution feedback.
5. Try WM3, WM4 and WM6. The Study guide contains the paper mappings and scenario instructions.

Selecting a scenario resets active context and the visual pose, but preserves the episode log. Changing only interface condition changes presentation, not faults, firmware, context or simulated behavior. Each episode starts from the same visual origin. To repeat WM4 in another condition, select its scenario again and run both steps.

## Controls and supported commands

- `Move forward for 2 seconds` (also backward; 1–5 seconds, including decimals and English number words one–five).
- `Turn left`, `Turn right` (fixed 90-degree turns).
- `Blink LED`, `Stop`.
- `Do that again` or `Do that again, but slower` after a successful action is in context.
- `Find the red ball` demonstrates a missing-camera refusal.
- Unknown, ambiguous or compound commands are refused; this is bounded command matching, not an open-ended LLM.
- Submit with **Send command** or Ctrl/Cmd+Enter. The **Stop** button interrupts an in-flight episode.
- **Use suggested recovery** in facilitator/transparent mode loads a supported full command or removes the injected fault; it does not run automatically.
- The optional **Simulate firmware update** changes the motion limit from 5 s to 3 s; a 4-second command then fails safety validation. Transparent mode shows the R8 notice; opaque mode hides it. Reset restores version 1.0.

## Controlled scenarios

| Scenario | Task and injected condition | True source / stopping point | Expected transparent cue |
| --- | --- | --- | --- |
| Normal | Move forward for 2 seconds; no fault | All six stages pass | Generated → validated → flashed → executed |
| WM2 | Same command, undefined function in generated code | Code Validation | Static failure; no flash; motors need not be faulty |
| WM3 | Find the red ball; manifest has no camera | Capability check | Explicit capability refusal; no fabricated partial action |
| WM4 | First complete the full move command; then send the automatically loaded “Do that again” | Agent / Reasoning; context is expired immediately before the follow-up | Context no longer available; restate full command |
| WM6 | Turn left while the agent is unavailable | Agent / Reasoning | Robot connected; external agent unavailable; no new code |

The WM2 fault selector also supports text-input delivery, upload and motor-feedback faults, allowing the same command/no-motion observation to have distinguishable causes. Text-input delivery stands in for input-layer failures; a microphone failure is not implemented. The selected fault is a fixture setting, not always the cause: earlier failures take precedence. Use `trueCause` and reached stages in exported logs.

WM6 uses a simulated remote-agent timeout, one concrete instance of the paper's “intelligence is in the hidden agent” distinction. It does not claim every possible agent architecture is remote. The paper also permits local agents. WM1 and WM5 are reference-only; the bilingual and trust-calibration experiments are not implemented.

## Participant presentation and records

Choose the condition, scenario and fault before clicking **Participant view**. It hides the scenario library, explanatory scenario labels, fault controls, condition switch, study guide and technical trace. Transparent condition retains the intended capability, context, pipeline and failure explanations; opaque condition exposes generic progress and outcomes. Configure between tasks while the participant cannot see the screen. Participant view is not a security boundary: Exit participant view remains available.

The optional reflection asks what happened, what to try next and confidence (1–5). Responses are free text, not automatically scored. Save a reflection before starting another episode. Export the session before refreshing, closing or resetting. The log exists **only in this tab's memory** until the user downloads JSON. A new page/tab starts a new empty session. No participant identity is requested; keep any participant-to-session mapping separately under your study's data policy.

**Export session log** contains raw commands and saved reflections, so do not enter names or private information unnecessarily. The app never transmits exports. The JSON includes episode ID, interface, scenario, selected fault, actual failure cause, manifest, model/firmware version, command, code, checks, flash state, execution feedback, timestamps, context before/after, interruption status and optional reflection. Logs contain simulated system observations and any actually entered reflections, not empirical conclusions.

See `docs/STUDY_PROTOCOL.md` for a short facilitator script and `docs/PAPER_MAPPING.md` for requirements traceability. The paper's planned full study is not claimed as completed.

## Verification

```sh
npm run check
npm test
```

The dependency-free Node tests verify stage ordering, failure routing, validate-before-flash, context behavior, bounded command interpretation, firmware-dependent safety limits, interruption and condition parity. Browser checks were also performed during implementation; details are in `docs/QA.md`.

## Files

- `dist/index.html`, `dist/styles.css`: accessible responsive interface and inline SVG rover.
- `dist/engine.js`: deterministic command parser, scenario definitions and pipeline runner.
- `dist/app.js`: condition presentation, instrumentation, animation, reflections and export.
- `server.mjs`: minimal local static server.
- `tests/engine.test.mjs`: safety/order and behavior tests.
- `docs/`: run/study context, traceability and validation notes.

The optional browser WebMCP tool `run_robot_simulation` uses the same command submission path; unsupported browsers simply use the normal UI.

## Limits relevant to the report

- Firmware is illustrative text; there is no real compilation, flashing, hardware telemetry or LLM reasoning. Validation is a deterministic simulation, not physical safety certification.
- Motion is an SVG approximation with compressed timing, not a physics model. Each episode resets the pose to keep trials comparable. A cancelled motion freezes at its current visible position until the next episode.
- Timing measures include scripted delays, UI scheduling and possible browser throttling. They are not hardware or model latency benchmarks.
- The interface conditions bundle several disclosure changes; a measured difference would not isolate a single explanation feature.
- Counterbalance condition order and use the same scenario/fault settings. A transparent-first exposure can teach participants the pipeline and contaminate subsequent opaque trials.
- Use the consent and institutional approval process described in the paper before collecting human-subject data. This prototype is apparatus and does not supply that approval or a validated instrument.
