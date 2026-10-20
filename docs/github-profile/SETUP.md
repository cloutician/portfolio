# GitHub profile files

These files are prepared for the public `cloutician/cloutician` profile repository.

1. Copy this folder's `README.md` into the root of that repository, replacing the old profile introduction.
2. Copy the `assets/badges/` folder and `.github/workflows/snake.yml` into the same paths in that repository.
3. Open its Actions tab and select **Generate contribution snake**, then **Run workflow** if the initial push has not already run it.

The animated heading and coloured buttons appear when the README is saved. The contribution snake appears after the workflow succeeds and publishes the two SVG files to the `output` branch. It refreshes daily. The default GitHub token is used; no personal token is needed.

The README uses a blue animated heading, blue Portfolio button, purple LinkedIn button, charcoal technology badges, green contribution cells and a purple snake. Light and dark snake variants follow the reader's colour preference.

The introduction reads "I build software." and "Matrix multiplications, everywhere." The animated heading features C++, Python, Kotlin and TypeScript. Language badges also include Java, JavaScript and SQL. The 25 technology badges are grouped into four sections: Languages, Machine learning & computer vision, Applications & infrastructure, and AI tools. CUDA appears under Machine learning & computer vision, with the green NVIDIA logo. Applications & infrastructure combines the former Applications and Cloud & development tools groups. The expandable list includes the more specialised tools from the supplied CV.

Copy the README, badge assets and workflow above. This draft is stored within the portfolio workspace for convenience; publishing it belongs in the profile repository.

Sources:

- Reference profile: https://github.com/xu91102/xu91102
- Animated heading: https://github.com/DenverCoder1/readme-typing-svg
- Badge images: https://shields.io/badges/static-badge
- Contribution snake: https://github.com/Platane/snk
- Profile README requirements: https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme

Java and AWS badges use Devicon artwork; Google Cloud uses its multicolour cloud artwork with Google brand colours. SQL uses a generic database symbol. The SVG badges keep the same charcoal background and 28-pixel height as the other badges. Devicon licence and source attribution are included in `assets/badges/`.

A separate AI tools row includes Codex, Cursor and Claude, based on the tools named in the profile discussion. These use the same bold text, charcoal background and 28-pixel badge height as the rest of the stack.
