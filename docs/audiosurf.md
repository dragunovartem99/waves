# AudioSurf lineage and track generation

Waves is **inspired by AudioSurf 1, not a faithful port**. Its traffic generator borrows
AudioSurf's central idea: turn a song-wide intensity curve into equally spaced rings, smooth an
intensity-dependent tilt over those rings, and place traffic on significant swells. The renderer,
beat grid, movement model, and game rules are Waves-specific.

This document describes the current implementation and records which parts of AudioSurf were
kept, adapted, or left out. The code remains the source of truth. The original behavior summarized
here comes from earlier reverse-engineering of AudioSurf 1's graphs and native plugins; this
document is now the self-contained project record of those findings.

## Current pipeline

A song is decoded and analyzed entirely in the browser. Analysis runs in a Web Worker; playback
and all gameplay clocks derive from `AudioContext.currentTime`.

```text
Audio file
  -> decode at 44,100 Hz and mix to mono
  -> non-overlapping 1,024-sample Hann-windowed FFT frames (~43.07 frames/s)
  -> magnitude spectra
       -> 12-band square-root intensity       [AudioSurf]
       -> positive log spectral flux -> tempo and beat tracking [Waves]
       -> bass-rise kick envelope             [Waves]
       -> 96-point log-frequency ridge lines  [Waves renderer]

prepare()
  -> speeds(intensity)     song-relative normalization for traffic and visible motion
  -> rings -> eased tilts -> maxima significance -> one hit per swell
  -> deterministic lane, pickup/block quantile, chains, block thinning, and intro grace

  -> cumulative track distance + kick surges
  -> visible XYZ road from smoothed tilts and distance-based curves
  -> beat markers placed on that road
```

Relevant entry points:

- [`src/modules/audio/utils/analyze.ts`](../src/modules/audio/utils/analyze.ts): audio analysis.
- [`src/modules/ride/song.ts`](../src/modules/ride/song.ts): combines analysis into a playable song.
- [`src/modules/ride/utils/hits.ts`](../src/modules/ride/utils/hits.ts): traffic generation.
- [`src/modules/ride/utils/track.ts`](../src/modules/ride/utils/track.ts): visible distance and time
  conversion.
- [`src/modules/ride/utils/road.ts`](../src/modules/ride/utils/road.ts): the visible 3D centerline.
- [`src/modules/ride/draw/scene.ts`](../src/modules/ride/draw/scene.ts): Three.js scene, camera,
  player, and traffic placement.

## What was taken from AudioSurf

### 1. FFT resolution and intensity curve

The core measurement is deliberately very close to AudioSurf:

| Property         | AudioSurf                | Waves                                       |
| ---------------- | ------------------------ | ------------------------------------------- |
| Sample rate      | 44,100 Hz                | 44,100 Hz, enforced by the `AudioContext`   |
| Frame/hop size   | 1,024 samples            | 1,024 samples, without overlap              |
| Window           | Hann                     | Hann                                        |
| Spectrum         | 512 magnitudes           | 512 magnitudes from an in-house radix-2 FFT |
| Frequency groups | 12 groups of 42 bins     | Same                                        |
| Bins used        | 1 through 504            | Same                                        |
| Bin transform    | Square root              | Square root                                 |
| Group reduction  | Mean per group, then sum | Same                                        |

Implementation: [`intensity.ts`](../src/modules/audio/utils/intensity.ts), with frame and FFT
helpers in [`frames.ts`](../src/modules/audio/utils/frames.ts) and
[`spectrum.ts`](../src/modules/audio/utils/spectrum.ts).

Square-root compression and equal-width groups prevent bass from dominating the complete
intensity signal. The value is **not** a conventional RMS loudness envelope and is not normalized
to 0–1 at this stage.

Two details of the original measurement were not retained:

- AudioSurf skips a group whose value is greater than 5 as an outlier guard; Waves sums all 12.
- AudioSurf clamps sample intensity to 0–10 before later processing; Waves leaves the raw sum
  unclamped and relies on relative normalization.

Waves also does not retain the 12 group values for traffic generation. Only their sum is exposed
in `Analysis`.

### 2. Song-relative speed normalization

For both traffic generation and visible motion, Waves keeps AudioSurf's baseline formula:

```text
baseline = min(song peak intensity, 2 * song mean intensity)
speed    = clamp(intensity / baseline, 0.1, 1)
```

Implementation: `speeds()` in [`speed.ts`](../src/modules/ride/utils/speed.ts).

This makes speed relative to each song rather than to an absolute mastering level. Silence still
moves at 10% speed, and sufficiently intense passages reach full speed.

The same normalized curve drives traffic, visible movement, and road relief; see
[Shared speed curve](#shared-speed-curve-traffic-and-visible-motion) below.

### 3. Distance-based rings

AudioSurf accumulates scaled speed and emits a ring whenever a whole distance unit has been
crossed. Consequently, intense sections produce more rings per second, but the rings remain
evenly spaced in track distance.

Waves uses the same accumulator model in
[`rings.ts`](../src/modules/ride/utils/rings.ts):

- `RINGS = 1.68` rings per analysis frame at full speed, approximating AudioSurf's example
  `AdjustedSpeed` of about 1.683 for its 2.9 vehicle-speed setting.
- Each ring records the analysis frame in which it was emitted.
- Each ring carries the peak normalized speed since the previous ring, also matching AudioSurf.

This is only a logical sampling grid. Waves does not reproduce AudioSurf's three-world-unit ring
spacing, vehicle-speed setting, positions, rotations, or road mesh. One frame can emit multiple
rings.

### 4. Eased road tilt

The normalized ring speed is mapped through AudioSurf's exact tilt keys:

```text
speed: 0     0.4   0.5   0.6    1
tilt:  0.7   0.5   0    -0.5   -0.7 radians
```

For every ring:

```text
tilt += (desiredTilt - tilt) * 0.04
tilt  = clamp(tilt, -0.7, 0.7)
```

Implementation: [`tilt.ts`](../src/modules/ride/utils/tilt.ts).

Calm music therefore produces positive tilt and intense music negative tilt. These values still
feed swell detection, but Waves now also renders them as road relief. `road()` applies six
additional smoothing passes, then integrates the slopes into the centerline's Y coordinate with a
relief factor of 1.3. This is Waves-specific geometry rather than a reproduction of AudioSurf's
separate `pitch = -tilt` rendering convention.

### 5. Maxima significance and one hit per swell

Waves ports AudioSurf's swell detector:

1. At each ring, count up to 42 consecutive previous rings with higher tilt.
2. Count up to 42 consecutive following rings with lower tilt.
3. Multiply the counts. The result is the ring's significance, from 0 to 1,764.
4. Positive-significance rings form runs. Emit one hit at the strongest ring in each run, with a
   run search capped by the original 111-ring constant.

Implementations: [`maxima.ts`](../src/modules/ride/utils/maxima.ts) and
[`swells.ts`](../src/modules/ride/utils/swells.ts).

Because tilt falls as intensity rises, this finds rings embedded in sustained musical build-ups.
A hit represents a **broad intensity swell**, not necessarily an onset, beat, or note.

Unlike AudioSurf, which starts walking candidates at ring 11, Waves searches from ring 0. After
chaining and thinning, it discards hits during the first second, creating an opening grace period
without changing swell detection.

### 6. Casual Mono color split, chains, and thinning

Waves uses AudioSurf's casual Mono proportions as a binary game rule:

- Rank all generated swells globally by significance.
- Initially make the weakest 55% red blocks to dodge.
- Make the remaining 45% white pickups to catch.
- A hit fewer than 5 rings after its chain head inherits that head's lane and kind.
- Drop a block fewer than 11 rings after the last retained hit; pickups are always retained.

Implementation: [`hits.ts`](../src/modules/ride/utils/hits.ts).

The 55% split corresponds to AudioSurf casual Mono turning the weakest 30% plus the next 25% grey.
The final Waves block share need not be exactly 55%, because chaining can change kinds, thinning
removes blocks, and the opening filter removes early hits.

AudioSurf's five-color strength distribution was:

```text
weakest 30% purple -> 25% blue -> 20% green -> 15% yellow -> strongest 10% red
```

Waves collapses this to two gameplay kinds. It does not retain intermediate strength colors.

### 7. Deterministic random lanes

The principle of seeded, repeatable lane assignment is retained, so the same analyzed song gives
the same traffic on every ride. The exact generator is different:

- AudioSurf: Mersenne Twister seeded with `songLength * 1000`.
- Waves: Mulberry32 seeded with the number of analysis frames (`speeds.length`).

Implementation: [`random.ts`](../src/modules/ride/utils/random.ts). Waves always has three lanes;
AudioSurf's lane count could vary by mode. Traffic layouts are therefore deterministic but are not
expected to match AudioSurf's layouts.

## Shared speed curve: traffic and visible motion

This coupling is essential for future changes. `speeds(intensity)` is the AudioSurf-compatible,
twice-the-mean normalization described above. It drives both ring placement and accumulation of
visible track distance, and therefore determines:

- tilt, detected swells, and visible road hills;
- the number and spacing of hits;
- hit timestamps and the speed at which the road and traffic approach;
- chain and thinning distances, which are measured in rings;
- beat-marker placement in track distance.

Changing this function changes gameplay and presentation together. The earlier separate
80th-percentile `rides()` normalization was removed.

The visible path also adds a Waves-specific kick surge:

```text
distance per frame = PACE * (speed + 0.5 * kick)
PACE = 3
```

See [`speed.ts`](../src/modules/ride/utils/speed.ts) and
[`track.ts`](../src/modules/ride/utils/track.ts). Kick surges move the view, road, and traffic; they
do **not** retime hits, whose timestamps were already fixed by the traffic ring frames.

## What was added or changed for Waves

### A 3D road with beat markers

Waves renders its own Three.js/WebGL road rather than reproducing AudioSurf's highway mesh:

- Z follows cumulative track distance, preserving the relationship between movement and hit time;
- Y integrates the smoothed tilt curve into climbs and dives;
- X follows deterministic distance-based heading curves;
- the per-frame XYZ centerline becomes a three-lane mesh with edge and lane stripes.

Tempo is estimated from spectral-flux autocorrelation over 60–200 BPM, with a prior around 120 BPM.
Dynamic programming tracks beats while tolerating small timing deviations and gaps. The grid can
also compute quarter-beat positions where distance permits, but the current road renderer draws
transverse markers only on tracked beats.

The beat grid is **not** the traffic ring grid. Hits are not snapped to beats. Beat tracking and
spectral flux serve visualization, while hit placement follows intensity swells.

Relevant files: [`flux.ts`](../src/modules/audio/utils/flux.ts),
[`tempo.ts`](../src/modules/audio/utils/tempo.ts),
[`beats.ts`](../src/modules/audio/utils/beats.ts),
[`grid.ts`](../src/modules/ride/utils/grid.ts),
[`road.ts`](../src/modules/ride/utils/road.ts), and
[`draw/road.ts`](../src/modules/ride/draw/road.ts).

### Spectrum-as-terrain presentation

Each analysis frame also produces a 96-point, log-spaced ridge covering 40 Hz–12 kHz. Bass points
interpolate between FFT bins; treble points take maxima across bins. The values are log-compressed,
smoothed, and normalized to the song's peak.

These ridges are a Waves visual system, not part of AudioSurf's algorithm. The 3D renderer averages
each 24-point third of the spectrum and draws three spectral lines on each side of the road, with
their height following the music. Kick strength adds a distance surge and influences the camera;
it no longer drives a Canvas field ripple. See [`ridge.ts`](../src/modules/audio/utils/ridge.ts),
[`ridges.ts`](../src/modules/audio/utils/ridges.ts),
[`kicks.ts`](../src/modules/audio/utils/kicks.ts),
[`waves.ts`](../src/modules/ride/draw/waves.ts), and
[`camera.ts`](../src/modules/ride/draw/camera.ts).

### Different interaction and scoring

Waves uses three road lanes, white torus pickups, red car obstacles, and a dark player car. A
pickup has an ±80 ms catch window and scores `10 * new streak`; a miss breaks the streak. A block
in the current lane costs one of three lives immediately on arrival. These rules are not an
attempted recreation of AudioSurf scoring or vehicle modes.

## AudioSurf features deliberately not ported

The following are absent from the current implementation, even where related constants remain in
the traffic generator:

| AudioSurf feature                                                   | Status in Waves                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Visible uphill/downhill road geometry                               | Adapted; smoothed tilt drives Waves-specific road relief          |
| Pan/yaw curves, direction changes, and straight final 500 rings     | Replaced by deterministic distance-based heading curves           |
| Sidewinder roll                                                     | Omitted                                                           |
| Physical ring positions, rotations, road colors, and 3-unit spacing | Replaced by a per-frame XYZ centerline and Three.js road mesh     |
| Five strength colors                                                | Collapsed to white pickups and red blocks                         |
| Non-Mono traffic rules and non-Mono easy thinning                   | Omitted                                                           |
| Pro/Elite 75% grey split and Elite 6-ring thinning                  | Not exposed; one casual-like ruleset is active                    |
| Variable lane counts and vehicle/mode selection                     | Replaced by a fixed three-lane game                               |
| Intensity outlier guard and 0–10 sample clamp                       | Omitted                                                           |
| Per-frequency-group traffic data                                    | Only total intensity is retained; lanes are seeded random choices |
| Intensity-triggered tunnels and their 10% threshold search          | Omitted                                                           |
| Initial traffic scan at ring 11                                     | Omitted; scanning begins at ring 0                                |
| Exact Mersenne Twister layout reproduction                          | Replaced by Mulberry32 with a frame-count seed                    |
| Highway cache/prebuild pipeline                                     | Unnecessary; analysis is local and performed per loaded song      |

In particular, keeping constants such as `0.04`, `42`, `111`, `5`, and `11` does **not** mean the
whole AudioSurf highway or mode system exists. Those constants belong specifically to traffic
generation.

## Earlier Waves approaches that were replaced

Before the AudioSurf-style swell generator, Waves used several experiments. They are no longer
part of current traffic generation:

- **One hit per detected onset** was replaced by one hit per significant intensity swell.
- **Bass/mid/treble rise chose the lane** was replaced by deterministic random lanes. The visible
  ridge still runs from bass to treble, but traffic lanes are no longer assigned by band rise.
- **Local spectral-flux ranking** (within ±4 seconds) and intensity-dependent blocks-per-second
  targets were replaced by the global 55/45 swell-strength split.
- **A three-lane fairness rule** that converted an impossible wall into a pickup was removed along
  with the onset-based generator; AudioSurf-style chaining and block thinning now control traffic.
- **Rank-normalized loudness/mid/high intensity with bidirectional EMA smoothing** was replaced by
  AudioSurf's direct 12-band square-root spectrum sum.

Spectral flux itself was not removed: it remains the onset-strength signal for tempo estimation
and beat tracking. Likewise, bass-rise detection remains for kicks and visible surges.

## Invariants and guidance for future changes

1. **Keep the analysis rate explicit.** Band boundaries, kick detection, ring timing, and ridge
   frequencies assume 44,100 Hz and 1,024-sample frames. Supporting another rate requires scaling
   bins and retuning frame-based constants, not merely changing `RATE`.
2. **Know which timeline you are changing.** Audio frames and hit timestamps are song time; rings
   are traffic distance; `track` is visible distance. They are related but not interchangeable.
3. **Retune coupled constants together.** Ring rate, tilt easing, the 42-ring significance reach,
   the 111-ring run cap, and 5/11-ring traffic rules were designed around AudioSurf's ring density.
   Changing `RINGS` alone changes their effective time spans.
4. **Expect intensity changes to move traffic.** Adding smoothing, compression, normalization, or
   outlier rejection changes virtual tilt and can create or remove swells. This affects gameplay
   even if the renderer is untouched.
5. **Preserve determinism.** Continue using seeded generation rather than ambient randomness if
   repeated rides of the same song should remain identical.
6. **Keep traffic and road relief in sync.** `tilts()` feeds both `maxima()` and, after additional
   smoothing, visible road geometry. Changing tilt can affect both hit detection and the ride.
7. **Treat beat alignment as a separate design decision.** Currently beats control road markers,
   not hit timing. Snapping hits to beats would change the ported AudioSurf traffic model.
8. **Check final traffic, not only the initial quantile.** Chains, thinning, and the opening filter
   can substantially change the final pickup/block ratio and spacing.
9. **Validate with both unit tests and real songs.** The pure helpers have focused tests, but hit
   density, song-to-song speed, and playability also need listening and full-song rides.
