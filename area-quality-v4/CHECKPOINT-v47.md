# Higashiyama / Gion Quality v4.7 checkpoint

## Goal
Approved soft miniature-map concept quality across the whole Higashiyama/Gion authored district, while preserving landmark readability and progressively improving real-world proportions/details.

## Current validated revision
- scene revision: area-higashiyama-quality-v4.7
- area quality: v4.7-street-detail-and-soft-presentation
- validation run: 39684566631 (success)
- baked visual run: 39684566762 (success)
- baked visual artifact: higashiyama-area-v4-baked-renders / artifact 12386151848
- browser environment: GitHub-hosted Linux / Chromium software WebGL
- 12-sample bake: 8,847,393 light samples / 35,389,580 bytes
- WebGL initialization: passed
- baked lighting active: passed
- runtime errors: none
- geometry/model validation: passed

## v4.6 -> v4.7 changes
- Added small street lanterns at selected authored road segments.
- Added low fences, illustrative shop signs, water basins, benches and planters.
- Kept these as non-surveyed visual tissue; they are not claimed as real asset inventories.
- Slightly warmed the broad fill and sunlight, increased indirect/sky contribution and exposure to approach the approved soft pastel miniature concept without flattening baked contact shadows.
- Preserved the v4.6 district geometry, north terrain extension, Yasaka clearing, foreground machiya/gardens and reviewed mobile framing.

## Current assessment
- Kiyomizu: strongest landmark, established quality reference.
- Hokanji: strong silhouette and streetscape context.
- Kodaiji: precinct and garden read much more clearly than early area versions.
- Yasaka: foreground occlusion largely resolved and precinct is readable.
- Machiya streets: now have close-view street-scale details instead of only repeated building masses.
- Whole district: substantially denser and more coherent than v4.3/v4.4, but all intermediate streets/buildings remain authored composition until GIS/footprint data is introduced.

## Next safe continuation
1. Deploy validated v4.7 to the development Render service with 24 LIGHT_SAMPLES.
2. Verify the public development URL loads the v4.7 build.
3. Evaluate real-phone performance separately from GitHub software WebGL.
4. Continue landmark/geographic accuracy passes without reducing the approved miniature presentation quality.

## Accuracy note
Major landmark anchors use geographic coordinates. Intermediate roads, machiya, gardens, street furniture, vegetation and minor structures are authored visual composition and are not surveyed or navigation-grade.
