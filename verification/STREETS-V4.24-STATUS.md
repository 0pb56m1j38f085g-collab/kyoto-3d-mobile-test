# v4.24 — Stone streets and connected shopfronts

User authorized the next streetscape pass, beginning with Ninenzaka. Keep the
accepted uphill opening composition, geographic landmark ordering and shared
full visual quality on iPhone. This revision is a development candidate until
the actual rendered evidence below is completed.

## Implementation

- Historic lanes use continuous joined edges, a mortar bed and five restrained
  stone tones. Faces are batched by material, not separate stone objects.
- Horizontal stair treads and vertical risers occur only on the existing
  OSM-tagged stair ways. The existing synthetic relief is graded across the
  street width. Ninenzaka's very small previous rise is visually emphasized;
  this is illustrative terrain, not surveyed elevation or actual step counts.
- Kiyomizuzaka's exaggerated rise is distributed along its existing source
  polyline, avoiding the former abrupt cliff halfway up the approach.
- Smaller machiya frontages, parcel-constrained depth, roof overlap checks,
  stone thresholds, fitted foundations, lattice, warm shop interiors and eaves.
  Generic shops do not identify or reproduce individual businesses.
- Ninenzaka's close-up looks along the street. The accepted west-southwest
  opening and all named landmark anchors are unchanged.
- Three unnamed rear-access ways (550360175, 550360176, 550360177) are omitted
  from this compressed illustration to allow legible Ninenzaka shop parcels.
  They remain untouched in the original geographic source. The illustrated
  map is not a complete routable street network. Other displayed roads and
  every historic street retain their source centre lines.

## Reference

Kyoto City Tourism Association describes the connected Ninenzaka → Sannenzaka
→ Kiyomizuzaka approach, steps and traditional shop-lined streets:
https://plus.kyoto.travel/entry/higashiyamaeki

Kiyomizu-dera's official access page identifies Kiyomizuzaka as the approach
to the Niomon entrance: https://www.kiyomizudera.or.jp/access/

## Validation

Runtime candidate: `77a55e3fe0eae47bb6ddc02cfa1d8d03a48d7a54`.
CI run: https://github.com/0pb56m1j38f085g-collab/kyoto-3d-mobile-test/actions/runs/39866502589

Local geometry checks passed (`stone-streets`, `storybook`, `concept-pack`,
`uphill-framing`). They verify unchanged historic centre lines, geographic
ordering, 21 horizontal treads, four coincident Ninenzaka way joins, pavement
above its ground, pairs of shopfronts on both sides, connected thresholds,
roof/street clearance, packed light indices and five opening viewport sizes.

The short Ninenzaka section contains five source-anchored illustrative shops.
The whole constructed area has 181 houses, 1,650 trees, 2,470,316 triangles and
27,217 instances. The common-quality geometry download is 2,954,065 bytes,
in six chunks; no iPhone geometry reduction was introduced. This is not an
on-device memory or frame-rate measurement.

Model SHA-256:
`0a05e9c2b479257201eda83612a468ab5edd33f8a8547c51c5f978da7ad797d9`.
Expected light samples: 1,857,922. Matching full lighting completed with 24
rays and SHA-256 `b99de2a839517bf2d83116c2d47691a7b100454764bba978723ea84a2725d431`.
Both WebKit and Chromium completed all 29 checks successfully. The reports
and the actual WebKit overview / Ninenzaka images are in `v4.24/` alongside
this document. These images describe commit `77a55e3`, not subsequent edits.

The downloaded browser ZIP digests were verified against GitHub metadata:
- WebKit: `ae9e94caad0ff79c6cef3d6ed3fd2f5bc142e43430bbe58c651998715c3aeffb`
- Chromium: `3b343ef8190585b75bff655fd5de870778c084360f3892a08ebb5b1b16809414`

Visual inspection confirms stone joints, continuous Ninenzaka paving and the
visible Kiyomizu stage. It also finds overly thin Ninenzaka buildings, sparse
town frontage and visibly fragmented secondary-road edges. This is therefore
not concept-parity acceptance. No physical iPhone test or public deployment
has been performed for this candidate.

## Follow-up: credible shop proportions

The next source revision searches narrower frontage widths before reducing
depth, imposes a minimum Ninenzaka depth of 0.55 display units, and caps its
height/depth ratio at 1.85. Source anchors, maximum 0.65 frontage shift,
historic street centrelines, temple orientation and opening camera are kept.
Unfit parcels are omitted rather than turning into thin walls. The regression
test checks these proportions in addition to a run of shops on both sides.
New geometry requires a fresh lighting bake and new browser screenshots;
the preceding 29/29 results must not be attributed to this follow-up.

Local `build.cjs --validate-only`, `tests/stone-streets.cjs` and
`tests/storybook.cjs` pass for the follow-up: six Ninenzaka shops, 182 houses,
2,475,930 triangles, 27,299 instances, 2,954,952 compressed geometry bytes.
The historic-street and building-source hashes remain unchanged.
Follow-up model SHA-256:
`0d1a52baea062db738e4c15e4cb536f330b93708645f62979f6143d803dadfad`.

## Remaining limitations

This pass does not establish parity with the approved concept. Individual
facades, paving stones, widths and heights are illustrative. Walking routes,
travel times and the Yamashina/directional extensions are not implemented.
The previous public version is not changed by a development-branch commit.
