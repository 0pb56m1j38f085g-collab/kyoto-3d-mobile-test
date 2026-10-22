# Mobile gzip decoder

`fflate-0.8.3.js` is the unmodified `umd/index.js` from the npm release
`fflate@0.8.3`, MIT licensed (see `fflate-LICENSE`).

Upstream: https://github.com/101arrowz/fflate/tree/v0.8.3

SHA-256: `462ef8041fc970e3615a20a9dd2b2e3047a073b2da729ef4f02b634bba8b7b83`

Only `gunzipSync(data, {out})` is called. A reusable, bounded destination avoids
allocating a fresh uncompressed output buffer for every part. Build-time code
checks this vendor checksum. Runtime code verifies decompressed length, shared
destination buffer, and the SHA-256 of every part before WebGL upload. No runtime
CDN, ZIP input, worker, or dependency installation is needed.
