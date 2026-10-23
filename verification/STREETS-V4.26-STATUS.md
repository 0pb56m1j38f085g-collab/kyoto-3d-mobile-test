# v4.26 — selected tourist streets and crafted paving

Status: implemented, verified and publicly deployed on 2026-10-23.
Base: b20f3d5f834448b8891786145c786294cb845225 (v4.25).

## Scope

- Explicit selection replaces the broad residential/pedestrian road-type display filter.
- Kiyomizuzaka, Sannenzaka, Ninenzaka, Ichinenzaka, Yasaka-dori, Gojozaka and Nene-no-michi are the main core.
- Real unnamed connections to Yasaka-no-to, Shimokawara-dori, Yasaka Shrine's south approach and Daidokorozaka are retained.
- Ishibe-koji's actual bent connection appears when the visible map width is 24 display units or closer on every device.
- Shijo-dori and Hanamikoji remain when panning into Gion. Shirakawa-side lanes await a separate riverbank/bridge treatment; they are not represented as completed here.
- Original geographic files are unchanged. Every selected point, including the truncated branch section, is an original source vertex.
- Omitted local streets still guide parcel frontages; hiding a road must not orient distant houses toward a famous street.
- Main street corridors reserve full crown clearance; the Kiyomizu approach continues to its original source endpoint and its steep junction has a blended grade.
- Sloped paving is subdivided at the actual rendered terrain triangles; validation probes stored stone faces against stored terrain, not just road centre-line heights.
- Paving uses individually separated stone faces, colour variation, segmented curbs, source-tagged stair treads and risers, plus clipped junction overlaps.
- B's gray translucent machiya, opaque landmarks/stone/plants, initial uphill camera and shared iPhone/desktop quality remain.

## Verification

- Tested source: `0f35af70097fbb8cd0ff3d16deeb63ad7fdeba3f`.
- Tested tree: `f72551d03f10c989c3172cbe3032c2f643fa65c9`.
- CI: https://github.com/0pb56m1j38f085g-collab/kyoto-3d-mobile-test/actions/runs/39938945986 — build, WebKit, Chromium and evidence jobs successful.
- WebKit: 50 checks passed; Chromium: 50 checks passed. Each engine captured 17 actual 3D screenshots, including overview, Ninenzaka, Kiyomizuzaka, Gojozaka, Nene-no-michi, the pagoda connection, Ishibe-koji, rotation, zoom and context restoration. Reports are in `v4.26-final/`.
- Actual final WebKit overview/Ninenzaka/Gojozaka and Chromium overview, major approaches and rotated Ninenzaka images were visually inspected. Terrain penetration seen in an earlier candidate was corrected before these final checks. Some narrow junctions and stair edges retain strong shadows and illustrative grade changes; this is not a completed architectural survey or a claim of matching the approved concept in every detail.
- Source tests checked original geographic points, the connected tourist core, Ninenzaka shopfronts/steps, and 79,344 stored paving probes against stored terrain triangles. Minimum paving clearance was 0.030723 display units.
- Packed-light checks verified 200,983 sampled light vertices and preserved all 1,862,007 light samples across seven chunks. Mobile and desktop use identical geometry and baked lighting.
- The local Chromium run also passed 50 checks. Its index URL cache token differed from the clean CI build; geometry, lighting and executable JS hashes matched. The clean CI artifact is the authoritative publication comparison.
- These are new v4.26 results. Earlier v4.25 results are not reused. Physical iPhone validation remains unperformed.

## Publication

- Release commit: `e7365b44ea109429e01b23b35865285cf87483f4`, with exactly the tested tree above. Its no-op release message skips redundant CI; the tested source is its direct parent.
- Publication branch: `area-higashiyama-quality-v4`; Render auto-deploy remains off.
- Render deploy: `dep-dbdjkjlg1s2s73bnurv0`; triggered manually after both browser jobs passed.
- URL: https://higashiyama-quality-v4.onrender.com/
- Render status: live at `2026-10-23T10:49:18.080332Z`.
- Public verification passed at `2026-10-23T10:50:21.572Z`: all 13 asset checks (viewer files, lighting, manifest and seven compressed chunks), plus each decompressed chunk checksum, match the exact CI artifact.
- Public Chromium mobile viewport check passed at `2026-10-23T10:50:26.918Z`: startup, actual Ninenzaka pin tap, Gojozaka paving, baked lighting, 27 selected source ways and zero runtime/WebGL errors. Actual published area/Ninenzaka/Gojozaka screenshots were also inspected and saved in `v4.26-final/`.
- Browser-only proxy certificate bypass was required by the managed browser environment; the independent public byte verifier retained normal TLS validation.

## Remaining scope

Riverbank/bridge treatment for Shirakawa, Yamashina expansion, measured routing/travel times, and further street-edge/parcel refinement remain separate work. Road widths, terrain grades, building dimensions and stone patterns are illustrative; original geographic points and real road connections are retained. Previous v4.24 and v4.25 evidence has been preserved.

## Subsequent security rebuild

On 2026-10-23 the same v4.26 visual assets were rebuilt and redeployed with Node.js 24.22.1 / OpenSSL 3.5.9. Fresh WebKit and Chromium checks passed (50 each), and the public bytes and runtime were verified. The security-update release was `f4adbde8bfb165ca159feb3f0d617448bba3e9c2`, Render deploy `dep-dbdr340n74is73ek9no0`. See [SECURITY-2026-10-23.md](SECURITY-2026-10-23.md) for this later deployment and its separate evidence; the original publication record above is retained as history.

## Later v4.27 visual release

The current public release is now v4.27, with a Gojo bridge opening composition and quieter woodland around enlarged landmarks. See [RIVER-ENTRY-V4.27-STATUS.md](RIVER-ENTRY-V4.27-STATUS.md) for its separate new verification and deployment record. Historical v4.26 evidence above remains unchanged.
