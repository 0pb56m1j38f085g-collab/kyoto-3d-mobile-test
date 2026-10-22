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

## v4.11: connected Gion, Hokanji and Yasaka reference block

The current `gion-footprints.json` expands to x=-44..-24, z=15..52: 1,314 building ways and 236 road ways. Six tiny outlines are explicitly rejected; 1,304 buildings use polygon walls/roofs, while four named ways are reserved for custom models. Thus the 1,308 records must **not** be described as 1,308 individually accurate reconstructions. Source simplification, incomplete tags and missing multipolygon/boundary-crossing buildings remain limitations.

The four custom models are authored in metres and converted once with the same 20 m/unit scale used by roads and ordinary buildings:

| Model | OSM way | Calibration | Still inferred |
| --- | --- | --- | --- |
| Hokanji tower | 371717416 | Source envelope centre/orientation; published 46 m height; 6.4 m first-storey body reference | Individual storey heights, eave taper, brackets and finial proportions |
| Yasaka main hall | 88108397 | Source envelope centre/orientation; official 15.53 m height | Relationship between mapped outline, walls and eaves; roof curvature and facade dimensions |
| Yasaka dance pavilion | 105449709 | Source envelope centre/orientation and approximate envelope dimensions | 8.1 m height and all vertical proportions |
| Yasaka south gate | 88108386 | Source envelope centre/orientation and approximate envelope dimensions | 10.4 m height and all vertical proportions |

References checked 2026-10-22:

- Kyoto Tourism Federation: https://www.kyoto-kankou.or.jp/info_search/128 — tower height 46 m and 6.4 m square description. The latter is treated as a first-storey body reference, not the wider eave envelope; that boundary interpretation is not survey-verified.
- Yasaka Shrine: https://www.yasaka-jinja.or.jp/about/architecture/ — height 15.53 m, building area 662.38 m², eave area 1,049.50 m², roof surface area 1,320 m²; official plan, side elevation and precinct photograph. These areas describe **different boundaries** and are not substituted for one another. The OSM polygon area (about 813 m²) does not match either official building or eave area, so footprint boundary identification remains unresolved.
- The official side elevation informs the irimoya upper gable and lower hip skirt; no reference photographs are redistributed as textures.

Source building positions correct the earlier representative-point placement and stretched gate–pavilion–main-hall sequence. Roof profiles and timber construction remain simplified interpretations. The oversized legacy Hokanji/Yasaka instances are removed; the custom models do not duplicate the generic footprint masses. The urban terrain's decorative wave is reduced to avoid metre-scale artificial undulations, but **no DEM or surveyed elevation has been added**. Gravel and vegetation remain authored.

`tests/metric-landmarks.cjs` measures transformed mesh vertices (not just metadata) to check heights, grounding, source-centre alignment, precinct sequence and removal of obsolete geometry. Kiyomizu's existing main-hall geometry is preserved.

The reference block's ground and roads use a maximum 0.12-unit grid step for vertex lighting. The inherited 0.65-unit terrain grid produced large triangular shadow gradients beside small buildings; the finer, slightly raised continuous surface replaces that visible interpolation without changing source building coordinates. This is rendering resolution, not improved geographic elevation accuracy.

### Not complete

Kiyomizu and Kodaiji still use exaggerated architectural scales, as does context outside the mapped block. Global scale consistency, individual roof/wall verification, accurate topography, full precinct footprints and complete geographic coverage are **not complete**. The main goal of concept-quality, high-accuracy reproduction has not yet been achieved.
