# Paper traceability

Source: Md Akib Haider, *Mind the Middle Layer: A Requirements-Driven Study of Wrong Mental Models in LLM-Agent-Controlled Robots*, working draft (2026), uploaded `hci.pdf`. Table 1 is on PDF page 3; architecture/operational flow and taxonomy summary on page 5; mitigations and evaluation on page 6.

The paper is explicitly a framework-and-plan contribution, with hypothetical worked examples. This app does not reuse those examples as observations.

| Paper ID | Prototype implementation | Scope / difference |
| --- | --- | --- |
| R1 | Simulated connect state and registered ESP32 capability manifest | Static fixture; no real peripheral enumeration |
| R2 | Capability gate refuses camera-dependent or unsupported commands before generation | Both conditions refuse identically; explanation appears only in transparent condition |
| R3 | Static, dry-run and safety check outcomes gate deployment | Deterministic checks, not compilation or certification |
| R4 | Per-episode command, code, validation, flash, feedback, true fault, timestamps and context in JSON | Memory-only until exported; no persistent backend |
| R5 | Distinct input, capability, agent/code, deployment and execution messages | Exposed in transparent condition; baseline intentionally hides causes |
| R6 | Input → capability check → LLM/code generation → validation → deployment → execution/feedback, plus optional trace | Agent is explicitly separate from the board in this remote-agent fixture |
| R7 | Last available action; visible context expiry; two-step follow-up task | Deterministic expiry at follow-up instead of a real token window |
| R8 | Optional firmware notice; max duration changes 5 s → 3 s | State resets with a new session; baseline hides notice |

| Taxonomy | Paper terminology | Prototype scope |
| --- | --- | --- |
| WM1 | Uneven language/code competence read as “broken / got dumber” | Reference only; English parser cannot establish a multilingual model effect |
| WM2 | Undiagnosed fault source treated as a single permanent failure | Generated-code error; optional input, upload and execution-feedback failures |
| WM3 | No model of actual capabilities | Camera missing; R2 refusal prevents a fabricated partial action |
| WM4 | Context-window/memory limits misread as “forgetting / ignoring” | Prior completed action removed before a referential follow-up |
| WM5 | Trust miscalibration after early successes | Reference only; normal scenario does not constitute a trust study |
| WM6 | “The robot understood and chose” / mislocated intelligence | External agent unavailable while connected board cannot interpret a new request |
| WM7 | “It used to work” after silent model/firmware change | Optional firmware limit change with transparent-only notice |

The six-stage interface consolidates the paper's Input/Perception and command receipt, preserves the capability-manifest check before generation, combines compilation/flashing as Deployment, and retains Execution & Feedback. Each fault exits at a specific stage. The machine-readable manifest includes absent distance sensor and gripper as well as camera and microphone; the UI displays the most task-relevant subset.

Opaque and transparent conditions share the parser, pipeline, safety envelope, timing policy, failure injection and animation. Only visibility and message detail differ. The simulator never executes arbitrary code or connects to a physical device.
