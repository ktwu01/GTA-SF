# San Francisco reconstruction plan

Date: 2026-10-03. Status: implementation plan; no SF assets built or validated yet.

## Playable outcome

A player starts near the Ferry Building, drives through downtown and Chinatown, climbs Nob Hill, reaches the waterfront, crosses the Golden Gate Bridge, and can continue exploring the western and southern neighborhoods. From an aircraft, the peninsula, hills, parks, bridges and skyline read as San Francisco. The map is continuous; high-detail streets are additions to a citywide base.

Retain the Babylon.js browser client, Blender generators, vehicle/walking/flight controls, lighting, traffic and asset streaming. Use original or licensed city data and artwork. KSHR-AI games are optional references only; their limited procedural maps are not an input to the city.

## Geographic scope and scale

- First-release base: the SF peninsula, including downtown, Richmond, Sunset, Mission, Castro, Bayview and the southern neighborhoods inside the SF boundary. Generate all covered buildings and eligible roads, then stream them by tile.
- Extensions: full Golden Gate Bridge and its Marin landing; Bay Bridge western span through its Yerba Buena landing; Alcatraz as a visible landmark island. Oakland, the eastern Bay Bridge and the rest of the Bay Area are later additions.
- Proposed acquisition envelope: WGS84 `[-122.55, 37.70, -122.35, 37.85]` (west, south, east, north). This is a download rectangle, not a playable-land boundary. Actual land and scope masks come from source polygons. Check that all landing roads fit before freezing it.
- Proposed local origin: `[-122.43, 37.77]`. Transform WGS84 into EPSG:32610, subtract the projected origin, then apply the existing uniform `0.60` scale once to east, north and height. This CRS is for SF and must not be mixed with the old Shenzhen EPSG:32649 research data or old fixed longitude coefficients.
- Retain Blender east/north/up and the existing GLB/browser root transform. Test three known points and an asymmetric test mesh before building the city.
- Use one documented height datum. The 2023 ground dataset uses NAVD88; handle source conversion explicitly and align the game's water plane to the chosen reference. A building's height above ground is separate from ground elevation. Bridge deck elevation is separate from both.

## Reusable open sources

| Source | Use | Decision and fallback |
| --- | --- | --- |
| [Geofabrik California OSM](https://download.geofabrik.de/north-america/us/california.html) | Road graph, one-way/access rules, coast, water, parks, bridge/tunnel tags and points of interest | Pin an extract date and hash, crop locally, preserve ODbL attribution and distribution requirements. Keep grade-separated ways separate. |
| [SF building footprints](https://catalog.data.gov/dataset/building-footprints-05482) and [file geodatabase](https://catalog.data.gov/dataset/building-footprints-file-geodatabase-format) | Citywide building outlines and available elevation/height fields | Preferred building source. Inspect actual schema, units, coverage and metadata before treating fields as heights. The geodatabase catalog lists PDDL; retain the selected dataset's own notice. Older outlines require reconciliation for new buildings. |
| [2023 USGS SF ground elevation](https://www.fisheries.noaa.gov/inport/item/73506) | Hills, street elevations, building bases | Download intersecting tiles only. Source ground raster has 0.25 m cells; generate lower-resolution game tiles. Check tile coverage outside SF; use a compatible USGS ground dataset for gaps, recording datum and resolution. Never use a roof/tree surface as bare ground. |
| [Overture building data](https://docs.overturemaps.org/getting-data/) | Missing/new building outlines and available heights | Secondary source. Pin a release; spatially match before adding anything. Preserve source IDs and selected release terms. Do not overlay three complete building databases. |
| [DataSF SF Building Explorer](https://github.com/DataSF/sf-building-explorer) | MIT reference for reading SF building fields and joining records | Inspect data access/joins as a reference. Its archived map viewer is not the game's renderer. |
| [3dfier](https://github.com/tudelft3d/3dfier) | Optional offline roof reconstruction from footprints and point clouds | Time-box a compatibility/license check to half a day after the base works. Start with existing extrusion; use this only if roof quality improves enough to justify preprocessing. Review code and generated-output terms before adoption. |

The first-release shortcut is citywide footprints + real ground + procedural facade families. A prebuilt textured mesh is optional: it must have downloadable source, a clear redistribution license, known coordinates and usable geometry. Do not make such a mesh a dependency. Public photos are shape/color references unless their license permits shipping them as textures. Prefer authored material atlases and already licensed reusable assets.

Source ledger: `data/sf/sources.json`; raw inputs: `data/raw/sf/`; normalized layers: `data/processed/sf/`. Record URL, publisher, source date, access date, license, CRS, height datum, checksum, coverage and permitted use. Height records distinguish source-reported, derived, estimated and unknown values.

## Framework changes

1. Add a shared city specification and coordinate utility. Proposed files: `config/cities/sf.json`, `scripts/city_coordinates.py`, `src/city-config.ts`. Move bounds, origin, scale, source paths, spawn, landmark registry and optional city subsystems out of Shenzhen constants. Preserve current formats where practical.
2. Adapt `scripts/extract_city.py` and `scripts/prepare_driving_city.py` for SF inputs. Remove Shenzhen-only mainland masking and largest-polygon land selection. Preserve all selected land components and coast holes. Derive ocean/bay water from the scope mask rather than a south-only rectangle.
3. Add `scripts/prepare_sf_terrain.py`: reproject, crop, check missing cells, and generate tiled ground surfaces and the height sampler used by gameplay. Start with 2–4 m ground sampling in the playable area and coarser distant meshes; tune from actual terrain views and memory usage. Sharp curbs and bridge decks use separate geometry.
4. Extend road data with explicit structure type, layer and a sampled elevation profile. Adapt `scripts/node_city_roads.py`, road mesh construction, collision and navigation together. Sample profiles every 2–5 m and at bends/junctions; ordinary connected intersections share an elevation. Do not connect roads merely because they cross in 2D.
5. Bridge decks and ramps override terrain along their own surfaces. Keep separate water/ground beneath them. Resolve surface by connected route/structure and actor elevation; an `(x,z)`-only maximum-height lookup is insufficient at stacked roads. Introduce one context-aware surface API and migrate car position/front/rear sampling, NPCs, walking, vehicle entry/exit, map travel, auto-driving and relevant camera clearance calls in `src/city-world.ts` and their subsystems. Keep a separate bare-terrain query for scenery. Collision and traffic must use the same profiles as visible meshes. Represent selected tunnel entrances and traversable tunnel roads deliberately rather than burying flat roads under hills.
6. Build SF buildings through the existing Blender footprint/facade workflow. Prefer usable city heights; then matched Overture heights; then recorded estimates. Preserve stable source IDs. For steep footprints, use stepped foundations or retaining geometry without changing roof height into absolute elevation.
7. Reuse `src/city-facade-stream.ts`, `src/city-gltf-streaming.ts` and distant geometry. Start with ~500 m real-world tiles (300 game units); measure before fixing tile size. Low-detail city silhouettes stay visible while nearby facade/roof details stream. No citywide high-detail GLB loaded at startup.
8. Disable Shenzhen-specific cafe, bamboo corridor, signage, mountains, missions and landmark assumptions through the city specification; wire SF equivalents only when their inputs exist. Update loading text, map labels, spawn, street names and travel destinations. Replace restricted character assets for a distributable SF build.
9. Adapt the staged pattern in `scripts/rebuild_city_assets.mjs` into a dedicated SF build entry point. Proposed output: `artifacts/rebuilds/sf/<run>/public/city/`, promoted into the runtime paths only after checks. Do not invoke the current complete Shenzhen rebuild against SF blindly.

All new paths and commands above are proposed implementation deliverables, not existing tools.

## SF appearance and priority objects

Generate ordinary buildings citywide from six shared families: Victorian/Edwardian houses (bay windows, stairs and cornices); Richmond/Sunset low-rise housing; neighborhood storefronts; downtown masonry; glass towers; waterfront/industrial buildings. Use footprint dimensions and district/land-use evidence to choose families, with deterministic variation. Neighborhood tags guide appearance but do not prove a particular building's facade.

First detailed objects, each with its own source record and Blender module:

1. Golden Gate Bridge: towers, cables, deck, approach connections and anchorages.
2. Bay Bridge western span: towers, suspension geometry and SF/Yerba Buena connections.
3. Salesforce Tower and Transamerica Pyramid: correct silhouettes and podiums.
4. Ferry Building: clock tower and waterfront frontage; initial spawn nearby.
5. Coit Tower and Telegraph Hill: ground form and tower together.
6. Palace of Fine Arts: rotunda, lagoon and nearby streets.
7. Alcatraz: island shape, main buildings and skyline presence.

Second detail pass: Lombard Street's crooked block, Painted Ladies/Alamo Square, City Hall, Chinatown gate and a few characteristic Chinatown blocks. Streets across the rest of SF remain playable even before this pass.

Replace Shenzhen-specific street props and planting with SF street signs, crosswalks, signals, parking, appropriate trees and street wires where supported. Fog/light comes after readable road geometry; keep vehicle controls and nearby visibility clear. Cable cars and Muni vehicles are a later gameplay/asset addition, not a dependency for the base map.

## Execution schedule and ownership

Days below are relative to implementation start, assuming sustained AI-agent work and feedback. A seven-day first release is a target; days 8–14 are reserved for uncovered data/terrain issues and visual polish. The SZ commit history supports rapid iteration but does not establish equivalent SF throughput.

| Due | Owner and first action | Concrete output | Done condition | If blocked |
| --- | --- | --- | --- | --- |
| Day 1 | Integration owner: create a task worktree, inventory current startup inputs, capture SZ baseline performance; data owner: fetch source metadata and crop SF layers | City spec, source ledger, normalized layers, startup dependency checklist, baseline report | Coordinate control points match; footprint/terrain coverage mapped; each startup asset has an SF/reused/disabled decision | Use OSM footprints or alternate documented ground tiles for gaps; record missing heights, never invent measurements |
| Day 2 | Integration owner: adapt generator and build coarse full-scope ground/roads/buildings from normalized layers | Staged `city.json`, terrain/building/road tiles, SF spawn and English map | Entire selected peninsula exists; camera and vehicle load; five geographically spread destinations are reachable on the intended network | Keep ordinary buildings simple while fixing geometry; never shrink to a few streets to call it citywide |
| Day 3 | Terrain/road owner: build slope and structure profiles; integration owner connects runtime and collision | Elevation-aware roads, foundations, bridge landing profiles and routing checks | Continuous uphill/downhill routes; no road/terrain gaps; no false junctions at overpasses; no falls through bridge surfaces | Keep the affected structure out of auto-routing until its traversable profile is correct; record pending segment |
| Days 3–5 | Independent object owners: inspect each object's source record, then build only assigned `scripts/landmarks/sf/<id>.py`; appearance owner builds facade/prop families | Seven first-priority object modules, source records, preview exports, six facade families | Each object has aerial, street and skyline checks; citywide facade generation uses real footprints | Use a sourced simpler silhouette for incomplete detail; mark unverified faces and measurements |
| Days 5–6 | Integration owner: merge approved modules, regenerate shared manifests and exclusions; appearance owner completes district materials | Integrated landmarks, facade tiles, SF props/planting, source attribution | No duplicate landmark/base blocks; no Shenzhen-only assets in SF scene; one coherent city in day/sunset/night | Fix the integration blocker before adding another landmark |
| Day 7 | Verification owner: run named routes on current assets; integration owner fixes failures and builds release candidate | Functional report, screenshots, frame-time/loading report, staged release build | Gates below pass; release scope explicitly lists pending objects | Continue fixes into days 8–14; do not declare visual/performance success from build completion |
| Days 8–14 | Object/appearance owners: start second detail pass from verified base | Crooked Lombard block, Painted Ladies, City Hall, Chinatown and targeted polish | Each added area passes the same source/visual/route checks | Prioritize visible route problems over additional objects |

Parallel work is planned for independent data preparation, facade families and individual landmarks. One integration owner controls shared runtime, coordinate helpers, total GLBs and manifests. Terrain and roads share a contract and are integrated serially. Object tasks use the existing evidence/model/validation contract, adapted to SF coordinates and registries before generating tasks. External tools/model availability must be checked; labels do not imply an agent was launched.

## Acceptance routes and release gates

Named routes:

- Ferry Building → Market Street → Civic Center → Mission → Castro → Twin Peaks access road.
- Ferry Building → Chinatown → Nob Hill → Russian Hill/Lombard → Fisherman's Wharf.
- Wharf → Marina → Presidio → Golden Gate Bridge → Marin landing.
- Ocean Beach → Sunset → Golden Gate Park road network → Richmond → downtown.
- SoMa → Bay Bridge western span → Yerba Buena landing, with deliberate safe boundary beyond the included span.
- Separate Bayview/southern-neighborhood coverage drive, plus full-map aerial inspection.

Checks:

- `npm test` and `npm run build`; adapt existing landmark validators/checkers to SF registry and coordinates. Add meaningful tests for coordinate scaling, disconnected grade crossings, reverse one-way roads, multi-surface selection and duplicate building replacement.
- Inspect source/network coverage for every district. Count retained/excluded road components, explain exclusions, and verify all named routes actually connect. No unexplained rectangular water/land edges within normal views.
- Record at least 12 fixed SF viewpoints on current assets: street level, aerial and skyline, covering downtown, both bridges, hills, western housing, park and southern neighborhoods. Compare against attributed references; report named visual defects rather than one overall "passed" screenshot.
- Drive and walk on slopes; switch vehicles; enter/exit; use auto-driving, map travel and flight; cross tile boundaries and bridge landings. At one stacked-road location, drive above and below, teleport to both levels and exit/re-enter a vehicle on both: no snapping between surfaces. Stairs and pedestrian-only paths must not become driveable roads.
- On the same machine/browser/resolution used for the SZ baseline, run comparable 10-minute drive and aerial captures. Provisional targets: desktop driving p95 frame time <=33 ms; no repeatable streaming stalls above 100 ms; report p99, peak memory, draw calls and transferred bytes. If baseline hardware cannot meet the absolute target, publish the measured comparison and unresolved issue rather than silently changing the bar.
- Provisional loading target: controllable initial scene within 10 seconds under a recorded 50 Mbps/50 ms network profile, loading only the spawn neighborhood and required shared assets. Measure actual compression, shader preparation and bytes before final budgets.
- Every shipped asset has redistribution terms; SF character replacements and required notices are included. Public branding receives a distinct product name.

## First runnable milestone

The first implementation batch is the city specification, pinned data acquisition, coordinate conversion and a coarse citywide SF build. Its reviewable output is a playable Ferry Building spawn plus a full-map aerial view, not a landmark-only scene. Height-aware routes and detailed landmarks follow on top of that base. Capture model usage, elapsed agent time and human interventions by batch so the project's actual cost replaces speculative estimates.
