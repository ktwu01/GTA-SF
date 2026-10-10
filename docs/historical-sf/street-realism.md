# Street life and historical evidence

The historical scene has 306 pedestrians and 30 exterior streetcar passengers. Walkers form sidewalk streams and diagonal crossings. Some hurry, a smaller cohort runs, and crossing runners can hop a rail. They yield to vehicle envelopes and nearby people. Exterior passengers remain attached to platforms and added steps. They do not participate in pedestrian avoidance.

The original map geometry and public asset files are preserved. An additive district extends the Ferry apron to East Street, a quay, a timber wharf and a walkable lumber schooner. The supported ground area is approximately 4.8 times the original area. This measures walkable prototype area, not a percentage of GTA's map or gameplay.

## Evidence and interpretation

| Source | Inspected evidence | Interpretation in the game |
| --- | --- | --- |
| [Miles Brothers film, LOC item00694408](https://www.loc.gov/item/00694408/), viewing-copy frames075,240,310,490 | Pedestrians cross among rails and vehicles; horses, carts and streetcars share the street | Diagonal crossings, mixed pace and traffic. Runner frequency and rail hops are authored gameplay, not documentary statistics. |
| [SFMTA U00541](https://gallery.apps.sfmta.com/images/originals/U00541.jpg), August22,1905 | Dense terminal traffic, standing platform/step passengers, shop-corner goods, worn paving and track beds | Four moving cars plus the player's car; exterior passengers, carts and sacks, irregular ground wear. No roof riders. |
| [OpenSFHistory wnp100.10001](https://opensfhistory.org/Display/wnp100.10001.jpg), August22,1905 | Archive caption identifies inbound cable-car backup near Steuart | Terminal traffic context. Existing playable electric car remains a gameplay approximation of period transport. |
| [OpenSFHistory wnp4.1351](https://opensfhistory.org/Display/wnp4.1351.jpg), circa1905 | Streetcars along the Ferry frontage | Waterfront traffic context; approximate date. |
| [Rumsey/SFPL Sanborn atlas](https://www.davidrumsey.com/blog/2011/6/27/pre-earthquake-san-francisco-1905-sanborn-insurance-atlas), Volume1 sheets5–6 and key | Public previews show narrow parcels, mixed brick/frame construction, irregular building divisions, manufacturing/storage labels | New warehouses mix brick parapets and timber gables. Their locations, footprints, heights and tenants remain authored composites. |
| [USGS San Francisco quadrangle](https://store.usgs.gov/product/845820),1899 survey/1914 print,1:62500 | Regional topographic reference identified | No precise dock elevations or building heights inferred. Current flat terminal grade remains a gameplay approximation. |

Street dirt means patchy road wear, damp patches, gutter grime and commercial cargo. The references do not establish heavy garbage accumulation. No new archival image is redistributed as a game texture.

## Building records

Read `data/historical-sf/buildings.json` for all22 structural buildings, including the vessel deckhouse. Each footprint, height, facade material and occupant has separate rendered and historical records. Rendered values cite the model source. Historical values cite a source and locator with confidence, or remain null with confidence `unknown`.

Ferry dimensions and sandstone have documentary support. Several terminal tenant signs are legible in U00541. Signs do not prove ownership. Generic street blocks and relocated harbor blocks have no verified historical footprints, heights or occupants. A complete Sanborn cadastral reconstruction is still outstanding. The full atlas viewer presented an access challenge; the inspected previews cannot justify precise transcription of small annotations.

## Checks

Run `npm run test:historical` for routing, collisions, speech, hop landing and provenance checks.
Run `npm run build:historical` for the standalone production build.
Open `/historical-harbor-qa.html` for a continuous walk from Market to ship, freight office, chandler and Ferry.
Read its visible report for arrivals, peak activity and frame times.
Use `/historical.html?view=harbor` and `?view=ship` for visual checks.

The characters remain stylized. The extension is a historical prototype, not a claim of photorealism or a surveyed April1906 city.
