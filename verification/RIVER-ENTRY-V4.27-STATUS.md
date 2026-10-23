# v4.27 — Gojo bridge arrival and clearer landmark silhouettes

Status: implemented; actual 3D review and new browser/publication verification in progress.
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

Earlier v4.26/security browser results are not verification of this change. Final test, deployment and public-byte evidence will be added after completion. Physical iPhone validation is not claimed.
