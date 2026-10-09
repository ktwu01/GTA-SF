# Historical district verification

Reviewed on October 9, 2026 against the dedicated production build at `http://127.0.0.1:4177/`.

The visualization, pedestrian modeling, animation, dialogue UI, and minimap implementation were assigned explicitly to **gpt-6-astra**. Public historical records and project code were the only task materials shared with the agents.

## Build and evidence checks

- The dedicated TypeScript check and Vite production build pass.
- Ten navigation and conversation regression tests pass. They cover compass rotation, radar clamping, walkable routes, camera coordinate accessors, sight lines, conversation distance, pause, boarding, and reset.
- The reference checker validates 16 film frames, 10 independent photographs or postcards, and 28 image hashes. Alternate scans and publication evidence do not inflate the 26-view count.
- All 14 material derivatives have source IDs, recorded transformations, and matching file hashes.
- All 26 archive images decoded after scrolling through the lazy-loaded gallery.
- The original repository-wide test baseline depends on unavailable city Git LFS assets and Unreal outputs. It is not a passing validation claim for this separate experience.

## Browser checks

Chrome's native controls failed with `cgWindowNotFound`, and its extension controls failed authentication. Interaction testing therefore used the user's authorized Aside CLI fallback. Only the local historical application was inspected.

Desktop testing used an active browser tab at 1440 × 900 CSS pixels. Mobile testing used 390 × 844 CSS pixels with a device scale factor of 2. Mobile results describe desktop browser emulation, not physical-phone performance.

| Flow | Observed result |
| --- | --- |
| Opening and replay | Replay returns to the film; Step inside re-enters the scene. Conversations and discoveries clear. |
| Street population | Snapshot reports 104 people. The opening shows pedestrians crossing tracks, walking on sidewalks, and talking in pairs. |
| Walk and heading | Keyboard and pointer-held touch buttons move the player. Turning updates the rotating map and compass. |
| Talk | F and the touch prompt start an exchange. A head-anchored bubble shows the greeting. |
| Reply and directions | Keyboard 1 and the touch reply button show the answer. Directions select the matching map destination. |
| Close-range dialogue | A greeting remains readable at approximately 3.2 meters. Looking upward moves the bubble offscreen and shows the utterance in the conversation card. |
| Map selection | Coffee house and Ferry arcade selections update the goal, route, and finite meter distance. |
| Discovery | Walking from the arcade review position to within 4 meters triggers the discovery toast and map progress. Replay clears it. |
| Board and drive | Boarding moves the player onto the streetcar. Guided travel and manual acceleration move it along the route. |
| Brake and reverse | Space brakes to zero; R changes direction; subsequent acceleration moves the car backward. |
| Disembark | E stops the car and returns to walking. |
| Archive and comparison | Both pause simulation. Pedestrian positions remain identical across paused samples. Closing returns control to the street. |
| Paused reply | An inspector-triggered reply while the archive is open leaves the conversation at its greeting. |
| Mobile controls | Pointer-held throttle accelerates to about 2.29 m/s; the brake returns to zero. Map, replies, walking controls, and driving controls fit. |
| Mobile layout | Document width and scroll width both equal 390 pixels. Actual screenshots show no control overlap. |

The first map capture exposed an invalid distance caused by spreading a Babylon vector with prototype coordinate accessors. Explicit coordinate copying fixed it. A regression test now exercises accessor-backed coordinates. The clock also received a light backing for contrast against dark windows.

## Measured rendering

The previous commit's active-tab baseline had 44 pedestrians. Ten guided-ride samples all reported 60 FPS, with 479–502 draw calls; its opening sample had 523 draw calls.

With the new crowd, ten guided-ride samples reported **59.9–60.1 FPS** and **594–610 draw calls**. The streetcar moved from z=358.98 to z=374.52 during these samples. The opening sample reported 632 draw calls. Between 38 and 40 people occupied the roadway during the sampled ride. Captured application error arrays were empty.

The geometry inventory reports **193,286 unique source triangles** and **710,970 triangles after counting thin instances**. These are scene inventory counts, not measured triangles submitted in each frame. The latter includes distant instances hidden by zero scale. Inactive-tab frame rates are excluded because background throttling distorts the comparison. These short local samples do not establish performance on other hardware.

## Visual review and limits

Actual renders were inspected for street density, clothing and carried objects, speech anchoring, text contrast, minimap orientation, conversation choices, mobile driving, destination selection, and discovery feedback. Earlier MVP review also covered the Ferry frontage, arcade, source comparison, and architectural correspondence with the 1901 postcard, 1905 terminal photograph, and 1906 film.

The district remains a source-informed procedural reconstruction. People and horses are visibly stylized. It is not a photogrammetric or surveyed digital twin. Neighboring dimensions and colors are inferred, shops are exterior scenery, and traffic has local pedestrian yielding rather than a general collision simulation. The map and sight-line rectangles are schematic. Dialogue is original fictional writing informed by period publications; it is not a transcript of the silent film.

## Local evidence

Current captures and state records are under `artifacts/historical-sf/street-life/`:

- `conversation-desktop.jpg` and `mobile-talk.jpg` show the conversations.
- `release-street-life.jpg` and `release-smoke.json` verify the final production build after reset and pause fixes.
- `mobile-map.jpg`, `mobile-drive.jpg`, and `mobile-discovery.jpg` show the mobile flows.
- `desktop-regression.json` and `mobile-regression.json` record interaction and rendering samples.
- `baseline-performance.json` records the earlier crowd's active-tab baseline.

The initial `street-life-desktop.jpg` records the map distance defect before correction. Generated browser artifacts are excluded from Git. Source provenance, research, tests, and this review are committed.
