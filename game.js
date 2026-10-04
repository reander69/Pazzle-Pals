const animals = [
  { name: "puppy", title: "Meet the puppy!", image: "animals/dog.svg", cheer: "Woof, woof! You solved the puppy puzzle!" },
  { name: "kitten", title: "Meet the kitten!", image: "animals/cat.svg", cheer: "Meow! You solved the kitten puzzle!" },
  { name: "lion cub", title: "Meet the lion cub!", image: "animals/lion.svg", cheer: "Roar! You solved the lion cub puzzle!" },
  { name: "bunny", title: "Meet the bunny!", image: "animals/bunny.svg", cheer: "Hop, hop! You solved the bunny puzzle!" },
  { name: "elephant", title: "Meet the elephant!", image: "animals/elephant.svg", cheer: "Toot, toot! You solved the elephant puzzle!" },
  { name: "little fox", title: "Meet the little fox!", image: "animals/fox.svg", cheer: "Fantastic! You solved the little fox puzzle!" }
];

const celebration = document.querySelector("#celebration");
const board = document.querySelector("#puzzle-board");
const liveMessage = document.querySelector("#live-message");
const soundToggle = document.querySelector("#sound-toggle");
const levelDots = document.querySelector("#level-dots");
let level = loadLevel();
const collectedAnimals = loadCollection();
let moves = 0;
let selectedPosition = null;
let pieces = [];
let soundOn = true;
let audioContext;
let completed = false;

function loadLevel() {
  try {
    const savedLevel = Number.parseInt(localStorage.getItem("puzzlePalsLevel") || "1", 10);
    return Number.isFinite(savedLevel) && savedLevel > 0 ? savedLevel : 1;
  } catch (error) {
    console.warn("Could not read saved puzzle progress.", error);
    return 1;
  }
}

function saveLevel() {
  try {
    localStorage.setItem("puzzlePalsLevel", String(level));
  } catch (error) {
    console.warn("Could not save puzzle progress.", error);
  }
}

function loadCollection() {
  try {
    const savedCollection = JSON.parse(localStorage.getItem("puzzlePalsZoo") || "[]");
    if (!Array.isArray(savedCollection)) return new Set();
    const animalNames = new Set(animals.map((animal) => animal.name));
    return new Set(savedCollection.filter((name) => animalNames.has(name)));
  } catch (error) {
    console.warn("Could not read the saved zoo collection.", error);
    return new Set();
  }
}

function saveCollection() {
  try {
    localStorage.setItem("puzzlePalsZoo", JSON.stringify([...collectedAnimals]));
  } catch (error) {
    console.warn("Could not save the zoo collection.", error);
  }
}

function renderZoo() {
  const zooGrid = document.querySelector("#zoo-grid");
  zooGrid.replaceChildren();
  animals.forEach((animal) => {
    const isCollected = collectedAnimals.has(animal.name);
    const habitat = document.createElement("article");
    habitat.className = `zoo-habitat${isCollected ? " is-home" : " is-mystery"}`;

    const scene = document.createElement("div");
    scene.className = "habitat-scene";
    const image = document.createElement("img");
    image.className = "habitat-animal";
    image.src = animal.image;
    image.alt = isCollected ? animal.name : "";
    image.setAttribute("aria-hidden", String(!isCollected));
    scene.append(image);

    if (!isCollected) {
      const lock = document.createElement("span");
      lock.className = "habitat-lock";
      lock.textContent = "🔒";
      lock.setAttribute("aria-hidden", "true");
      scene.append(lock);
    }

    const details = document.createElement("div");
    details.className = "habitat-details";
    const name = document.createElement("h3");
    name.textContent = isCollected ? animal.name : "Mystery friend";
    const status = document.createElement("p");
    status.textContent = isCollected ? "Welcome to the zoo!" : "Solve a puzzle to meet me";
    details.append(name, status);
    habitat.append(scene, details);
    habitat.setAttribute("aria-label", isCollected ? `${animal.name}, welcomed to your zoo` : "Mystery animal, solve a puzzle to unlock");
    zooGrid.append(habitat);
  });

  document.querySelector("#zoo-count").textContent = String(collectedAnimals.size);
  document.querySelector("#zoo-link-count").textContent = String(collectedAnimals.size);
}

function welcomeAnimalToZoo(animalName) {
  const isNewFriend = !collectedAnimals.has(animalName);
  if (isNewFriend) {
    collectedAnimals.add(animalName);
    saveCollection();
    renderZoo();
  }
  return isNewFriend;
}

function gridSizeForLevel(currentLevel) {
  if (currentLevel === 1) return 2;
  if (currentLevel <= 3) return 3;
  if (currentLevel <= 5) return 4;
  return Math.min(5 + Math.floor((currentLevel - 6) / 4), 7);
}

function currentAnimal() {
  return animals[(level - 1) % animals.length];
}

function shuffledPieces(count) {
  const result = Array.from({ length: count }, (_, index) => index);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  if (result.every((piece, index) => piece === index)) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

function renderLevelDots() {
  levelDots.replaceChildren();
  const firstLevel = Math.floor((level - 1) / 6) * 6 + 1;
  for (let step = 0; step < 6; step += 1) {
    const dotLevel = firstLevel + step;
    const dot = document.createElement("span");
    dot.className = "level-dot";
    dot.textContent = String(dotLevel);
    dot.setAttribute("aria-label", `Level ${dotLevel}${dotLevel < level ? ", completed" : dotLevel === level ? ", current level" : ""}`);
    if (dotLevel < level) dot.classList.add("is-done");
    if (dotLevel === level) dot.classList.add("is-current");
    levelDots.append(dot);
  }
}

function updateProgress() {
  document.querySelector("#level-number").textContent = String(level);
  document.querySelector("#progress-level").textContent = String(level);
  const percent = Math.round(((level - 1) % 6) / 5 * 100);
  document.querySelector("#progress-percent").textContent = `${percent}% to next badge`;
  document.querySelector("#progress-fill").style.width = `${percent}%`;
  document.querySelector("#progress-track").setAttribute("aria-valuenow", String(percent));
  renderLevelDots();
}

function renderBoard() {
  const animal = currentAnimal();
  const size = gridSizeForLevel(level);
  pieces = shuffledPieces(size * size);
  selectedPosition = null;
  moves = 0;
  completed = false;

  document.querySelector("#animal-title").textContent = animal.title;
  document.querySelector("#move-count").textContent = "0";
  document.querySelector("#game-hint").textContent = `Tap two pieces to swap them into place. ${size} × ${size} puzzle`;
  board.setAttribute("aria-label", `Shuffled ${animal.name} puzzle, ${size} by ${size} pieces`);
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  board.replaceChildren();

  pieces.forEach((piece, position) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "puzzle-piece";
    tile.dataset.position = String(position);
    tile.draggable = true;
    tile.setAttribute("aria-label", pieceLabel(piece, size, animal.name));
    tile.style.backgroundImage = `url("${animal.image}")`;
    tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
    const row = Math.floor(piece / size);
    const column = piece % size;
    const offsetX = size === 1 ? 0 : column / (size - 1) * 100;
    const offsetY = size === 1 ? 0 : row / (size - 1) * 100;
    tile.style.backgroundPosition = `${offsetX}% ${offsetY}%`;
    tile.addEventListener("click", () => selectPiece(position));
    tile.addEventListener("dragstart", handleDragStart);
    tile.addEventListener("dragover", (event) => event.preventDefault());
    tile.addEventListener("drop", handleDrop);
    board.append(tile);
  });
  updateProgress();
}

function pieceLabel(piece, size, animalName) {
  const row = Math.floor(piece / size) + 1;
  const column = piece % size + 1;
  return `Puzzle piece from row ${row}, column ${column} of the ${animalName} picture`;
}

function selectPiece(position) {
  if (completed) return;
  if (selectedPosition === null) {
    selectedPosition = position;
    board.children[position].classList.add("is-selected");
    liveMessage.textContent = `Piece ${position + 1} selected. Now choose a piece to swap with it.`;
    playTone(440, 0.07);
    return;
  }
  if (selectedPosition === position) {
    board.children[position].classList.remove("is-selected");
    selectedPosition = null;
    return;
  }
  swapPieces(selectedPosition, position);
}

function handleDragStart(event) {
  const position = Number(event.currentTarget.dataset.position);
  selectedPosition = position;
  event.dataTransfer?.setData("text/plain", String(position));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function handleDrop(event) {
  event.preventDefault();
  const targetPosition = Number(event.currentTarget.dataset.position);
  const sourcePosition = Number(event.dataTransfer?.getData("text/plain") || selectedPosition);
  if (Number.isInteger(sourcePosition) && sourcePosition >= 0 && sourcePosition < pieces.length && sourcePosition !== targetPosition) {
    swapPieces(sourcePosition, targetPosition);
  }
}

function swapPieces(firstPosition, secondPosition) {
  [pieces[firstPosition], pieces[secondPosition]] = [pieces[secondPosition], pieces[firstPosition]];
  moves += 1;
  selectedPosition = null;
  document.querySelector("#move-count").textContent = String(moves);
  playTone(540, 0.08);
  refreshPieceElements();
  if (pieces.every((piece, position) => piece === position)) finishPuzzle();
}

function refreshPieceElements() {
  const size = gridSizeForLevel(level);
  const animal = currentAnimal();
  [...board.children].forEach((tile, position) => {
    const piece = pieces[position];
    const row = Math.floor(piece / size);
    const column = piece % size;
    tile.style.backgroundPosition = `${column / (size - 1) * 100}% ${row / (size - 1) * 100}%`;
    tile.setAttribute("aria-label", pieceLabel(piece, size, animal.name));
    tile.classList.toggle("is-selected", position === selectedPosition);
    tile.classList.toggle("is-correct", piece === position);
  });
  board.setAttribute("aria-label", `Animal puzzle, ${pieces.filter((piece, position) => piece === position).length} of ${pieces.length} pieces in place`);
}

function finishPuzzle() {
  completed = true;
  const animal = currentAnimal();
  const isNewFriend = welcomeAnimalToZoo(animal.name);
  const celebrationImage = document.querySelector("#celebration-animal");
  celebrationImage.style.backgroundImage = `url("${animal.image}")`;
  celebrationImage.setAttribute("aria-label", animal.name);
  const zooMessage = isNewFriend ? ` ${animal.name} is now home in your zoo!` : ` ${animal.name} is happy to visit your zoo again!`;
  document.querySelector("#celebration-message").textContent = `${animal.cheer} You put all the pieces together in ${moves} ${moves === 1 ? "swap" : "swaps"}.${zooMessage}`;
  document.querySelector("#play-again-button").textContent = "Play again 🔁";
  celebration.hidden = false;
  document.querySelector("#play-again-button").focus();
  liveMessage.textContent = `${animal.cheer} Puzzle complete in ${moves} swaps.`;
  playCelebrationSound();
  if (soundOn && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Hooray! You solved the ${animal.name} puzzle!`));
  }
}

function playTone(frequency, duration) {
  if (!soundOn) return;
  try {
    audioContext ||= new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.07, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Puzzle sound could not be played.", error);
  }
}

function playCelebrationSound() {
  [523, 659, 784, 1047].forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, 0.19), index * 115);
  });
}

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  document.querySelector("#sound-icon").textContent = soundOn ? "🔊" : "🔇";
  document.querySelector("#sound-label").textContent = soundOn ? "Sound on" : "Sound off";
  if (!soundOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  if (soundOn) playTone(659, 0.1);
});

document.querySelector("#shuffle-button").addEventListener("click", () => {
  if (completed) return;
  renderBoard();
  liveMessage.textContent = "The puzzle pieces have been mixed up.";
});

document.querySelector("#play-again-button").addEventListener("click", () => {
  celebration.hidden = true;
  renderBoard();
  document.querySelector("#puzzle-board").querySelector("button")?.focus();
});

document.querySelector("#next-button").addEventListener("click", () => {
  celebration.hidden = true;
  level += 1;
  saveLevel();
  renderBoard();
  document.querySelector("#puzzle-board").querySelector("button")?.focus();
});

celebration.addEventListener("click", (event) => {
  if (event.target === celebration) {
    celebration.hidden = true;
    renderBoard();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !celebration.hidden) {
    celebration.hidden = true;
    renderBoard();
  }
});

renderBoard();
renderZoo();
