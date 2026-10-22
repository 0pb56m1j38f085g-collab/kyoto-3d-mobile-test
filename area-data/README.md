# Historic street reference

`historic-streets.json` is a subset of the project's existing `area-higashiyama-osm-v1` snapshot, captured 2026-10-21T23:52:43.766Z by `area-data/fetch-higashiyama-osm.cjs` on that branch. It retains OpenStreetMap way IDs, tags, coordinates and original source metadata. © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright

Coordinates use the original snapshot projection: origin latitude 34.995, longitude 135.785, 20 metres per scene unit; x is east, z is north. Original lines were simplified to 0.08 scene units. Do not describe these as cadastral or surveyed lines. The miniature exaggerates landmark sizes; surrounding authored buildings are not OSM footprints.

The v4.9 scene reads this JSON during the build. It uses the selected historic streets' polylines directly, and attaches their way IDs to `scene.areaSites.roadReference`. It does not query OSM from the user's browser.

## Architectural reference review, 2026-10-22

- Yasaka Shrine: https://www.yasaka-jinja.or.jp/about/architecture/ and https://www.yasaka-jinja.or.jp/access/ . Checked the official descriptions/photos of the stone torii, south tower gate, open dance pavilion, the unified main roof and the three-sided additional eaves. The earlier accuracy branch's red torii and extra lower gate roof were corrected. Precinct clearances, dimensions and individual footprint coordinates remain authored.
- Kodaiji: https://www.kodaiji.com/rekishi.html and https://www.kodaiji.com/haikan.html . Reference features include pond gardens, covered walks and the distinction between temple halls. Current pond, corridor, garden and bamboo details are an interpretation, not a measured reconstruction of the complete precinct.
- Hokanji: https://www.gion.or.jp/around/ . Five-storey silhouette and the timber/tile architectural language. Nine-ring finial and exterior timber details have been added; no claim of measured elevation accuracy is made.

## Remaining accuracy work

Real footprint alignment, common scale for landmarks/ordinary buildings, measured roof proportions, precinct orientation, terrain elevation and the full Gion district (including buildings beyond the captured bounding box) are still required before the requested high-accuracy target can be considered complete. The generated concept artwork is a presentation reference, not geographic evidence.
