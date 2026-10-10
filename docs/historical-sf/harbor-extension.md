# East Street waterfront extension

The new district attaches at the east edge of the existing Ferry apron. Existing street geometry, original destinations and public assets are preserved. The extension adds a quay, one timber wharf, seven warehouse/store blocks and an accessible lumber schooner. Its orthogonal street grid, shoreline, berth and gangway are compact gameplay interpretations, not a surveyed 1906 map.

## Public image evidence

| Source | Date and status | Supported details | Limits |
| --- | --- | --- | --- |
| [LOC HAER CA-5 waterfront report](https://tile.loc.gov/storage-services/master/pnp/habshaer/ca/ca0800/ca0859/data/ca0859data.pdf), PDF page 20, printed page 19 | Photograph caption: ca. 1900, East Street looking north from Pier 12 | Piled timber wharves, low gabled waterfront buildings, closely moored ships, masts, working cargo edge | Reproduced archival photograph, courtesy SF Maritime Museum. Visual reference only; no texture or runtime redistribution. No exact footprint extraction. |
| [NPS C.A. Thayer historical photographs and history](https://www.nps.gov/features/safr/feat0001/virtualships/thayermoreinfo.htm), `thayermore/a0000053.jpg` | Historical image; page associates it with the lumber/1905 discharge section. Exact image date retained as unknown because the photograph also resembles the adjacent stranding account. | Curved timber hull, three unequal masts, long bowsprit, standing rigging, low deckhouse | Visual reference only. No claimed 1906 berth beside Ferry Building. Colors and small fittings estimated. |
| Same NPS page, `thayermore/a0000049.jpg` | Caption identifies near-sister **Sadie**, under sail on SF Bay; date unspecified | Cargo carried on deck, raised booms, rigging around timber load | Vessel identity differs from Thayer. Used only for cargo-trade context. No exact fitting copied as verified Thayer detail. |
| Same NPS page, `thayermore/a0000054.jpg` | Thayer lumber-era section, 1895–1912; specific exposure date unspecified | Loaded vessel profile and timber trade setting | Visual reference only, not a measurement. |

The downloaded references and rendered report page are in `artifacts/historical-sf/research/`. They are research artifacts and are not included in the standalone build. Public access is not treated as permission to publish image textures.

## Dimensions and adaptation

NPS reports Thayer's deck length as 156 ft and beam as 36 ft. The modeled maximum deck length is 47.5488 m and beam is approximately 10.97 m. The [NPS vessel history](https://www.nps.gov/safr/learn/historyculture/c-a-thayer.htm) places her construction in 1895 and lumber service in 1895–1912. This supports a period lumber schooner, not the current museum vessel's later fishing equipment.

Mast heights, hull depth, gangway dimensions, buildings, colors and cargo locations are estimated for this prototype. The in-game name is “Lumber schooner.” This is a Thayer-inspired vessel, not an exact reconstruction or a claim about her berth on April 14, 1906. The NPS history documents her 1905 discharge near Third and Channel, farther south than this compact extension.

## Walking and guidance

Choose a destination under Pause → Places. Ask a porter about boarding a ship, a clerk about the wharves, or a flower seller about marine stores. Their fictional replies select a waypoint without moving the player. New replies use text and the existing browser speech fallback; they have no bundled recorded voice clips.

The blue line follows supported street, quay, wharf, gangway and deck surfaces. It replans during movement. The destination card shows distance or arrival. Clear the waypoint with its × button. The line hides with the HUD and during menus. Replay clears discoveries and navigation.

Water boundaries, warehouses, cargo, masts, hatch and deckhouse block walking. The ship is moored. Sailing, cabins, hold access, economy and jobs are outside this increment.

## Verification

Run `npm run test:historical` and `npm run build:historical`. Open `/historical-harbor-qa.html` on the development server to run the actual scene controller from Market to ship, freight office, chandler and back to Ferry. The page reports route progress and frame samples. This development harness is not included in the production bundle.

Use `/historical.html?view=harbor` and `?view=ship` for visual checks. Those views are review entry points; normal gameplay connects continuously through the apron.
