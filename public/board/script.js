const rows = localStorage.getItem("rows") || 7;
const userId = localStorage.getItem("userId");
const roomId = new URLSearchParams(window.location.search).get("roomId");
const name = localStorage.getItem("name");

if (!userId) {
  window.location.href = "/";
}

if (!roomId) {
  window.location.href = "/lobby";
}

if (!name) {
  window.location.href = "/";
}

const messageEle = document.getElementById("message");
messageEle.innerHTML = "Waiting for other players to join";
document.getElementById("h1").innerHTML = "Welcome to Vocablo <br/> " + name;

let members = [];
let gameBoardState = [];
let scores = [];
let currentPlayerIndex = 0;
let isGameStarted = false;
let interval;

const getInitialBoardState = (rows) => {
  const arr = [];
  for (let i = 0; i < rows; i++) {
    arr.push(new Array(rows).fill(" "));
  }
  return arr;
};

const ws = new WebSocket(`ws://localhost:3000`);

const $RECEIVERS = {
  ROOM_DETAIL_SHARED: "roomDetailShared",
  BOARD_CHANGED: "boardChanged",
  BOARD_SAVED: "boardSaved",
  MEMBER_LEFT: "memberLeft",
  MEMBER_SUBMITTED: "memberSubmitted",
};

const receiveMessage = (type, data) => {
  switch (type) {
    case $RECEIVERS.ROOM_DETAIL_SHARED: {
      
      console.log({isGameStarted})

      if(isGameStarted){
        const lastJoinee = data.lastJoinee;
        const member = members.find((member) => member.userId === lastJoinee);
        messageEle.innerHTML = member?.name + " has joined the game";
        return;
      }
      
      gameBoardState = data.board;

      messageEle.innerHTML = "All players have joined the game";

      if (gameBoardState.length === 0) {
        gameBoardState = getInitialBoardState(rows);
      }
      isGameStarted = true;
      updateGameBoard(gameBoardState);

      members = data.members;
      initScoreBoard(members);
      updateTimerAndPlayer(true);

      scores = data.scores;
      updateScoreBoard(scores);

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
      scores = data.scores;

      updateScoreBoard(scores);

      const scoringWords = data.scoringWords;
      showScoringWords(scoringWords);

      setTimeout(() => {
        updateTimerAndPlayer(false, data.currentPlayerIndex);
      } , 1000); 

      break;
    }
    case $RECEIVERS.MEMBER_LEFT: {
      const member = members.find((member) => member.userId === data.member);
      if (!member) {
        return;
      }

      messageEle.innerHTML = "Player " + member.name + " has left the game";
      break;
    }

    case $RECEIVERS.MEMBER_SUBMITTED: {
      clearInterval(interval);
      const member = members[data.currentPlayerIndex];
      document.getElementById("message").innerHTML = member.name + " has submitted the board";      
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
  console.log("Connected to server");
  emitMessage($EMITTER.JOINED_GAME, { roomId, userId });
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const { type } = data;
  receiveMessage(type, data);
};

const submitButton = document.getElementById("submit");

submitButton.addEventListener("click", () => {
  submitButton.disabled = true;
  clearInterval(interval);
  emitMessage($EMITTER.SAVED_BOARD, { roomId, board: gameBoardState, userId,currentPlayerIndex  });
});

function updateTimerAndPlayer(init = false, playerIndex) {
  currentPlayerIndex = init ? 0 : playerIndex;

  const currentPlayer = members[currentPlayerIndex];
  
  const currentPlayerName = document.getElementById("currentPlayerName");
  currentPlayerName.textContent = "Turn: " + currentPlayer.name;

  if (interval) {
    clearInterval(interval);
  }

  const timerProgress = document.getElementById("timerProgress");
  timerProgress.style.width = "0%";
  const timer = 30*1000; // milliseconds
  const step = 100; // milliseconds

  let time = 0;

  interval = setInterval(() => {
    time += step;
    timerProgress.style.width = `${(time / timer) * 100}%`;
    timerProgress.innerHTML = `${Math.floor((time / timer) * 100)}%`;
    if (time >= timer) {
      clearInterval(interval);
      emitMessage($EMITTER.SAVED_BOARD, { roomId, board: gameBoardState, userId, currentPlayerIndex });      
    }
  }, step);

  if (userId === currentPlayer.userId) {
    submitButton.disabled = false;
    document.getElementById("message").innerHTML = "Your turn";
    document.getElementById("gameBoard").style.pointerEvents = "auto";
  } else {
    submitButton.disabled = true;
    document.getElementById("gameBoard").style.pointerEvents = "none";
  }
}

function showScoringWords(words) {
  if (words.length === 0) {
    messageEle.innerHTML = "No scoring words found";
    return;
  }
  messageEle.innerHTML = ` <b>Scoring words:</b> ${words.join(", ")} <br> <b> Scores gained:</b> ${words.join("").length} points `;
}

function updateScoreBoard(scores) {
  const scoreBoard = document.getElementById("scoreBoard");
  const tbody = scoreBoard.querySelector("tbody");

  tbody.innerHTML = "";

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
  thead.innerHTML = "";
  members.forEach((player) => {
    const th = document.createElement("th");
    th.textContent = player.name;
    thead.appendChild(th);
  });
}

function init() {
  const gameBoardContainer = document.getElementById("gameBoard");

  const windowWidth = window.innerWidth > 1000 ? 400 : window.innerWidth;

  const cellSize = (windowWidth - 50) / rows;

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
      input.focus();
    }

    input.addEventListener("input", (e) => {
      inputs[index].style.outlineColor = "black";

      const trimmedVal = e.target.value.trim();
      if (trimmedVal.length > 1) {
        e.target.value = trimmedVal.slice(0, 1);
      }

      if (Number.isInteger(parseInt(trimmedVal))) {
        e.target.value = " ";
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
      } else {
        console.log(e.key);
      }
    });
  });
}

function updateGameBoard(gameBoardState) {
  const gameBoardContainer = document.getElementById("gameBoard");

  const inputs = gameBoardContainer.querySelectorAll("input");

  inputs.forEach((input, index) => {
    const val = gameBoardState[Math.floor(index / rows)][index % rows];
    if(val !== " "){
      input.disabled = true;
      input.style.backgroundColor = "lightgray";
      input.style.pointerEvents = "none";
    }
      input.value = val === " " ? "" : val;
  });
}

init();
