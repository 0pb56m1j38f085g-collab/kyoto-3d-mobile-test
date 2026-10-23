# v4.27 — Gojo bridge arrival and clearer landmark silhouettes

Status: implemented, newly verified in WebKit/Chromium, and publicly deployed on 2026-10-23.
Base: `851e267a5be3f5222fb3523d475703f418f214f5` (v4.26 with the Node.js security update).

## Scope

- The opening camera looks from the real Gojo Ohashi position toward Kiyomizu. The river, bridge, town, hillside approaches and main-hall silhouette share one frame.
- Original landmark anchors and building rotations are unchanged. Kiyomizu grows from 5.8 to 6.4 display scale; Hokanji from 2.8 to 4.0; Yasaka from 2.5 to 3.0; Kodaiji from 2.2 to 2.6.
- Decorative trees are lower, with wider clearings around architecture. The eastern hillside still reads as woodland, with 1,250 crowns instead of 1,650.
- Gojo Ohashi and six connected Gojo-dori source sections are extracted from a new OpenStreetMap response. All stored latitude/longitude and projected road vertices remain source-based. One carriageway illustrates the street; this is not a pedestrian or traffic route graph.
- Gojo-dori has a quiet gray road surface and paved edges. Historic lanes retain the crafted stone treatment and existing Ninenzaka shopfronts.
- The added bridge has its own map pin and close view. Northern landmarks remain accessible through directional controls. The bottom menu and iPhone-only simplified rendering remain absent.
- Existing river/road/building source files, semantic translucent town materials and the Node.js 24.22.1 pin are preserved.

## Sources

- https://www.openstreetmap.org/api/0.6/map?bbox=135.766,34.993,135.779,34.998 — retrieved 2026-10-23; raw response SHA-256 `295f1b90d6a9266361c794ce5f2dcb41338bb372add5683d72ee08716ab9d411`.
- https://www.kyoto-kankou.or.jp/info_search/129 — Gojo bridge on Gojo-dori at Kiyomizu-Gojo.
- https://www.jr-odekake.net/navi/kyotomap/smarttravel/kiyomizu.html — real Gojo-dori / Gojozaka approach.
- https://www.kiyomizudera.or.jp/access/ — actual temple entry guidance.

## Verification

- Tested source: `16451cf65634c9c9c8406ad1be54061c1dd29fc6`; tested tree: `5ef5455692e04c137072bc5815a27cb4e7c2a9b9`.
- New CI run: https://github.com/0pb56m1j38f085g-collab/kyoto-3d-mobile-test/actions/runs/40025477786 — build, WebKit, Chromium and evidence jobs all successful.
- WebKit: 55 checks passed; Chromium: 55 checks passed. Each captured 18 actual 3D screenshots. Checks cover startup, transparent town rendering, zoom, rotation, context recovery, landmark navigation, the Gojo bridge pin, stone streets and the revised opening composition.
- Five viewport framing checks passed. The bridge is visible in the foreground, slopes lead toward the temple, and the main hall and stage fit the opening frame. The 390 × 700 opening frame gives the main hall about 156 CSS pixels of width.
- Geographic source and landmark construction tests passed. All 86,692 stone-surface probes passed, with 2,185 stone faces, 24 treads and four continuous Ninenzaka joins. Packed lighting checks covered 221,995 vertices and all 1,991,321 lighting samples.
- The fully rebuilt model has 180 meshes, 28,030 instances and 2,368,054 triangles. Its model hash is `bdf2609eab20c442bec0083b06539703fd0e909e5fab99f3df87572cfd16a1e0`; lighting hash is `f9fae0b7c5d54ae4fc363e0addcaf0bc92c85da8b7178f5abd7f461397bd925f`.
- The site and both browser ZIPs were checked against their GitHub artifact SHA-256 digests. Actual WebKit overview/Ninenzaka and Chromium bridge images were inspected, along with the local baked-lighting preview. The CI model and lighting match the locally reviewed model exactly.
- CI used Node.js 24.22.1 / OpenSSL 3.5.9. Earlier v4.26/security results were not substituted for these new checks.

## Publication

- Public release commit: `bea8f0dbd4dbe6bd732336b27c05f5c1cd64ccf2`, with exactly the tested tree. The no-op release commit has the tested source as its direct parent.
- Public branch: `area-higashiyama-quality-v4`; auto-deploy remains off.
- Render deploy: `dep-dbdt54vf3r2c73bvj430`, manually triggered after both browser jobs passed.
- Public URL: https://higashiyama-quality-v4.onrender.com/
- Live at `2026-10-23T21:36:37.526657Z` (22:36 Europe/London on 2026-10-23).
- Render build log identifies Node.js 24.22.1 / OpenSSL 3.5.9 and the exact CI model hash. The earlier security update remains active.
- Public byte verification passed at `2026-10-23T21:37:46.653Z`: all 13 viewer, lighting, manifest and geometry-chunk files match the exact CI artifact, including every decompressed chunk checksum. Build runtime also matches. Normal TLS verification remained enabled.
- Published-page Chromium mobile-viewport verification passed at `2026-10-23T21:38:13.264Z`: startup, actual Gojo bridge and Ninenzaka pin taps, Gojozaka paving, full baked lighting, opacity 0.64, 33 selected source ways, 1,250 trees and zero runtime/WebGL errors.
- The actual published overview, bridge and Ninenzaka screenshots were visually inspected. Reports and four published screenshots are preserved in `v4.27-final/`.
- The browser's managed-proxy certificate bypass is recorded in its report; the independent Node.js byte verifier retained normal TLS verification.

## Limits

Physical iPhone testing remains unperformed. Buildings, streets, bridge width and terrain are illustrative exaggerations anchored to real geography, not measured reconstruction. The selected Gojo carriageway is a visual street axis, not pedestrian route guidance. Route calculation, walking times and Yamashina expansion remain unimplemented. Riverbanks and individual town parcels can still be refined. The bridge close view and opening composition were reviewed as part of this release; no claim of finished guidebook-level coverage is made.
