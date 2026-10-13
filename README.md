# waves

Drop in a song and ride it: an Audiosurf-like game in the browser. The track is built from the music itself: ridges are its spectrum and arrive on the beat, choruses and drops speed you up, kicks shake the field. Every hit lands in a lane by its band (bass, mids, highs): catch the white ones, dodge the red ones. Three red hits and the song stops.

Play at [dragunovartem99.github.io/waves](https://dragunovartem99.github.io/waves). Steer with ← → or by tapping either half of the screen. The song never leaves your browser.

Add `?debug` to the URL for the analysis view: loudness and detected onsets over the whole song.

## Development

Requires Node 24+.

```sh
npm install
npm run dev          # local dev server
npm run build        # static build into dist/
npm run preview      # serve the build
```

Checks (run by the pre-commit hook and CI):

```sh
npm run format:check
npm run types:check
npm run lint:check
npm test
```

## Deployment

Merging to `main` builds and deploys to GitHub Pages via [pipes](https://github.com/dragunovartem99/pipes).
