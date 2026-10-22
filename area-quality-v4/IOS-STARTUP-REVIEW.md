# v4.15 — iPhone startup incident and bounded model loading

## Incident (2026-10-22)

The user supplied actual iPhone screenshots of v4.14: repeated page failure in
an in-app browser and a server-not-responding message in Safari. Previous
iPhone-UA/WebKit automation had passed but did not establish physical-device
stability. The exact iOS termination reason is unavailable; memory pressure is
a strong candidate, not a confirmed OS crash diagnosis. The network timeout is
not proven to share that cause.

The existing Render static site remained live on commit `9d6fce6`. HTTP probes
from the development host returned 200 for HTML, build metadata and source
assets. Three subsequent HTML requests took 5914, 269 and 171 ms. These do not
measure the user's cellular/CDN route. No hosting plan or service was changed.

## Confirmed implementation problem

iOS skipped `lighting.bin`, but still generated the entire procedural scene
and built per-vertex string-key Maps for unused baked-light indices. A Node VM
probe of v4.14 used 705,077,352 bytes of JS heap after scene construction
(406,739,544 after explicit GC), before WebGL upload. This is a host measurement,
not an iPhone memory limit or a physical iPhone measurement.

## Change

- Compile indexed render buffers at build time, with the original Float32
  positions, normals, triangle order/winding and instance transforms.
- Validate every indexed position/normal against the original expanded input.
  All 4,965,647 rendered triangles and 23,659 instances remain. The unchanged
  canonical model SHA-256 is
  `3d0efaaa64b827d69108be730d8a0c8d5b94174c7d4c90fa647d8f5dd4b6085b`.
- Omit the unused UV attribute only; a build guard rejects shaders that start
  consuming UVs. All current materials use world-space coordinates.
- On iPhone/iPad, do not fetch or evaluate `scene.js`. Stream gzip into one
  preallocated 86,299,052-byte buffer and expose typed views, without runtime
  model generation, lighting-index generation or another full-size decode copy.
- Content-addressed mobile file: 23,855,262 compressed bytes. This is still a
  substantial first download; it is not a claim of a tiny/offline app.
- Retain the one CPU buffer for WebGL context restoration. Disable iOS MSAA
  attachments/default canvas antialiasing; keep dynamic 1024 shadow, bounded
  resolution, no baked-light download and the non-bypassable light-mode guard.
- A failed download shows a retry screen; it never falls back to the heavy
  procedural model. Requires `DecompressionStream`; missing support gives an
  update message rather than running the heavy path.

## Local evidence

Desktop Chromium with an iPhone user-agent, software WebGL, 390×844 viewport.
Measured using CDP `Runtime.getHeapUsage`, after explicit garbage collection:

| Allocation | v4.14 | v4.15 |
| --- | ---: | ---: |
| JS object heap | 381,268,424 B | 3,358,780 B |
| Backing storage | 6,938,057 B | 86,399,377 B |
| Sum | 388,206,481 B | 89,758,157 B |

This sum excludes GPU allocations, browser/process overhead and transient
peaks. The first-frame v4.15 backing storage was 157,820,475 bytes before GC;
do not describe 90 MB as peak total memory. After six view switches and rotation,
the backing storage remained 86,399,377 bytes. Timing comparisons are not used:
the baseline used a public-byte host relay, while v4.15 used localhost.

`tests/district-check.cjs` passed 43 local checks: iPhone/iPad no procedural code
request, no lighting request, one bounded buffer, light mode, real frame/GL
health, unchanged triangle/instance counts, every district view, reset/resize,
context-loss restoration, reload, desktop mismatch fallback, and a simulated
503 retry screen. `tests/mobile-memory.cjs` passed allocation budgets and all
district screenshots. These tests are automated, not real iPhone tests.

Run the same district checks under WebKit and verify the actual public build
before handoff. Physical iPhone stability remains pending user verification.

## Accuracy status unchanged

This is a memory/startup fix, not new geographic or architectural evidence.
Individual machiya facades, heights/roof forms, Kiyomizu contour matching,
stage boundary, gardens and terrain remain partly inferred. Do not mark
high-accuracy reconstruction or design-concept parity as complete.
