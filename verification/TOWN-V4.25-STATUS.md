# v4.25 — neutral translucent machiya

## Scope

Approved B treatment: explicit architectural instances within `storybook-town`
use a pale neutral gray at 0.64 opacity. Roof tiles, eaves, lattice and facade
geometry remain. Landmarks, people, stone foundations, thresholds, steps,
paving and plants remain opaque and coloured. Geographic source files,
road connections, camera composition and full-quality iPhone path are unchanged.

Nearest-surface alpha compositing selects the front architectural surface with
a depth prepass, then blends once over opaque scenery. Rear wall/lattice layers
are suppressed intentionally, so the map remains legible under rotation. This
is an illustrative effect, not physically accurate glass or multilayer optics.
It reuses existing MSAA attachments, without float buffers or added large textures.

KMP3 carries opacity per instance alongside the existing geometry and baked-light
indices. Meshes shared by houses and people are never classified by mesh name.
Original instance ordering and light offsets are preserved. Gray material colours
require a fresh matched lighting bake. The baker still treats surfaces as opaque
for shadow rays; transparency is a camera/compositing treatment.

## Verification status

Implementation candidate only. New geometry/material, alpha compositing,
foreground occlusion, draw-order, rotation, zoom, reload and context-restoration
checks are included in the workflow. The previous v4.24 29/29 reports are NOT
validation of this change. Review current run reports and actual images before
promoting the development branch or triggering Render.

## Recovery and publication

Confirmed before editing: both remote branches at c1fc44241ee9f468da09a70c0eab844ac00a80f1.
Render service srv-dbcf79mktt5c73f8l7cg (workspace tea-dbbs370473hc73cb8gog)
was live at b2ff4f28fb9b5d65ac1966f062f696cc67da1b48, v4.21; auto-deploy off.
No v4.25 public deployment has been triggered at this checkpoint.

The previous local workspace was found. Its uncommitted status record, final
images/reports and verify-published.cjs were committed locally as 013e180 before
new source edits. The execution environment became unavailable during the local
build; that commit could not yet be pushed. No local files were deleted.
The same final v4.24 CI evidence is recovered by the evidence job from run
39869579512. Current and recovered evidence are kept on a separate
`evidence/east-town-RUN_ID` branch, without modifying the deployment branch.

Physical iPhone verification, approved-concept parity, town density, minor lane
seams, route/travel time data and Yamashina expansion remain unverified/unfinished.
