# v4.23 — Approach the temple from the town

User accepted the v4.22 visual improvement and asked for a visitor's uphill
composition: town in front, Kiyomizu beyond the slope, and the projecting stage
visible toward screen right. Preserve geographic relations and the shared full
quality rendering on iPhone.

## Implemented

- Opening camera: west-southwest toward east-northeast, yaw -1.15, pitch 0.49.
- Frame Kiyomizu, Hokanji, Ninenzaka and Sannenzaka as the opening core. All
  northern landmarks remain constructed, with explicit directional buttons when
  outside the viewport. Tapping a direction opens the actual landmark view.
- The temple has **not** been rotated or relocated. Changing the camera exposes
  its stage toward screen right while preserving the existing architectural axis.
- The geographic source for the uphill composition check is the existing
  Kiyomizuzaka polyline, OSM way 28514434. This is not a new route from a station
  and does not establish a travel time or a verified entrance/navigation graph.
- The main-hall and street close-ups use the same side of the map as the opening.
- Add exact validation for reusing a prior CI lighting artifact during a viewer
  build: geometry, baker, ray count, sample count, header, length and payload hash
  must all match. Otherwise the normal bake path remains in use.

## Evidence

Four actual WebKit camera views were rendered from the verified v4.22 geometry
and lighting in run `39861156606`, commit
`b92789b2b3475d3dc52f343f001687cd2749f3ee`. The `uphill-core` composition was
selected. This camera comparison hides interface chrome and is not the final
application screenshot. Artifact: `12461308185`; ZIP SHA-256:
`f9f59aafa0d70d39cbdb90cf371d720590f3228c25031a9efc27d2898f46e8c7`.

Local rebuilt geometry is byte-identical to the accepted v4.22 draft:
`ca5b53bef7c8e2e1222aa2e84276c245c9c216338dd92db33d798f2f1487d8bd`.
Matched lighting:
`eee92658125d2e5adfaf9f277a6fbfa1f5d90de0fdb7a7d5807d98cb8df7170b`.
The packed-light check passed for 164,961 vertices and 2,074,731 light samples.
The camera test passed at 390×700, 390×660, 375×560, 430×932 and 1280×900:
the source street rises into the screen, the temple is beyond the approach,
the stage projects right, and the entire main hall remains in frame.

Final v4.23 verification completed successfully in run `39861969895`, testing
`f3ff3aff6eaa566f6192b9f3b1d2f6d76ebf4e8e`. Build/reference/pack/framing checks
passed; WebKit and Chromium each passed 29/29 browser checks. These include
full-quality lighting, explicit offscreen Yasaka directions, tapping that
button to open the real landmark, zoom views, reload and context recovery.

The final UI-bearing WebKit image was inspected. The town is in the foreground,
Kiyomizu stands beyond the approach, and its stage projects to the right. The
northern landmark labels are explicitly arrow directions rather than false pins.
This addresses the requested orientation; it does not resolve the remaining
streetscape/material issues listed below.

Final image: [Actual WebKit opening](v4.23/iphone-area.png).
Raw browser reports: `v4.23/webkit-report.json`, `v4.23/chromium-report.json`.
Full-site artifact `12461779279` (ZIP SHA-256
`cac0ea1396dae2159149ce526fc0a34dedf8862901fbb5798b7eca975c49585f`)
was downloaded and its model, lighting and viewer file hashes verified.
Browser artifacts: WebKit `12462701929`, Chromium `12463220276`.

## Remaining scope

Street/terrain joins, conspicuous plinths on steep slopes, frontage variety and
canopy/material character still need work. The core scene is not yet equivalent
to the approved concept. Yamashina and the other directional extensions are not
constructed. WebKit CI is not a physical-iPhone test. No new public deployment
has been triggered for this revision.
