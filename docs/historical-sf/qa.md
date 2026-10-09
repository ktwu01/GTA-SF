# Historical district verification

Reviewed on October 9, 2026 against the dedicated production build at `http://127.0.0.1:4177/`.

The visualization, modeling, materials, and interaction implementation was assigned explicitly to **gpt-6-astra**. Public archival records were the only research material shared with the agents.

## Build and evidence checks

- The dedicated TypeScript check and Vite production build pass.
- The reference checker validates 16 film frames, 10 independent photographs or postcards, and 28 image hashes. Alternate scans and publication evidence do not inflate the 26-view count.
- All 14 material derivatives have source IDs, recorded transformations, and matching file hashes.
- Both entry URLs, the four local fonts, normal map, source manifest, and archival film excerpt return HTTP 200 with the expected content types.
- All 26 images displayed in the archive decoded successfully in the browser.

## Browser checks

Chrome was used for the earlier scene review. Its native window controls subsequently failed with `cgWindowNotFound`, and its extension controls failed authentication. Final interaction testing used the user's authorized Aside CLI fallback. Only the local historical application was inspected.

The desktop flow was tested in an active browser tab. The mobile layout was tested at 390 × 844 CSS pixels with a device scale factor of 2. This is desktop browser emulation, not a physical-phone performance test.

| Flow | Observed result |
| --- | --- |
| Opening | Original film appears, and Step inside transitions to the playable scene. |
| Walk | Holding W moves the camera forward; dragging and arrow controls change the view. |
| Board | The starting streetcar is within boarding distance; the button moves the camera onto its platform. |
| Drive and brake | W accelerates and moves the car; Space brakes to zero. |
| Reverse | R reverses a stopped car; acceleration then moves it in the opposite direction. |
| Disembark | E stops the car and places the player beside its platform. |
| Guided route | The car travels the approach and stops at z=549.777 m with speed zero and guided mode off, before the Ferry facade. |
| Comparison | The original image overlay pauses movement; closing it restores the prior camera and riding mode. |
| Archive | Opening pauses movement; closing restores keyboard focus to the canvas. |
| Bell | The bell control executes without an application error; sound quality was not separately measured. |
| Apron boundary | Backtracking from the broad apron stops at the building edge while preserving lateral position. |
| Mobile controls | Holding the throttle and brake buttons accelerates and stops the car. Controls fit within the 390-pixel viewport without horizontal overflow. |

The active desktop samples were approximately 60 FPS. The scene contains about 213,000 indexed triangles; sampled draw calls vary with view, approximately 275–523. Captured application error arrays were empty during these flows. Inactive tabs were heavily throttled, so their frame rates are excluded.

## Visual review and limits

The review inspected the opening, streetcar platform, Ferry frontage and arcade, archive, comparison, and small-screen controls. The Ferry subdivisions and asymmetric terminal blocks were compared with the 1901 Ferry postcard, 1905 terminal photograph, and 1906 film views. Source crops are documented in the texture ledger.

This is a playable, source-informed reconstruction. It is not a photogrammetric or surveyed digital twin. People and horses remain simplified; neighboring building dimensions and colors are inferred. Shops are exterior scenery, and traffic does not have a general collision simulation. The archive gives access to the original records so visitors can distinguish evidence from interpretation.

Final screenshots are `release-desktop.jpg`, `release-archive.jpg`, `release-mobile-walk.jpg`, and `release-mobile-drive.jpg` in `artifacts/historical-sf/`. Interaction evidence includes `gameplay.json`, `dialogs.json`, `boundary.json`, `mobile.json`, and `release-route.json`. Generated browser artifacts are excluded from Git. The original repository-wide test baseline depends on unavailable city Git LFS assets and Unreal outputs; it is not a passing validation claim for this separate experience.
