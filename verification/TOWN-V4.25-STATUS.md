# v4.25 — translucent machiya: implemented, verified and published

Updated 2026-10-23 UTC.

## Current status

- Runtime source and publication branch: `45d783be65a789dee3e036bf4c3fcfd78f667c78`.
- Approved B implemented: pale neutral gray architectural parts at 0.64 opacity.
- WebKit CI: **41/41 passed**. Chromium CI: **41/41 passed**. Local Chromium also passed 41/41.
- Build, geographic ordering, street/landmark construction, and every packed baked-light index: passed.
- Actual 3D area, Ninenzaka, rotated, zoomed and context-restored images inspected.
- Render deploy `dep-dbdaoelg1s2s73ar12og` became **live at 2026-10-23 00:42:36 UTC**.
- Public bytes verified at 00:43:39 UTC: all 12 files match the exact tested CI artifact, including geometry chunks, decompressed geometry hashes, renderer and lighting.
- Public browser startup and actual Ninenzaka pin tap passed at 00:44:11 UTC; no runtime/GL errors.
- URL: https://higashiyama-quality-v4.onrender.com/
- Physical iPhone testing: **not performed**. Browser mobile viewports are not physical-device certification.

CI: https://github.com/0pb56m1j38f085g-collab/kyoto-3d-mobile-test/actions/runs/39877985638

Reports, public screenshots and exact build metadata are in `verification/v4.25-final/`.
`provenance.json` records source, CI artifact checksums and deployment identity.
`public-verification.json` records all 12 public asset hashes.
`public-browser.json` records the public interaction check. Managed-proxy certificate
handling is documented there; the separate byte verifier retained TLS validation.

## Implementation and visual scope

182 illustrative machiya retain their tiled roofs, eaves, lattice and facade geometry.
Explicit architectural instances within `storybook-town` are neutral and translucent.
Landmarks, people, stone foundations, thresholds, steps, paving and plants remain
opaque and coloured. Coverage: 10,255 translucent architectural instances, 47
protected instances within the town group, and two meshes shared across classes.
No global mesh-name material override is used.

Opaque scenery is drawn first. A depth/normal prepass selects the nearest town
surface per sample, then one alpha blend composites it over the opaque scenery.
Rear architectural layers are intentionally suppressed to keep overlapping houses
legible. This illustrative treatment is not physical glass or multilayer optics.
Existing MSAA attachments are reused; no float targets or large added textures.
The baker still treats the architecture as opaque for shadow rays.

KMP3 stores per-instance opacity alongside the unchanged original instance and
baked-light ordering. Geometry matches the previous composition: 168 meshes,
27,299 instances, 2,475,930 triangles, 1,650 decorative trees and six upload chunks.
Gray material colours have matched baked lighting. iPhone and desktop use the
same full model and baked-light path. The obsolete light-mode help sentence was removed.
Geographic source data, road connections, hill approach and initial camera are unchanged.

The validation exposed a context-restoration bug: the canvas kept its dimensions,
so resize skipped framebuffer recreation in the new renderer. It now checks for
valid render targets before skipping allocation. Restored images and targets are
checked along with lighting, 4x MSAA, dimensions, six uploaded chunks and GL errors.

## Verification history and recovery

- Original v4.24 29/29 browser reports were preserved separately; they were never
  counted as verification of the new transparency implementation.
- The first new scope test had an arbitrary protected-instance threshold. It was
  replaced with semantic checks of every roof, protected stone/plants and mixed meshes.
- A subsequent WebKit run passed actual transparency checks, but the test stopped
  at unsupported mobile mouse-wheel input. Final tests tap the visible zoom control.
- Earlier superseded CI attempts are retained as failed/cancelled history. The final
  run above passed build, both browsers and artifact preservation.
- Original uncommitted v4.24 local notes, reports, build info and PNGs were preserved
  locally before editing and then on the development branch in `fb5213bb0186b7eadaba7dc29cfbffa1778e0ff6`.
  See `STREETS-V4.24-LOCAL-RECOVERED.md` and `verification/v4.24-final/`.
- Before this release, Render was still v4.21 at `b2ff4f28fb9b5d65ac1966f062f696cc67da1b48`.
  The publication branch had already contained v4.24; a URL query was never treated as deployment.
- Render auto-deploy remains off. This release used an explicit deployment after validation.

## Remaining limitations

Approved-concept parity, town density and minor lane joins still need refinement.
Architecture and paving are geographically anchored illustration, not measured
reconstruction. Routing, travel-time data and Yamashina expansion remain unimplemented.
