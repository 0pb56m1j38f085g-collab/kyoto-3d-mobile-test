# Historic street reference

`historic-streets.json` is a subset of the project's existing `area-higashiyama-osm-v1` snapshot, captured 2026-10-21T23:52:43.766Z by `area-data/fetch-higashiyama-osm.cjs` on that branch. It retains OpenStreetMap way IDs, tags, coordinates and original source metadata. © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright

Coordinates use the original snapshot projection: origin latitude 34.995, longitude 135.785, 20 metres per scene unit; x is east, z is north. Original lines were simplified to 0.08 scene units. Do not describe these as cadastral or surveyed lines. The miniature exaggerates landmark sizes; surrounding authored buildings are not OSM footprints.

The v4.9 scene reads this JSON during the build. It uses the selected historic streets' polylines directly, and attaches their way IDs to `scene.areaSites.roadReference`. It does not query OSM from the user's browser.

## Architectural reference review, 2026-10-22

- Yasaka Shrine: https://www.yasaka-jinja.or.jp/about/architecture/ and https://www.yasaka-jinja.or.jp/access/ . Checked the official descriptions/photos of the stone torii, south tower gate, open dance pavilion, the unified main roof and the three-sided additional eaves. The earlier accuracy branch's red torii and extra lower gate roof were corrected. Precinct clearances, dimensions and individual footprint coordinates remain authored.
- Kodaiji: https://www.kodaiji.com/rekishi.html and https://www.kodaiji.com/haikan.html . Reference features include pond gardens, covered walks and the distinction between temple halls. Current pond, corridor, garden and bamboo details are an interpretation, not a measured reconstruction of the complete precinct.
- Hokanji: https://www.gion.or.jp/around/ . Five-storey silhouette and the timber/tile architectural language. Nine-ring finial and exterior timber details have been added; no claim of measured elevation accuracy is made.

## Remaining accuracy work

## v4.10 western Gion footprint block

`gion-footprints.json` retains 236 source building ways and 44 road ways in x=-44..-36, z=20..49. The builder renders 235 building footprints without moving/scaling their coordinates. The tiny monument way 1554873123 is recorded as excluded, not silently replaced by a building. The source snapshot itself simplified outlines to 1m tolerance and rounded to 2cm; these are OSM outlines, not survey-grade footprints. Ways crossing the block boundary and multipolygon relations are not covered.

The block replaces authored infill and uses a common 20m/unit coordinate scale in all three axes. Heights use tagged storey counts where present and otherwise assume two storeys at 3m/storey. Roof forms, facade bays and materials are inferred, not individually verified. Named institutions and larger buildings retain neutral massing instead of being automatically described as machiya. Ground elevations still use the inherited authored terrain. The landmark scale outside the block remains exaggerated.

Architectural language reference: Kyoto City's Gion Shinbashi conservation plan https://www.city.kyoto.lg.jp/tokei/page/0000281763.html describes tiled gable roofs, timber framing, lattice openings, first-floor eaves and second-floor windows. This supports the generic detail vocabulary only; it does not establish that any particular source footprint is a preserved machiya.

`node area-quality-v4/tests/footprints.cjs` verifies concave roof coverage, winding independence, retained source coordinates and the height provenance. `prepare-footprints.cjs` reproduces the subset from the existing OSM snapshot branch.

## Remaining accuracy work after v4.10

Real footprint alignment, common scale for landmarks/ordinary buildings, measured roof proportions, precinct orientation, terrain elevation and the full Gion district (including buildings beyond the captured bounding box) are still required before the requested high-accuracy target can be considered complete. The generated concept artwork is a presentation reference, not geographic evidence.
