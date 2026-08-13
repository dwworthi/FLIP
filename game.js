const suits = [
  "♠",
  "♥",
  "♦",
  "♣"
];

const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
];

let deck = [];

let faceUpCards = [];

let selectedIndexes = [];

let discardedCount = 0;

let showAllCards = false;

let isAnimating = false;

/* ===================================== */
/* DRAG STATE                            */
/* ===================================== */

let isDragging = false;

let dragSelectionMode = true;

let dragVisited = new Set();

let lastDragIndex = null;

/* ===================================== */
/* AUDIO                                 */
/* ===================================== */

let audioContext = null;

function getAudioContext() {

  if (!audioContext) {

    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

  }

  return audioContext;
}

function playTone(
  frequency,
  duration,
  volume
) {

  try {

    const ctx =
      getAudioContext();

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.type =
      "triangle";

    oscillator.frequency.value =
      frequency;

    gain.gain.setValueAtTime(
      volume,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);

    gain.connect(
      ctx.destination
    );

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + duration
    );

  }

  catch (error) {

    // Sound is optional.

  }

}

function selectionSound() {

  playTone(
    480,
    .055,
    .035
  );

}

function dealSound() {

  playTone(
    270,
    .07,
    .025
  );

}

function discardSound() {

  playTone(
    170,
    .14,
    .055
  );

}

function winSound() {

  setTimeout(
    () => playTone(
      523,
      .18,
      .05
    ),
    0
  );

  setTimeout(
    () => playTone(
      659,
      .18,
      .05
    ),
    150
  );

  setTimeout(
    () => playTone(
      784,
      .35,
      .06
    ),
    300
  );

}

/* ===================================== */
/* SHUFFLE                               */
/* ===================================== */

function shuffle(array) {

  for (
    let i =
      array.length - 1;

    i > 0;

    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];

  }

}

/* ===================================== */
/* DECK VALIDATION                       */
/* ===================================== */

function validateDeck() {

  if (
    deck.length !== 52
  ) {

    console.error(
      "Deck validation failed: wrong card count.",
      deck.length
    );

    return false;
  }

  const cardNames =
    deck.map(
      card =>
        card.rank +
        card.suit
    );

  const uniqueCards =
    new Set(
      cardNames
    );

  if (
    uniqueCards.size !== 52
  ) {

    console.error(
      "Deck validation failed: duplicate card detected."
    );

    return false;
  }

  console.log(
    "FLIP deck verified: 52 unique cards."
  );

  return true;
}

/* ===================================== */
/* NEW GAME                              */
/* ===================================== */

function newGame() {

  deck = [];

  faceUpCards = [];

  selectedIndexes = [];

  discardedCount = 0;

  showAllCards = false;

  isAnimating = false;

  isDragging = false;

  lastDragIndex = null;

  dragVisited.clear();

  for (
    let suit of suits
  ) {

    for (
      let rank of ranks
    ) {

      deck.push({

        suit: suit,

        rank: rank

      });

    }

  }

  if (
    !validateDeck()
  ) {

    showMessage(
      "Deck error. Please start a new game."
    );

    return;
  }

  shuffle(deck);

  document
    .getElementById(
      "winOverlay"
    )
    .style.display =
    "none";

  document
    .getElementById(
      "discardVisual"
    )
    .style.display =
    "none";

  document
    .getElementById(
      "message"
    )
    .textContent =
    "";

  updateStats();

  updateDeck();

  renderCards();

  shuffleDeckAnimation();

}

/* ===================================== */
/* SHUFFLE VISUAL                        */
/* ===================================== */

function shuffleDeckAnimation() {

  const deckElement =
    document.getElementById(
      "deck"
    );

  deckElement.animate(

    [

      {
        transform:
          "translateX(0) rotate(0deg)"
      },

      {
        transform:
          "translateX(-8px) rotate(-4deg)"
      },

      {
        transform:
          "translateX(8px) rotate(4deg)"
      },

      {
        transform:
          "translateX(-6px) rotate(-3deg)"
      },

      {
        transform:
          "translateX(6px) rotate(3deg)"
      },

      {
        transform:
          "translateX(0) rotate(0deg)"
      }

    ],

    {

      duration: 450,

      iterations: 1

    }

  );

}

/* ===================================== */
/* DEAL                                  */
/* ===================================== */

function flipCard() {

  if (
    isAnimating ||
    deck.length === 0
  ) {

    if (
      deck.length === 0
    ) {

      showMessage(
        "The deck is empty."
      );

    }

    return;
  }

  isAnimating = true;

  selectedIndexes = [];

  showAllCards = false;

  const card =
    deck.pop();

  const table =
    document.getElementById(
      "tableFelt"
    );

  const deckArea =
    document.getElementById(
      "deckArea"
    );

  const tableRect =
    table.getBoundingClientRect();

  const deckRect =
    deckArea.getBoundingClientRect();

  const flyingCard =
    document.createElement(
      "div"
    );

  flyingCard.className =
    "dealCard";

  flyingCard.style.left =
    (
      deckRect.left -
      tableRect.left +
      15
    )
    + "px";

  flyingCard.style.top =
    (
      deckRect.top -
      tableRect.top
    )
    + "px";

  table.appendChild(
    flyingCard
  );

  dealSound();

  requestAnimationFrame(

    function() {

      flyingCard.style.left =
        "50%";

      flyingCard.style.top =
        "95px";

      flyingCard.style.transform =
        "translateX(-50%) rotateY(180deg) scale(.92)";

    }

  );

  setTimeout(

    function() {

      faceUpCards.push(
        card
      );

      flyingCard.remove();

      updateStats();

      updateDeck();

      renderCards();

      isAnimating = false;

      if (
        deck.length === 0
      ) {

        showMessage(
          "The deck is empty. Make any final discards you see."
        );

      }

    },

    330

  );

}

/* ===================================== */
/* TAP SELECTION                         */
/* ===================================== */

function toggleCardSelection(
  index,
  playSound = true
) {

  const position =
    selectedIndexes.indexOf(
      index
    );

  if (
    position === -1
  ) {

    selectedIndexes.push(
      index
    );

  }

  else {

    selectedIndexes.splice(
      position,
      1
    );

  }

  selectedIndexes.sort(
    (a,b) =>
      a - b
  );

  if (
    playSound
  ) {

    selectionSound();

  }

  renderCards();
}

/* ===================================== */
/* DRAG SELECTION                        */
/* ===================================== */

function startDrag(
  event,
  index
) {

  if (
    isAnimating
  ) {

    return;
  }

  event.preventDefault();

  isDragging = true;

  dragVisited.clear();

  lastDragIndex = index;

  dragSelectionMode =
    !selectedIndexes.includes(
      index
    );

  if (
    dragSelectionMode
  ) {

    if (
      !selectedIndexes.includes(
        index
      )
    ) {

      selectedIndexes.push(
        index
      );

      selectionSound();

    }

  }

  else {

    selectedIndexes =
      selectedIndexes.filter(
        item =>
          item !== index
      );

    selectionSound();

  }

  dragVisited.add(
    index
  );

  selectedIndexes.sort(
    (a,b) =>
      a - b
  );

  renderCards();
}

function continueDrag(
  event
) {

  if (
    !isDragging
  ) {

    return;
  }

  event.preventDefault();

  const element =
    document.elementFromPoint(
      event.clientX,
      event.clientY
    );

  if (
    !element
  ) {

    return;
  }

  const card =
    element.closest(
      ".playingCard"
    );

  if (
    !card
  ) {

    return;
  }

  const currentIndex =
    Number(
      card.dataset.index
    );

  if (
    currentIndex ===
    lastDragIndex
  ) {

    return;
  }

  const low =
    Math.min(
      lastDragIndex,
      currentIndex
    );

  const high =
    Math.max(
      lastDragIndex,
      currentIndex
    );

  for (
    let index = low;
    index <= high;
    index++
  ) {

    if (
      dragSelectionMode &&
      !selectedIndexes.includes(
        index
      )
    ) {

      selectedIndexes.push(
        index
      );

      selectionSound();

    }

    if (
      !dragSelectionMode &&
      selectedIndexes.includes(
        index
      )
    ) {

      selectedIndexes =
        selectedIndexes.filter(
          item =>
            item !== index
        );

      selectionSound();

    }

    dragVisited.add(
      index
    );

  }

  lastDragIndex =
    currentIndex;

  selectedIndexes.sort(
    (a,b) =>
      a - b
  );

  renderCards();
}

function endDrag() {

  if (
    !isDragging
  ) {

    return;
  }

  isDragging = false;

  dragVisited.clear();

  lastDragIndex = null;
}

/* ===================================== */
/* DISCARD                               */
/* ===================================== */

function discardSelected() {

  if (
    isAnimating
  ) {

    return;
  }

  if (
    selectedIndexes.length === 0
  ) {

    showMessage(
      "Select the cards you want to discard."
    );

    return;
  }

  if (
    selectedIndexes.length === 2
  ) {

    const first =
      selectedIndexes[0];

    const second =
      selectedIndexes[1];

    if (
      second !==
      first + 1
    ) {

      invalidMove();

      return;
    }

    const left =
      first - 1;

    const right =
      second + 1;

    if (
      left < 0 ||
      right >=
      faceUpCards.length
    ) {

      invalidMove();

      return;
    }

    if (
      faceUpCards[left].suit ===
      faceUpCards[right].suit
    ) {

      animateDiscard(

        [...selectedIndexes],

        "Same suit — middle two discarded!"

      );

      return;
    }

  }

  if (
    selectedIndexes.length === 4
  ) {

    const [
      a,
      b,
      c,
      d
    ] =
      selectedIndexes;

    const consecutive =

      b === a + 1 &&
      c === a + 2 &&
      d === a + 3;

    if (
      !consecutive
    ) {

      invalidMove();

      return;
    }

    if (
      faceUpCards[a].rank ===
      faceUpCards[d].rank
    ) {

      animateDiscard(

        [...selectedIndexes],

        "Same rank — all four discarded!"

      );

      return;
    }

  }

  invalidMove();
}

function invalidMove() {

  showMessage(
    "That isn't a valid discard."
  );

  const button =
    document.getElementById(
      "discardButton"
    );

  button.animate(

    [

      {
        transform:
          "translateX(0)"
      },

      {
        transform:
          "translateX(-5px)"
      },

      {
        transform:
          "translateX(5px)"
      },

      {
        transform:
          "translateX(0)"
      }

    ],

    {

      duration: 180

    }

  );

}

/* ===================================== */
/* DISCARD ANIMATION                     */
/* ===================================== */

function animateDiscard(
  indexes,
  message
) {

  isAnimating =
    true;

  discardSound();

  const cards =
    document.querySelectorAll(
      ".playingCard"
    );

  cards.forEach(

    card => {

      const index =
        Number(
          card.dataset.index
        );

      if (
        indexes.includes(
          index
        )
      ) {

        card.classList.add(
          "discarding"
        );

      }

    }

  );

  setTimeout(

    function() {

      const descending =
        [...indexes].sort(
          (a,b) =>
            b - a
        );

      for (
        let index of descending
      ) {

        faceUpCards.splice(
          index,
          1
        );

      }

      discardedCount +=
        indexes.length;

      selectedIndexes = [];

      showAllCards = false;

      document
        .getElementById(
          "discardVisual"
        )
        .style.display =
        "block";

      showMessage(
        message
      );

      updateStats();

      renderCards();

      isAnimating =
        false;

      checkForWin();

    },

    280

  );

}

/* ===================================== */
/* WIN                                   */
/* ===================================== */

function checkForWin() {

  if (
    deck.length === 0 &&
    faceUpCards.length === 0 &&
    discardedCount === 52
  ) {

    winGame();

  }

}

function winGame() {

  winSound();

  document
    .getElementById(
      "winOverlay"
    )
    .style.display =
    "flex";

  createConfetti();
}

function createConfetti() {

  const table =
    document.getElementById(
      "tableFelt"
    );

  const colors = [

    "#f0c63c",
    "#ffffff",
    "#d33a3a",
    "#3aa9d3",
    "#65d37d"

  ];

  for (
    let i = 0;
    i < 65;
    i++
  ) {

    const piece =
      document.createElement(
        "div"
      );

    piece.className =
      "confetti";

    piece.style.left =
      (
        Math.random() *
        100
      )
      + "%";

    piece.style.background =
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ];

    piece.style.animationDuration =
      (
        1.8 +
        Math.random() *
        1.8
      )
      + "s";

    piece.style.animationDelay =
      (
        Math.random() *
        .5
      )
      + "s";

    table.appendChild(
      piece
    );

    setTimeout(

      () =>
        piece.remove(),

      4000

    );

  }

}

/* ===================================== */
/* STATS                                 */
/* ===================================== */

function updateStats() {

  document
    .getElementById(
      "remaining"
    )
    .textContent =
    deck.length;

  document
    .getElementById(
      "discarded"
    )
    .textContent =
    discardedCount;

  document
    .getElementById(
      "inHand"
    )
    .textContent =
    faceUpCards.length;
}

function showMessage(
  text
) {

  document
    .getElementById(
      "message"
    )
    .textContent =
    text;
}

/* ===================================== */
/* DECK DISPLAY                          */
/* ===================================== */

function updateDeck() {

  const deckArea =
    document.getElementById(
      "deckArea"
    );

  document
    .getElementById(
      "deckCount"
    )
    .textContent =

    deck.length +

    (
      deck.length === 1
      ? " card"
      : " cards"
    );

  if (
    deck.length === 0
  ) {

    deckArea.classList.add(
      "empty"
    );

  }

  else {

    deckArea.classList.remove(
      "empty"
    );

  }

}

/* ===================================== */
/* CARD CREATION                         */
/* ===================================== */

function createCorner(
  card,
  bottom
) {

  const corner =
    document.createElement(
      "div"
    );

  corner.className =
    bottom
    ? "bottomCorner"
    : "cardCorner";

  const rank =
    document.createElement(
      "div"
    );

  rank.className =
    "cardRank";

  rank.textContent =
    card.rank;

  const suit =
    document.createElement(
      "div"
    );

  suit.className =
    "cardSuit";

  suit.textContent =
    card.suit;

  corner.appendChild(
    rank
  );

  corner.appendChild(
    suit
  );

  return corner;
}

/* ===================================== */
/* LAYOUT                                */
/* ===================================== */

function getLayoutInfo() {

  const area =
    document.getElementById(
      "playArea"
    );

  const width =
    area.clientWidth;

  const phone =
    window.innerWidth <=
    600;

  const cardWidth =
    phone
    ? 66
    : 74;

  const minimumSpacing =
    phone
    ? 26
    : 29;

  /*
    Always start burying cards after
    11 cards are visible.
  */

  const maxVisible = 11;

  return {

    width,
    cardWidth,
    minimumSpacing,
    maxVisible

  };
}

/* ===================================== */
/* RENDER HAND                           */
/* ===================================== */

function renderCards() {

  const playArea =
    document.getElementById(
      "playArea"
    );

  const buried =
    document.getElementById(
      "buriedStack"
    );

  const buriedCount =
    document.getElementById(
      "buriedCount"
    );

  playArea.innerHTML =
    "";

  const count =
    faceUpCards.length;

  if (
    count === 0
  ) {

    buried.style.display =
      "none";

    return;
  }

  const layout =
    getLayoutInfo();

  let startIndex = 0;

  let hiddenCount = 0;

  if (
    !showAllCards &&
    count >
    layout.maxVisible
  ) {

    hiddenCount =

      count -
      layout.maxVisible;

    startIndex =
      hiddenCount;

  }

  const visible =
    faceUpCards.slice(
      startIndex
    );

  let spacing;

  if (
    showAllCards
  ) {

    spacing =

      Math.max(

        8,

        (
          layout.width -
          layout.cardWidth -
          16
        )

        /

        Math.max(
          count - 1,
          1
        )

      );

  }

  else {

    spacing =

      Math.min(

        45,

        Math.max(

          layout.minimumSpacing,

          (
            layout.width -
            layout.cardWidth -
            20
          )

          /

          Math.max(
            visible.length - 1,
            1
          )

        )

      );

  }

  const leftMargin =

    hiddenCount > 0 &&
    !showAllCards

    ? 92

    : 7;

  const usableWidth =

    layout.width -
    leftMargin -
    7;

  const totalWidth =

    layout.cardWidth +

    spacing *

    Math.max(
      visible.length - 1,
      0
    );

  const startX =

    leftMargin +

    Math.max(

      0,

      (
        usableWidth -
        totalWidth
      )

      / 2

    );

  visible.forEach(

    function(
      card,
      visibleIndex
    ) {

      const actualIndex =

        startIndex +
        visibleIndex;

      const cardDiv =
        document.createElement(
          "div"
        );

      cardDiv.className =
        "playingCard";

      cardDiv.dataset.index =
        actualIndex;

      if (
        card.suit === "♥" ||
        card.suit === "♦"
      ) {

        cardDiv.classList.add(
          "red"
        );

      }

      if (
        selectedIndexes.includes(
          actualIndex
        )
      ) {

        cardDiv.classList.add(
          "selected"
        );

      }

      cardDiv.style.left =

        (
          startX +
          visibleIndex *
          spacing
        )

        + "px";

      const middle =

        (
          visible.length -
          1
        )

        / 2;

      const distance =

        Math.abs(
          visibleIndex -
          middle
        )

        /

        Math.max(
          middle,
          1
        );

      const curve =

        distance *
        17;

      cardDiv.style.top =

        (
          56 +
          curve
        )

        + "px";

      const rotation =

        visible.length === 1

        ? 0

        :

        (
          (
            visibleIndex -
            middle
          )

          /

          Math.max(
            middle,
            1
          )
        )

        * 6;

      cardDiv.style.setProperty(

        "--rotation",

        rotation +
        "deg"

      );

      cardDiv.style.zIndex =

        100 +
        visibleIndex;

      cardDiv.appendChild(

        createCorner(
          card,
          false
        )

      );

      const center =
        document.createElement(
          "div"
        );

      center.className =
        "centerSuit";

      center.textContent =
        card.suit;

      cardDiv.appendChild(
        center
      );

      cardDiv.appendChild(

        createCorner(
          card,
          true
        )

      );

      cardDiv.addEventListener(

        "pointerdown",

        function(event) {

          startDrag(
            event,
            actualIndex
          );

        }

      );

      playArea.appendChild(
        cardDiv
      );

    }

  );

  if (
    hiddenCount > 0 &&
    !showAllCards
  ) {

    buriedCount.textContent =
      "+" +
      hiddenCount;

    buried.style.display =
      "block";

  }

  else {

    buried.style.display =
      "none";

  }

}

/* ===================================== */
/* SPREAD                                */
/* ===================================== */

function toggleSpread(
  event
) {

  if (
    event
  ) {

    event.stopPropagation();

  }

  if (
    faceUpCards.length <=
    getLayoutInfo().maxVisible
  ) {

    return;
  }

  showAllCards =
    !showAllCards;

  selectedIndexes = [];

  if (
    showAllCards
  ) {

    showMessage(
      "Hand spread out."
    );

  }

  else {

    showMessage(
      ""
    );

  }

  renderCards();
}

/* ===================================== */
/* GLOBAL POINTER EVENTS                 */
/* ===================================== */

document.addEventListener(

  "pointermove",

  continueDrag,

  {
    passive: false
  }

);

document.addEventListener(

  "pointerup",

  function() {

    endDrag();

  }

);

/* ===================================== */
/* FELT = DESELECT ALL                   */
/* ===================================== */

document
  .getElementById(
    "tableFelt"
  )
  .addEventListener(

    "pointerdown",

    function(event) {

      if (
        event.target.closest(
          ".playingCard, #deckArea, #discardButton, #newGameButton, #buriedStack, #discardArea, #winOverlay"
        )
      ) {

        return;

      }

      if (
        selectedIndexes.length >
        0
      ) {

        selectedIndexes = [];

        renderCards();

        showMessage("");

      }

    }

  );

/* ===================================== */
/* BUTTON EVENTS                         */
/* ===================================== */

document
  .getElementById(
    "deckArea"
  )
  .addEventListener(
    "click",
    flipCard
  );

document
  .getElementById(
    "discardButton"
  )
  .addEventListener(
    "click",
    discardSelected
  );

document
  .getElementById(
    "newGameButton"
  )
  .addEventListener(
    "click",
    newGame
  );

document
  .getElementById(
    "playAgainButton"
  )
  .addEventListener(
    "click",
    newGame
  );

document
  .getElementById(
    "buriedStack"
  )
  .addEventListener(
    "click",
    toggleSpread
  );

window.addEventListener(
  "resize",
  renderCards
);

/* ===================================== */
/* START                                 */
/* ===================================== */

newGame();
