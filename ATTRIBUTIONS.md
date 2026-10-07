# Asset attributions and provenance

This file separates the portfolio's source code from third-party media, marks and research material. It must be completed before the repository is made public.

## Original project material

### Worm Profiler camera captures

- **Files distributed here:** Derived Worm Profiler media in `public/assets/demos/`
- **Original captures:** Retained locally and excluded from this repository
- **Project:** Chimeric planarian imaging and morphometric analysis
- **Creator/copyright holder:** To be confirmed before the repository is made public
- **Permission to publish derived presentation media:** Pending confirmation from the applicable rights holder
- **Reuse terms for derivatives:** Portfolio demonstration only; all rights reserved

The original 26 MP camera captures are retained locally and are not distributed with this repository. The optimized presentation media is included for portfolio demonstration only and may not be reused or redistributed without written permission.

#### Worm Profiler reuse terms

Copyright © 2026 George Onyemenam. All rights reserved.

The Worm Profiler source code is published for portfolio review and technical evaluation. No licence is granted to use, modify, redistribute, publish, sublicense or sell the code, except for the limited viewing and forking rights provided by GitHub's Terms of Service.

The optimized camera-image derivatives, segmentation outputs and other research-derived media are provided for demonstration only. They are excluded from any software licence and may not be reused, redistributed, republished, used for model training or incorporated into another research or commercial project without written permission from the applicable rights holder.

The original high-resolution camera captures are not included in this repository.

## Third-party material

### SoccerNet sequence

- **Local media excluded from this repository:** `public/assets/demos/touchline/frames/*`
- **Implementation data retained in this repository:** `public/assets/demos/touchline/preview-data.js`
- **Dataset/sequence:** SoccerNet, sequence identified in the demo as SNGS-021
- **Dataset source:** [SoccerNet](https://www.soccer-net.org/)
- **Disclosing party/data owner under the agreement:** King Abdullah University of Science and Technology (KAUST)
- **Access basis:** Non-Disclosure Agreement effective 12 August 2026 between George Onyemenam and KAUST; the agreement is retained privately and is not included in this repository
- **Ownership:** Under section 6 of the agreement, confidential information and its copies remain the property of the disclosing party
- **Licence:** Under section 8, the agreement creates no express or implied patent, copyright, trade-secret or other intellectual-property licence beyond the agreement's authorized purposes
- **Redistribution:** The agreement does not expressly authorize publication or public redistribution of the supplied video data. Third-party disclosure requires written authorization from the disclosing party unless the material falls within an applicable exception in section 2
- **Agreement term:** Confidentiality obligations run until 12 August 2028 unless KAUST provides earlier written permission. Expiry of the confidentiality term does not itself grant a copyright or redistribution licence
- **Changes:** Frames sampled and converted to WebP; annotations and browser presentation added for the Touchline demo

**Publication status:** The SoccerNet-derived frame sequence is retained locally and excluded from the public repository. It must not be added to a public repository or downloadable release without written authorization from KAUST/SoccerNet, or documented confirmation that the exact material is public and may be redistributed under separate terms.

### Placeholder 3D cat model

- **File:** `public/assets/placeholders/oiia-cat.glb`
- **Model title:** Oiiaioooooiai Cat (downloaded GLB asset; original listing title to be verified)
- **Creator:** Not yet documented
- **Source URL:** Original download page not yet documented
- **Licence:** Not yet verified; do not redistribute the model until its licence is confirmed
- **Changes:** Presented through a custom Three.js viewer with portfolio-specific lighting, camera constraints and reset behaviour; modifications to the model file itself have not yet been documented

### GitHub mark

- **File:** `public/assets/brand/github-mark.svg`
- **Owner:** GitHub, Inc.
- **Source:** [GitHub Logos and Usage](https://github.com/logos)
- The mark is used only to identify a link to the associated GitHub profile.

### Goodreads mark

- **File:** `public/assets/brand/goodreads-official.svg`
- **Owner:** Goodreads/Amazon
- **Source:** [Introducing our new logo and more ways we continue to improve Goodreads](https://www.goodreads.com/blog/show/2984-introducing-our-new-logo-and-more-ways-we-continue-to-improve-goodreads)
- The mark is used only to identify a link to the associated Goodreads profile.

## Software dependencies

JavaScript dependency licences are recorded in their respective packages and lockfile. Key runtime/build dependencies include Three.js, Vite, Wrangler, the Cloudflare Vite plugin, the OpenAI Sites Vite plugin and Sharp.

Before publication, generate or review a dependency-licence report if the repository will redistribute bundled third-party code beyond ordinary compiled website assets.
