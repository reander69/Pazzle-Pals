# Puzzle Pals

A kid-friendly animal picture puzzle game with ten levels and ten animals: puppy, kitten, lion cub, bunny, elephant, fox, penguin, panda, giraffe, and turtle. Level 1 is a 2×2 puzzle; levels 2–3 are 3×3; levels 4–5 are 4×4. The size then increases every two levels, reaching 7×7 at level 10. Each solved animal joins your personal zoo. The game uses a fresh set of locally stored SVG illustrations with rich colors and friendly cartoon details.

## Play locally

Open `index.html` in a web browser. No build step or package installation is needed.

## Publish with GitHub Pages

In the repository settings, open **Pages** and choose **Deploy from a branch**. Select the `main` branch and the `/ (root)` folder, then save. GitHub will show the published site URL in the Pages settings.

Animal collection progress is saved in the browser's local storage on the player's device.
Use **Release all animals from the zoo** in the zoo area to empty the collection and return to level 1. An animated confirmation dialog lets you cancel or confirm before saved progress is cleared.

## Artwork

The game uses ten newly created local SVG animal illustrations in `animal/`. Every puzzle tile uses the same unaltered illustration shown in the picture clue.
