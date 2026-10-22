# v4.22 landscape reconstruction — draft

This branch responds to the user's rejection of v4.21. It is not a claim of
concept parity and is not the public release until actual 3D images are reviewed.

## What changes

- One shared east/north projection for geographic anchors and streets. Existing
  source files, water centre lines, bridges and thirteen landmark models remain.
- Lower southwest camera; a reserved foreground below the four landmark silhouettes.
- A street kit with corrugated tile roofs, upper lattice, shop awnings, noren,
  lanterns, wood frames and stone plinths. Frontages may shift at most 0.65 display
  units toward/away from their paired source street; source anchors remain recorded.
  These are illustrative houses, not surveyed individual shop replicas.
- Eastern woodland covers the slope with overlapping broadleaf crowns, cedars,
  understory and limited blossom accents. Actual pond/gravel polygons replace the
  former huge rectangular exclusion, retaining the existing inferred garden plans.
- Sparse decorative people follow existing historic street segments.
- Warm direct light with a darker canopy palette; reduced atmospheric washout.
- Shared full-quality packed geometry, baked light and resolution on iPhone and
  desktop. Sequential chunks and released CPU geometry remain in use.

## Acceptance

Review the **actual** WebKit portrait image against the approved concept, checking
the stage, connected street frontages, wooded slope and foreground/middle/background
hierarchy. Browser startup success is not visual approval. Physical iPhone testing
is separate from WebKit CI. Yamashina and other directional extensions remain unbuilt.

## Validation

First actual browser review: commit `9bf60227b85dd636448e7e79baa624a46e6c2ddc`,
CI run `39855733390`. WebKit and Chromium both passed their 27 functional checks.
The images were **not** accepted visually: one side of some machiya roofs had
downward bake normals, and expanded house roofs covered historic lanes. The
wooded slope filled the former blank hills, but neither density nor successful
startup made the streetscape acceptable.

Three additional actual WebKit views were rendered from that exact artifact in
run `39856967924`. The near-north opening retained the clearest large stage;
the more diagonal all-landmark views reduced the stage too much. Those images
are comparisons of the first trial, not evidence for later geometry revisions.

Corrective implementation at `908e0855889de8ab55bab37fab42001fcfd007b2`:

- Orient both tiled roof slopes and lean-to awnings upward before baking.
  A geometry regression check enforces upward roof normals.
- Clip complete rotated roof footprints against every street corridor, rather
  than checking only house centre distance. Independently sample historic lanes
  to ensure no illustrated roof covers their walking width.
- Widen historic street surfaces to 1.16 display units, retain source polylines,
  and include existing southern residential roads in the foreground.
- Mix one- and two-storey house heights, smooth the foliage clusters, use cooler
  woodland greens, and keep full crowns clear of landmark buildings.
- Raise the visual emphasis of Kodaiji/Yasaka without changing their anchors.
- Fix title styling to address the actual `.title` element, and keep the camera
  orbit centre above ground rather than fitting by pushing it below the terrain.

Local geometry/pack validation: 233 illustrative houses, 1,650 trees, 2,591,440
triangles, 30,212 instances, 164,961 checked packed vertices, 2,074,731 lighting
samples. Model SHA-256:
`ca5b53bef7c8e2e1222aa2e84276c245c9c216338dd92db33d798f2f1487d8bd`.
Geometry input is 9,585,244 bytes, compressed transport 2,944,023 bytes, six parts
no larger than 2,006,844 raw bytes. CPU geometry is still released after upload.

Final validation: run `39857895513`, testing runtime commit
`908e0855889de8ab55bab37fab42001fcfd007b2`, completed successfully.
Build, WebKit and Chromium jobs all passed. The downloaded WebKit report passes
27/27 checks, including full baked lighting, shared resolution, all four primary
landmark buttons, landmark views, reload and context restoration. This is browser
CI, not a physical iPhone test. The raw WebKit report is retained in
`verification/v4.22/webkit-report.json`.

Actual image review: the black roof slopes are corrected, streets are visible,
the stage is fully framed, and continuous woodland replaces the former bare hill.
The draft still falls short of the approved concept: woodland dominates the
opening, street slabs have conspicuous jagged joins/grade transitions, and shop
frontages and materials remain repetitive. Next visual work should improve the
street/terrain joins and Ninenzaka frontage character, not just add objects.

Reviewed actual screenshots are in GitHub Actions artifact `12460442690`:
`iphone-area.png` and `iphone-street.png`. ZIP SHA-256:
`d483bdb632bc256cc6e0c50c671f0044cd76439f85f79b5d8b25a4d98538961b`.
Full verified site artifact: `12461500972`; model hash is given above.
Lighting SHA-256:
`eee92658125d2e5adfaf9f277a6fbfa1f5d90de0fdb7a7d5807d98cb8df7170b`.

Public v4.21 remains unchanged, confirmed against Render's live deploy
`dep-dbd7e93ncjis73bcu5b0` at commit
`b2ff4f28fb9b5d65ac1966f062f696cc67da1b48`. v4.22 is an unpublished draft.
No claim of concept parity or physical-iPhone certification is made.
