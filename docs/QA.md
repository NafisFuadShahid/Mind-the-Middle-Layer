# Verification record

Implementation check, 20 September 2026 (Asia/Dhaka). These are software checks, not participant observations or research findings.

## Automated checks

`npm run check`: JavaScript syntax checks passed for app, engine and server.

`npm test`: 13 tests passed. Coverage includes complete stage order, five injected layer faults, camera refusal before generation, context available/lost, unsupported and compound command rejection, safety limits including firmware change, cancellation before deployment and during execution, and identical plans across interface conditions.

## Browser checks

Verified using the Codex in-app browser against the local server:

- Successful command completes the pipeline and moves the simulated rover.
- WM2 reports generated-code validation failure; trace contains code, failed static check, skipped subsequent checks, no flash and no execution.
- Opaque participant condition reports only generic processing/error. Scenario labels, fault control, context, capability manifest, pipeline and trace are not visible in its rendered accessibility tree.
- WM3 refuses a camera-dependent command before generating code.
- WM4 succeeds for the initial movement, then expires active context and fails the referential follow-up.
- WM6 reports an unavailable external agent while the board remains connected; removing the injected fault permits a successful retry.
- Reflection text and confidence save against the correct episode.
- Downloaded JSON parses successfully; six test episodes have expected conditions, true causes, flash status, context transition and the explicitly marked QA-only reflection. This test export is not bundled as study data.
- Optional firmware update changes the allowed motion duration; a four-second command is then blocked in validation with no flash.
- The visible Stop button produces an interrupted episode with no subsequent stages. Cancellation during execution is covered by the engine test; the brief animation interval was not reliably intercepted in browser automation.
- Desktop (1440 × 1000) and mobile-width (390 × 844) layouts inspected; mobile document width does not overflow the viewport. The scenario strip scrolls horizontally within its own container.
- The optional WebMCP action registers, runs the same command path and rejects an empty command without adding an episode.
- No browser console errors or warnings were observed in the checked session.

## Remaining validation boundaries

Not tested with physical hardware, an actual LLM, a real compiler, voice input, an independent accessibility audit, or human study participants. Keyboard focus styles, semantic controls, native dialogs, live outcome announcements and reduced-motion styling are implemented, but cross-browser and screen-reader certification is not claimed.
