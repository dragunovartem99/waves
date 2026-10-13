# groove

Drop in a song and ride it: an Audiosurf-like game in the browser. The track is built from the music itself — loud parts run downhill, every hit becomes a block.

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
