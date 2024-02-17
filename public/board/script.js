const rows = localStorage.getItem("rows") || 7;
const userId = localStorage.getItem("userId");
const roomId = new URLSearchParams(window.location.search).get("roomId");

if (!userId) {
  window.location.href = "/";
}

if (!roomId) {
  window.location.href = "/lobby";
}

// document.getElementById("h1").innerHTML = userId;

let members = [];
let gameBoardState = [];
let scores = [];
let currentPlayerIndex = 0;

let interval;

const getInitialBoardState = (rows) => {
  const arr = [];
  for (let i = 0; i < rows; i++) {
    arr.push(new Array(rows).fill(""));
  }
  return arr;
};

const ws = new WebSocket(`ws://localhost:3000`);

const $RECEIVERS = {
  ROOM_DETAIL_SHARED: "roomDetailShared",
  BOARD_CHANGED: "boardChanged",
  BOARD_SAVED: "boardSaved",
  MEMBER_LEFT: "memberLeft",
};

const receiveMessage = (type, data) => {
  switch (type) {
    case $RECEIVERS.ROOM_DETAIL_SHARED: {
      gameBoardState = data.board;
      if (gameBoardState.length === 0) {
        gameBoardState = getInitialBoardState(rows);
      }
      updateGameBoard(gameBoardState);

      members = data.members;
      initScoreBoard(members);
      updateTimerAndPlayer(true);

      scores = data.scores;
      // updateScoreBoard(scores);
      break;
    }
    case $RECEIVERS.BOARD_CHANGED: {
      gameBoardState = data.board;
      updateGameBoard(gameBoardState);
      break;
    }
    case $RECEIVERS.BOARD_SAVED: {
      gameBoardState = data.board;
      updateGameBoard(gameBoardState);
      updateTimerAndPlayer();
      scores = data.scores;
      // updateScoreBoard(scores);
      break;
    }
    case $RECEIVERS.MEMBER_LEFT: {
      const member = members.find((member) => member.userId === data.member);
      if (!member) {
        return;
      }

      const alert_ok = alert("Player " + member.name + " has left the game");
      console.log(alert_ok);
      window.location.href = "/lobby";
      break;
    }
    default:
      break;
  }
};

const $EMITTER = {
  JOINED_GAME: "joinedGame",
  CHANGED_BOARD: "changedBoard",
  SAVED_BOARD: "savedBoard",
};

const emitMessage = (type, data) => {
  switch (type) {
    case $EMITTER.JOINED_GAME:
      ws.send(
        JSON.stringify({
          type: $EMITTER.JOINED_GAME,
          ...data,
        })
      );
      break;
    case $EMITTER.CHANGED_BOARD:
      ws.send(
        JSON.stringify({
          type: $EMITTER.CHANGED_BOARD,
          ...data,
        })
      );
      break;
    case $EMITTER.SAVED_BOARD:
      ws.send(
        JSON.stringify({
          type: $EMITTER.SAVED_BOARD,
          ...data,
        })
      );
      break;
    default:
      break;
  }
};

ws.onopen = () => {
  // console.log("Connected to server");
  emitMessage($EMITTER.JOINED_GAME, { roomId, userId });
};

ws.onmessage = (event) => {
  // console.log("Received:", event.data);
  const data = JSON.parse(event.data);
  const { type } = data;
  receiveMessage(type, data);
};

// const timerProgress = document.getElementById("timerProgress");

// const timer = 10000; // milliseconds
// const step = 100; // milliseconds

// let time = 0;
// let interval = setInterval(() => {
//   time += step;
//   timerProgress.style.width = `${(time / timer) * 100}%`;

//   if (time >= timer) {
//     clearInterval(interval);
//     currentPlayerIndex = (currentPlayerIndex + 1) % members.length;
//   }
// }, step);

const submitButton = document.getElementById("submit");

submitButton.addEventListener("click", () => {
  updateTimerAndPlayer();
  emitMessage($EMITTER.SAVED_BOARD, { roomId, board: gameBoardState, userId });
});

function updateTimerAndPlayer(init = false) {
  currentPlayerIndex = init ? 0 : (currentPlayerIndex + 1) % members.length;
  const currentPlayer = members[currentPlayerIndex];
  const currentPlayerName = document.getElementById("currentPlayerName");
  currentPlayerName.textContent = "Turn: " + currentPlayer.name;

  if (interval) {
    clearInterval(interval);
  }

  const timerProgress = document.getElementById("timerProgress");
  timerProgress.style.width = "0%";
  const timer = 10000; // milliseconds
  const step = 100; // milliseconds

  let time = 0;

  interval = setInterval(() => {
    time += step;
    timerProgress.style.width = `${(time / timer) * 100}%`;

    if (time >= timer) {
      clearInterval(interval);
      currentPlayerIndex = (currentPlayerIndex + 1) % members.length;
      // updateTimerAndPlayer();
    }
  }, step);

  if (userId === currentPlayer.userId) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

function updateScoreBoard(scores) {
  const scoreBoard = document.getElementById("scoreBoard");
  const tbody = scoreBoard.querySelector("tbody");

  scores.forEach((row, index) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  const total = scores.reduce((acc, row) => {
    return acc.map((value, index) => value + row[index]);
  }, new Array(members.length).fill(0));

  const tr = document.createElement("tr");

  total.forEach((value) => {
    const td = document.createElement("td");
    td.textContent = value;
    td.style.fontWeight = "bold";
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function initScoreBoard(members) {
  const scoreBoard = document.getElementById("scoreBoard");
  const thead = scoreBoard.querySelector("thead");

  members.forEach((player) => {
    const th = document.createElement("th");
    th.textContent = player.name;
    thead.appendChild(th);
  });
}

function init() {
  const gameBoardContainer = document.getElementById("gameBoard");

  const windowWidth = window.innerWidth;

  const cellSize = (windowWidth - 130) / rows;

  console.log(cellSize);

  for (let i = 0; i < rows; i++) {
    const row = document.createElement("tr");

    for (let j = 0; j < rows; j++) {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.style.width = `${cellSize}px`;
      input.style.height = `${cellSize}px`;
      input.type = "text";
      input.maxLength = 1;
      cell.appendChild(input);
      row.appendChild(cell);
    }

    gameBoardContainer.appendChild(row);
  }

  const inputs = gameBoardContainer.querySelectorAll("input");

  inputs.forEach((input, index) => {
    if (index === 0) {
      console.log(input);
      input.focus();
    }

    input.addEventListener("input", (e) => {
      inputs[index].style.outlineColor = "black";

      if (e.target.value.length > 1) {
        e.target.value = e.target.value.slice(0, 1);
      }

      if (Number.isInteger(parseInt(e.target.value))) {
        e.target.value = "";
        inputs[index].style.outlineColor = "red";
      }

      const i = Math.floor(index / rows);
      const j = index % rows;

      gameBoardState[i][j] = e.target.value;

      emitMessage($EMITTER.CHANGED_BOARD, {
        roomId,
        board: gameBoardState,
        userId,
      });
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        inputs[index + 1].focus();
      } else if (e.key === "ArrowLeft") {
        inputs[index - 1].focus();
      } else if (e.key === "ArrowDown") {
        inputs[index + rows].focus();
      } else if (e.key === "ArrowUp") {
        inputs[index - rows].focus();
      }
    });
  });
}

function updateGameBoard(gameBoardState) {
  const gameBoardContainer = document.getElementById("gameBoard");

  const inputs = gameBoardContainer.querySelectorAll("input");

  inputs.forEach((input, index) => {
    input.value = gameBoardState[Math.floor(index / rows)][index % rows];
  });
}

init();
