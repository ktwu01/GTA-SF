# Free-roam vertical-slice review

Review date: 2026-10-09. Independent review of a compact historical street game. The benchmark is a polished, replayable district, not the geographic scale or production budget of a full GTA release. Historical subject matter and a small map do not excuse weak controls or absent gameplay.

## Evidence and scoring rules

The initial review inspected `main.ts`, `scene.ts`, `controls.ts`, `hud.ts`, `hud.css`, `dialogue.ts`, and `crowd.ts`. It also inspected the actual older `artifacts/historical-sf/street-life/release-street-life.jpg` and read the previous browser report in `qa.md`.

That image predates the interface simplification. It is evidence of the environment and prior clutter, not proof of the current HUD. Prior browser results do not certify changed input or pause code. Source inspection confirms implemented branches; it does not confirm how they feel, sound, or behave in Chrome.

**Current experience score: pending new browser evidence. A 90/100 claim is not supported.** The fixed rubric below will be applied to the integrated build. Unverified criteria remain unverified; they are not silently awarded full points or treated as confirmed failures.

## Fixed rubric: 100 points

| Category | Points | Allocation | Evidence required for a strong score |
| --- | ---: | --- | --- |
| Movement and camera | 20 | Walking/running/jumping 7; mouse look and aim 7; mode/focus transitions 6 | Direct controls work from entry, after dialogue, and after pause. Look has no jumps, stuck capture, or accidental movement. Boundaries and collisions are understandable. |
| Vehicle agency | 20 | Enter/drive/brake/reverse/leave 8; handling and feedback 6; purposeful vehicle play 6 | The player controls motion reliably and can perform a repeatable driving task with meaningful success or failure. Rail restriction is acceptable for a streetcar. |
| World reactivity and activities | 20 | Consequential activity loop 9; observable reactions 6; discovery/replay variation 5 | Accept, act, and finish a task in the world. NPC/world state changes visibly. Failure/retry or another outcome changes what the player does. A waypoint or badge alone earns little. |
| Audio and NPC interaction | 15 | Audible voiced exchange 6; movement/world audio 4; conversational behavior 5 | Speech is actually audible, interruptible, and synchronized with readable replies. World sounds respond to distance/motion. People react to the player and avoid obstructing play. |
| Visual immersion and minimal HUD | 15 | Environment/coherence 6; composition/character integration 4; unobstructed interface 5 | Current captures show the world dominating the frame, no persistent SF/archive branding, and only immediately useful prompts. Close-range NPCs and storefronts remain convincing within the chosen style. |
| Robustness | 10 | Main-loop regressions 4; fullscreen/pause/recovery 3; performance/responsive controls 3 | Native interaction evidence covers start, repeated pause/resume, fullscreen, dialogue, vehicle transitions, reset, and input cancellation. Representative active-tab samples and clean error state support performance. |

A credible 90 requires at least 18/20 movement, 18/20 vehicle, 17/20 world, 13/15 audio/NPC, 14/15 visuals, and 10/10 robustness, or an equally convincing distribution. This is attainable in one focused region with two short, polished loops. It does not require combat, police, multiplayer, or a larger city. Unreliable core controls or no audible speech prevents a 90 endorsement even if other criteria look good.

## Initial findings

The current source removes the large persistent title, clock, archive controls, destination card, and instruction strip from the gameplay frame. The 146-pixel radar and contextual action are a substantial improvement in intent. The previous actual image shows a coherent street, recognizable landmark silhouette, convincing tram detail, and period clothing. It also shows toy-like faces and hands, largely flat shopfronts, and excessive UI. A current capture must establish the actual improvement.

Walking, sprinting, jumping, drag look, requested mouse capture, tram acceleration, braking, stopped reversal, and disembarking have explicit implementations. Fullscreen/pause/mouse-capture event timing is under active change and needs native-browser verification. Merely invoking debug methods is insufficient evidence that advertised keys work.

At initial inspection, the only sound source is the synthesized tram bell. NPC exchanges are text only. Dialogue offers directions but no accepted job, carried item, transaction, passenger service, or persistent consequence. Pedestrians yield to nearby vehicles and turn toward a conversational partner; these are useful reactions but not a complete activity system. The streetcar offers control over speed and direction along one corridor, but no driving objective. Shops remain exterior scenery.

## Five highest-impact gaps

1. **Complete one consequential on-foot activity.** Give a named character a parcel delivery: explicit acceptance, visible parcel possession, a reachable named recipient, a handoff, acknowledgment, and a replay or alternate outcome. Let tram travel help complete it. Verify that cancel/reset cannot leave phantom cargo or double rewards.
2. **Make driving a playable skill.** Add two or three service stops with braking accuracy, a short dwell requirement, visible passenger pickup/drop-off, and a final service result. Overshooting should require a real recovery. A progress bar that advances automatically is insufficient.
3. **Make people audibly speak and the street audibly move.** Verify one full voiced greeting and response, cancellation when leaving or pausing, plus footsteps and wheel/rail sounds that change with motion. A synthesis API call or voice count alone does not prove audible output.
4. **Finish the native control lifecycle.** Test entry, mouse capture, Esc, repeated resume, fullscreen enter/exit, window blur, and held keys during each transition. Confirm that the next movement is immediately responsive and no input remains held. State snapshots must accompany actual key/pointer actions.
5. **Make player actions change nearby behavior.** Ringing the bell should produce a visible yield or acknowledgment; driving near a crowd must not ghost through people without response. Keep reactions readable and gameplay prompts sparse. Current desktop and narrow-screen captures must verify the claimed clutter reduction.

## Integration acceptance route

Start from the normal opening. Walk and run to a speaker, jump, and rotate the camera. Accept a task through a visible prompt. Board and drive using normal controls. Brake at a service stop, recover from an overshoot, reverse while stopped, and disembark. Complete the task through the recipient. Confirm the world and activity state changed. Repeat the loop after reset. Test Esc/resume and fullscreen during walking, driving, and dialogue. Measure an active traversal rather than an idle or background tab.

Record browser, viewport, build, evidence paths, observed audio, failures, and criterion-level points before publishing a final score. Do not turn this acceptance route into player-facing UI copy.
