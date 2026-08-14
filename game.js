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
let discardedCards = [];
let selectedIndexes = [];
let discardedCount = 0;

let showAllCards = false;
let isAnimating = false;

let gamesPlayed =
  Number(
    localStorage.getItem(
      "flipGamesPlayed"
    )
  ) || 0;

let winsPlayed =
  Number(
    localStorage.getItem(
      "flipWins"
    )
  ) || 0;

let currentGameCounted = false;
let currentGameWon = false;

/* ===================================== */
/* DRAG STATE                            */
/* ===================================== */

let isDragging = false;
let dragSelectionMode = true;
let dragVisited = new Set();
let lastDragIndex = null;

/* ===================================== */
/* SHUFFLE                               */
/* ===================================== */

function shuffle(array) {

  for (
    let i = array.length - 1;
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
  discardedCards = [];
  selectedIndexes = [];
  discardedCount = 0;

  showAllCards = false;
  isAnimating = false;

  isDragging = false;
  lastDragIndex = null;

  currentGameCounted = false;
  currentGameWon = false;

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

  showMessage("");

  updateStats();
  updateDeck();
  renderCards();
  renderDiscardPile();

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

  if (
    !currentGameCounted
  ) {

    gamesPlayed++;

    currentGameCounted = true;

    localStorage.setItem(
      "flipGamesPlayed",
      gamesPlayed
    );

    updateStats();

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

  requestAnimationFrame(
    function() {

      flyingCard.style.left =
        "50%";

      flyingCard.style.top =
        "110px";

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

  applyDragSelection(
    index
  );

  dragVisited.add(
    index
  );

  selectedIndexes.sort(
    (a,b) =>
      a - b
  );

  renderCards();

}

function applyDragSelection(
  index
) {

  const isSelected =
    selectedIndexes.includes(
      index
    );

  if (
    dragSelectionMode &&
    !isSelected
  ) {

    selectedIndexes.push(
      index
    );

  }

  if (
    !dragSelectionMode &&
    isSelected
  ) {

    selectedIndexes =
      selectedIndexes.filter(
        item =>
          item !== index
      );

  }

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

    applyDragSelection(
      index
    );

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
/* DISCARD RULES                         */
/* ===================================== */

function isOrderedRun(
  cards
) {

  const rankValues = {
    "A": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13
  };

  const lowAceValues =
    cards.map(
      card =>
        rankValues[card.rank]
    );

  const highAceValues =
    cards.map(
      card =>
        card.rank === "A"
        ? 14
        : rankValues[card.rank]
    );

  function movesOneStep(
    values
  ) {

    const step =
      values[1] -
      values[0];

    if (
      step !== 1 &&
      step !== -1
    ) {

      return false;

    }

    return values.every(
      function(
        value,
        index
      ) {

        return (
          index === 0 ||
          value -
          values[index - 1] ===
          step
        );

      }
    );

  }

  return (
    movesOneStep(
      lowAceValues
    ) ||
    movesOneStep(
      highAceValues
    )
  );

}

function isRoyalRun(
  cards
) {

  const ranksInOrder =
    cards
      .map(card => card.rank)
      .join(",");

  return (
    ranksInOrder === "J,Q,K,A" ||
    ranksInOrder === "A,K,Q,J"
  );

}

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

    const selectedCards =
      selectedIndexes.map(
        index =>
          faceUpCards[index]
      );

    const allSameSuit =
      selectedCards.every(
        card =>
          card.suit ===
          selectedCards[0].suit
      );

    const orderedRun =
      isOrderedRun(
        selectedCards
      );

    if (
      allSameSuit &&
      isRoyalRun(
        selectedCards
      )
    ) {

      animateDiscard(
        [...selectedIndexes],
        "ROYAL VICTORY!",
        winGame
      );

      return;
    }

    if (
      allSameSuit &&
      orderedRun
    ) {

      const allFaceUpIndexes =
        faceUpCards.map(
          (card, index) =>
            index
        );

      animateDiscard(
        allFaceUpIndexes,
        "MEGA RUN — every card in play discarded!"
      );

      return;
    }

    if (
      allSameSuit
    ) {

      animateDiscard(
        [...selectedIndexes],
        "Four of one suit — all four discarded!"
      );

      return;
    }

    if (
      orderedRun
    ) {

      animateDiscard(
        [...selectedIndexes],
        "Four-card run — all four discarded!"
      );

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
          "translateX(-50%) translateX(0)"
      },
      {
        transform:
          "translateX(-50%) translateX(-5px)"
      },
      {
        transform:
          "translateX(-50%) translateX(5px)"
      },
      {
        transform:
          "translateX(-50%) translateX(0)"
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
  message,
  afterDiscard
) {

  isAnimating = true;

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

      const cardsBeingDiscarded =
        indexes.map(
          index =>
            faceUpCards[index]
        );

      discardedCards.push(
        ...cardsBeingDiscarded
      );

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

      showMessage(
        message
      );

      updateStats();

      renderCards();

      renderDiscardPile();

      isAnimating = false;

      if (
        afterDiscard
      ) {

        afterDiscard();

        return;

      }

      checkForWin();

    },
    280
  );

}

/* ===================================== */
/* DISCARD PILE                          */
/* ===================================== */

function renderDiscardPile() {

  const pile =
    document.getElementById(
      "discardPile"
    );

  pile.innerHTML =
    "";

  if (
    discardedCards.length === 0
  ) {

    const placeholder =
      document.createElement(
        "div"
      );

    placeholder.className =
      "discardPlaceholder";

    pile.appendChild(
      placeholder
    );

    return;

  }

  const visibleCards =
    discardedCards.slice(-6);

  const rotations =
    [-12, 8, -5, 13, -8, 5];

  const offsets =
    [
      [-5, 3],
      [4, 0],
      [-2, -2],
      [5, 4],
      [-4, 1],
      [1, -3]
    ];

  visibleCards.forEach(
    function(
      card,
      index
    ) {

      const discardCard =
        document.createElement(
          "div"
        );

      discardCard.style.position =
        "absolute";

      discardCard.style.left =
        "5px";

      discardCard.style.top =
        "3px";

      discardCard.style.width =
        "58px";

      discardCard.style.height =
        "84px";

      discardCard.style.border =
        "1px solid #999";

      discardCard.style.borderRadius =
        "7px";

      discardCard.style.background =
        "linear-gradient(135deg,#fff,#ededed)";

      discardCard.style.boxShadow =
        "0 3px 6px rgba(0,0,0,.4)";

      discardCard.style.overflow =
        "hidden";

      discardCard.style.fontFamily =
        'Georgia, "Times New Roman", serif';

      discardCard.style.color =
        (
          card.suit === "♥" ||
          card.suit === "♦"
        )
        ? "#c51f2c"
        : "#111";

      discardCard.style.transform =
        "translate(" +
        offsets[index][0] +
        "px," +
        offsets[index][1] +
        "px) rotate(" +
        rotations[index] +
        "deg)";

      discardCard.style.zIndex =
        String(index + 1);

      const rank =
        document.createElement(
          "div"
        );

      rank.textContent =
        card.rank;

      rank.style.position =
        "absolute";

      rank.style.top =
        "3px";

      rank.style.left =
        "5px";

      rank.style.fontSize =
        "15px";

      rank.style.fontWeight =
        "bold";

      const suit =
        document.createElement(
          "div"
        );

      suit.textContent =
        card.suit;

      suit.style.position =
        "absolute";

      suit.style.top =
        "19px";

      suit.style.left =
        "6px";

      suit.style.fontSize =
        "13px";

      const center =
        document.createElement(
          "div"
        );

      center.textContent =
        card.suit;

      center.style.position =
        "absolute";

      center.style.left =
        "50%";

      center.style.top =
        "54%";

      center.style.transform =
        "translate(-50%,-50%)";

      center.style.fontSize =
        "25px";

      discardCard.appendChild(
        rank
      );

      discardCard.appendChild(
        suit
      );

      discardCard.appendChild(
        center
      );

      pile.appendChild(
        discardCard
      );

    }
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

  if (
    !currentGameWon
  ) {

    currentGameWon = true;

    winsPlayed++;

    localStorage.setItem(
      "flipWins",
      winsPlayed
    );

    updateStats();

  }

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

  const gamesElement =
    document.getElementById(
      "gamesPlayed"
    );

  if (
    gamesElement
  ) {

    gamesElement.textContent =
      gamesPlayed;

  }

  const winsElement =
    document.getElementById(
      "winsPlayed"
    );

  if (
    winsElement
  ) {

    winsElement.textContent =
      winsPlayed;

  }

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
    ? 76
    : 74;

  const minimumSpacing =
    phone
    ? 25
    : 29;

  const maxVisible =
    phone
    ? 7
    : 11;

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
        phoneSpacingLimit(),
        Math.max(
          layout.minimumSpacing,
          (
            layout.width -
            layout.cardWidth -
            24
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
    ? (
        window.innerWidth <= 600
        ? 58
        : 92
      )
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
        (
          window.innerWidth <= 600
          ? 10
          : 17
        );

      cardDiv.style.top =
        (
          window.innerWidth <= 600
          ? 45
          : 56
        )
        +
        curve
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
        *
        (
          window.innerWidth <= 600
          ? 4
          : 6
        );

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

function phoneSpacingLimit() {

  return (
    window.innerWidth <= 600
    ? 31
    : 45
  );

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

  showMessage(
    showAllCards
    ? "Hand spread out."
    : ""
  );

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
