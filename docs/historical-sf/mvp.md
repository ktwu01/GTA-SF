# San Francisco, 1906: the Ferry approach

This standalone experience reconstructs roughly 210 meters of lower Market Street and the Ferry Building apron. It uses the original film, period photographs, and measured building documentation. The original Shenzhen game and its assets are not used or rebuilt.

## Run and build

1. Run `npm ci` to install the pinned dependencies.
2. Run `npm run dev:historical` to start the local server.
3. Open `http://127.0.0.1:4176/`.
4. Run `npm run build:historical` to check TypeScript and create `dist-historical`.
5. Run `npm run preview:historical` to serve the production build.
6. Open `http://127.0.0.1:4177/`.

The dedicated Vite configuration copies only `public/historical-sf` into the output. Both `index.html` and `historical.html` open the historical experience. No character prebuild runs. Fonts and their SIL Open Font License files are bundled locally.

## Explore and drive

The opening plays an original Miles Brothers film excerpt. Frame 445 supplies its poster and fallback. “Step inside” dissolves into a reconstructed view toward the Ferry Building. The camera and lens are approximate; this is not a photogrammetric solution.

| Action | Desktop | Touch |
| --- | --- | --- |
| Walk | W/A/S/D; up/down arrows move; left/right arrows turn | Four direction buttons |
| Look | Drag the street | Drag the street |
| Walk faster | Shift while moving | — |
| Board or leave the streetcar | E or the boarding button | Boarding button |
| Accelerate | W or up arrow | Throttle button |
| Brake | S, down arrow, or Space | Brake button |
| Ride automatically | Guided button; W/S resumes manual control | Guided button; throttle/brake resumes manual control |
| Reverse direction | R while stopped | Reverse button while stopped |
| Ring the bell | B or bell button | Bell button |
| Replay the opening | Circular arrow button | Circular arrow button while on foot |

Approach either open streetcar platform before boarding. The speed display uses miles per hour. Manual speed is limited to 5.5 meters per second. Braking at the route ends holds the car before the Ferry facade. Reversing moves the viewpoint to the opposite platform. Disembarking stops the car and places the player beside its platform. Ambient streetcars use the other track.

“Original view” opens an opacity comparison at the opening camera position. Closing it restores the prior camera and riding state. Opening the archive pauses movement. Closing a dialog returns keyboard focus to the street. The archive shows 26 distinct views, with dates, rights statements, and links to the original records. Duplicate resolution and publication-proof files remain in the source ledger.

## Evidence and interpretation

| Element | Evidence | Modeled scope and uncertainty |
| --- | --- | --- |
| Film date | Library of Congress item 00694408 | April 14, 1906. The clock reads 3:17, following the LOC scene description. |
| Market Street width | LOC reports 120 feet | Facade lines follow a 36.576-meter width, including sidewalks. Curb allocation and track gauge are estimates. |
| Ferry dimensions | LOC HABS record `ca0641`, report pages 6–8 | Main block about 201.2 × 45.7 meters. Tower width about 9.75 meters; clock diameter about 6.71 meters. Tower height uses the reported 235-foot figure; the report records conflicting historical figures. |
| Ferry facade | Native-resolution 1901 photograph; film frames 445, 470, and 490 | Three stories, ground arcade, eighteen tall upper arches per wing, double string courses, layered cornices, and three equal central arches. Period glazing divides the upper openings. Ground openings have recessed surfaces and separate piers. Details and profiles remain modeled estimates. |
| South terminal corner | August 22, 1905 view from the Ferry tower | Three-story ticket office with projecting bays and ground shop openings. A taller wall behind it uses the photograph’s MJB Coffee, General Arthur, and Smith’s advertisements. Dimensions are inferred. |
| North terminal corner | Same 1905 photograph | Low coffee-house frontage with a hipped roof, skylights, and layered shopfronts. A taller brick warehouse stands behind it. The Pacific Coast Steamship Company block includes a rooftop water tank. Footprints and side elevations are approximate. |
| Material surfaces | Original 1899 shop photographs, 1905 terminal view, and film frame 470 | Fourteen reproducible crops or derived textures supplement modeled sashes, projecting bays, cornices, shop framing, paint, and paving. Tints are interpretations. Source IDs, crop rectangles, transformations, and hashes are recorded. |
| Street and apron | 1905 terminal view and original film | Track fans, worn track beds, setts, curb returns, overhead wires, three-globe lamps, benches, bollards, drains, crates, and barrels. Positions and small dimensions are interpreted. |
| Streetcars | Original film, especially frame 490 | Open end platforms, three-bar rails, step boards, curved roofs, paneled sides, clerestory, seats, handrails, straps, controller, handbrake, trolley pole, and bell. The playable car is a period-inspired composite, not a certified replica of an identified car. |
| People and wagons | Original film and period photographs | Smooth simplified figures, hats, skirts, harnessed horses, spoked wagon wheels, and animated routes. Appearance, counts, and motion are interpretive. |

The scene is not georeferenced. The terminal block arrangement follows the 1905 photograph, while route lengths and ordinary side elevations are inferred. Building colors and afternoon lighting are artistic interpretations of monochrome evidence. The archive also preserves Palace Hotel, Call Building, and other city references outside the playable region.

## Source-derived textures

Run `python3 scripts/prepare_historical_textures.py` to reproduce the materials with Pillow installed. Inspect `data/historical-sf/texture-provenance.json` for each output’s source, transformation, and SHA-256 hash. The setts blend a modeled paving pattern with real film grain; the normal map derives from that paving. No generated photograph substitutes for archival evidence.

## Implementation and review

`src/historical-sf/geometry.ts` batches geometry by material. `architecture.ts` builds the Ferry and terminal district. `street-life.ts` builds the detailed vehicles, street furniture, tracks, and moving figures. `scene.ts` manages rendering, walking, boarding, speed, and braking. `main.ts` and `style.css` provide the opening, controls, comparison, and archive.

The visualization implementation author is the explicitly requested **gpt-6-astra** agent. The parent agent gathers archival evidence, checks source integrity, and reviews actual browser renders. Build success alone does not establish visual fidelity or mobile performance.

For local QA, call `window.__historicalSF.snapshot()`. It reports readiness, camera position, mode, streetcar position and speed, active meshes, per-frame draw calls, indexed triangle count, frame rate, and captured errors. `board()`, `guided()`, and `reverse()` exercise vehicle controls. `navigate('market' | 'ferry' | 'arcade')` selects repeatable camera positions for review. These methods do not appear in the product UI.

The dedicated TypeScript check and production build pass. The parent’s final QA record identifies the browser, viewport, tested interactions, screenshots, and observed performance. Current limitations include simplified people and horses, estimated neighboring dimensions, limited arcade access, exterior-only shops, and atmospheric traffic without a general collision simulation. Walking bounds follow the street, apron, and accessible Ferry recesses.
