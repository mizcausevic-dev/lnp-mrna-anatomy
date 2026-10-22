# lnp-mrna-anatomy

34-second schematic of lipid nanoparticle mRNA delivery, from circulation to a membrane-anchored antigen.

Remotion composition `LnpDelivery`: 1920×1080, 30 fps, 1,020 frames. The picture is a teaching cut. It is not to scale, and it is not a cryo-EM model.

## Preview

GitHub Pages branch `gh-pages` serves `index.html` and `lnp-mrna-delivery-Cursor.mp4`.

https://mizcausevic-dev.github.io/lnp-mrna-anatomy/

## Timing

| Time | Beat |
|---|---|
| 0:00–0:05 | Circulation. PEG-lipid chains on the shell. |
| 0:05–0:10 | Equatorial section. Coiled mRNA visible inside the ionizable envelope. |
| 0:10–0:17 | Endocytosis, acidification, endosomal escape. |
| 0:17–0:25 | Ribosomal decoding. Nascent peptide elongates, then compacts. |
| 0:25–0:34 | Membrane-anchored antigen on the outer surface. |

Mechanism essay: `medium/anatomy-of-an-mrna-lipid-nanoparticle-Cursor.md`.

## Render

```bash
npm install
npm run render
```

Output: `out/lnp-mrna-delivery-Cursor.mp4`.

The checked encode of this cut is H.264, 1920×1080, 30 fps, 1,020 frames, 34.000 seconds.

`remotion.config.ts` uses SwiftShader and `/usr/local/bin/google-chrome` only when that binary exists. On a GPU machine, Remotion's own browser is used.

## Topics

mrna, lipid-nanoparticle, remotion, scientific-visualization, endosomal-escape, motion-design, threejs, ribosome, kinetic-typography, biophysics

## Repo

https://github.com/mizcausevic-dev/lnp-mrna-anatomy
