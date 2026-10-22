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

Pending local geometry and CI browser review. Public v4.21 is unchanged.
