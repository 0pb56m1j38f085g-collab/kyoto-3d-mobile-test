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

Implementation is saved at 45d783be65a789dee3e036bf4c3fcfd78f667c78. New geometry/material, alpha compositing,
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

## Resumption checkpoint — 2026-10-23

- Exact previous local records are now on the development branch at fb5213bb0186b7eadaba7dc29cfbffa1778e0ff6, including both original v4.24 WebKit PNGs, build info and browser reports. Local originals and recovery commits remain intact.
- The initial v4.25 scope test used an arbitrary opaque-instance count; it was replaced with semantic stone/plant/shared-mesh assertions.
- WebKit reached rotation with actual compositing checks passing, then its test stopped because mobile WebKit does not support mouse wheel input. The final test taps the existing zoom button.
- Local Chromium exposed a real context-restoration bug: canvas dimensions survived context loss, causing resize to return without allocating the new framebuffer. The final code also requires valid renderer targets before skipping allocation.
- Corrected local Chromium: 41/41 checks passed, including restored full lighting, 4x MSAA, six uploaded chunks, nonzero target dimensions and no GL errors. Actual area, Ninenzaka, rotated and restored images reviewed.
- Exact final CI: https://github.com/0pb56m1j38f085g-collab/kyoto-3d-mobile-test/actions/runs/39877985638 ; source 45d783be65a789dee3e036bf4c3fcfd78f667c78. Pending at this checkpoint.
- Public service and fetched build-info still confirmed v4.21. No new deployment triggered yet.

### Final artifact checkpoint

Final-source build/geography/lighting checks succeeded. WebKit CI succeeded with 41/41 checks (job 120169985104), including framebuffer recreation, 4x MSAA and six reuploaded chunks after context restoration. Actual WebKit area, Ninenzaka and rotated screenshots reviewed. Chromium local passed 41/41; its renderer, scene and lighting hashes exactly match the final CI artifact. Chromium CI remains in progress at this checkpoint.

- Site artifact 12469437387: SHA-256 b077f99a16f1b0e7e42e2d33aed882f9a42b7c0232385896b9464b0065a0da96.
- WebKit artifact 12469517436: SHA-256 5a44824d815c56eace40701c91b2b98c630598dc2b3ab63280ef04fbee8f6989.
- Material coverage: 10,255 translucent architectural instances, 47 protected town instances, two mixed meshes; all 182 town roofs tagged.
- Public remains v4.21, deploy not yet triggered.
