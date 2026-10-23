# v4.26 — selected tourist streets and crafted paving

Status: implementation in development; browser verification and publication pending.
Base: b20f3d5f834448b8891786145c786294cb845225 (v4.25).

## Scope

- Explicit selection replaces the broad residential/pedestrian road-type display filter.
- Kiyomizuzaka, Sannenzaka, Ninenzaka, Ichinenzaka, Yasaka-dori, Gojozaka and Nene-no-michi are the main core.
- Real unnamed connections to Yasaka-no-to, Shimokawara-dori, Yasaka Shrine's south approach and Daidokorozaka are retained.
- Ishibe-koji's actual bent connection appears at a camera span of 32 or closer on every device.
- Shijo-dori and Hanamikoji remain when panning into Gion. Shirakawa-side lanes await a separate riverbank/bridge treatment; they are not represented as completed here.
- Original geographic files are unchanged. Every selected point, including the two truncated branch sections, is an original source vertex.
- Omitted local streets still guide parcel frontages; hiding a road must not orient distant houses toward a famous street.
- Paving uses individually separated stone faces, colour variation, segmented curbs, source-tagged stair treads and risers, plus clipped junction overlaps.
- B's gray translucent machiya, opaque landmarks/stone/plants, initial uphill camera and shared iPhone/desktop quality remain.

## Verification policy

New source, packed-light, WebKit and Chromium results are required for this release.
Earlier v4.25 results do not count. Actual area/Ninenzaka and major-street 3D screenshots must be inspected before publishing.
Physical iPhone validation is not performed by these browser tests.
