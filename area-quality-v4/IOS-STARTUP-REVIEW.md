# iPhone startup incidents — v4.15 and v4.16

Deployment results and the follow-up WebKit presentation issue are recorded in
[the v4.16 / v4.16.1 verification status](../verification/IOS-V4.16-STATUS.md).

## v4.16: actual v4.15 device failure at 98% (2026-10-22)

The user reported that physical iPhone Safari reached 98% and then displayed
"A problem repeatedly occurred" at `?v=4.15`. **v4.15 did not resolve the actual
device failure.** Its successful automated WebKit/Chromium tests do not override
this evidence. The last percentage does not identify the exact failing operation:
the next synchronous upload could run before another paint. The OS termination
reason remains unknown.

The new path removes the retained 86,299,052-byte CPU model and the bulk GPU
upload. It uses 47 content-addressed gzip parts, each at most 2,031,824 bytes after
expansion. The same destination buffer is reused for all parts. A second bounded
buffer is reused for compressed input. The pinned MIT-licensed fflate 0.8.3
decoder writes directly into the destination; no procedural scene, vertex Maps,
or baked-light file is loaded on iOS. Every decompressed part's SHA-256 is checked
before upload. Native gzip streams were evaluated in an intermediate version but
left tens of MB of short-lived output buffers waiting for garbage collection.

A GPU fence drains each part's upload commands before the next part starts.
Loading yields to the page between parts and describes preparation progress
without presenting a download percentage as overall startup completion. CPU
geometry is not retained after upload; context restoration refetches parts.
Partial download/decode/GL failures release uploaded geometry and show retry.
Context loss during initial preparation also shows retry rather than using an
incomplete model.

All 4,965,647 rendered triangles and 23,659 source instances remain. Splitting
changes 168 source meshes into 197 draw batches (some instance transforms are
repeated between batches). Every expanded Float32 position and normal is checked
against its original triangle at build time. The canonical geometry and baked
lighting hashes remain unchanged from v4.15. No hosting plan was changed.

Local Chromium passed all 48 district checks, including iPhone/iPad configuration,
all six views, no lighting/procedural requests, one part in flight, no retained
CPU geometry, refetch/restoration after context loss, reload, and mid-load HTTP
503, truncated/corrupt data and context-loss retry screens. This is desktop
software WebGL, not a physical device.

In that environment, first-frame JS object heap was 6,982,340 B and backing
storage 49,773,380 B. The sampled startup maximum backing storage was 49,773,380 B
(100 ms sampling can miss short peaks). After forced GC these were 3,404,852 B
and 376,392 B; the latter remained unchanged after view switches/rotation.
There are still transient decoder/network allocations awaiting GC. Do not claim
that the 2,031,824 B output plus 849,933 B input buffers are the entire CPU heap.
The automated budgets allow browser/GC variability: backing storage below 64 MiB
during sampled startup and below 8 MiB after GC. GPU/process memory is excluded.

WebKit CI and the public build must also be verified before handoff.
Physical iPhone stability still requires device confirmation; neither
the 2 MiB part limit nor JS backing-store measurements describe total app/GPU
memory or guarantee an iOS memory limit.

---

## Historical v4.15 implementation (superseded)

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
