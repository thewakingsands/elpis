# Texture conversion

`composeMap(mapTex, backgroundTex?)` returns `{ format: 'png', data: Buffer }` using the shared texture worker pool. It multiplies RGBA channels, or keeps the main texture when the background is absent or its center pixel is transparent black.

Map composition follows the behavior documented by [Boilmaster](https://github.com/ackwell/boilmaster/blob/48c1413b1eb8e333799e8b467822a50a2c55a59d/crates/bm_asset/src/service.rs). The implementation uses this package's existing TEX decoder and PNG encoder. This package remains GPL-3.0-only.
