const rows = localStorage.getItem("rows") || 7;

// roomId from params
const userId = localStorage.getItem("userId");
const roomId = new URLSearchParams(window.location.search).get("roomId");

const ws = new WebSocket(`ws://localhost:3000`);

ws.onopen = () => {
  const message = JSON.stringify({
    type: "joinedGame",
    roomId: roomId,
    userId: userId,
  });
  ws.send(message);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  const { type } = data;

  if (type === "memberDetails") {
    const members = data.members;
    console.log(members);
    initScoreBoard(members);
  }
};


const gameBoardState = [];

for (let i = 0; i < rows; i++) {
  gameBoardState.push(new Array(rows).fill(""));
}

const scores = [
  // [0, 0, 0],
  // [0, 0, 0],
  // [0, 0, 0],
];

let currentPlayerIndex = 0;

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

// const submitButton = document.getElementById("submit");

// submitButton.addEventListener("click", () => {
//   clearInterval(interval);
//   time = 0;
//   timerProgress.style.width = "0";
//   currentPlayerIndex = (currentPlayerIndex + 1) % members.length;

//   const row = gameBoardState.map((row) => row.join(""));
// });

function initScoreBoard(members) {
  const scoreBoard = document.getElementById("scoreBoard");
  const thead = scoreBoard.querySelector("thead");

  members.forEach((player) => {
    const th = document.createElement("th");
    th.textContent = player.name;
    thead.appendChild(th);
  });

  // const tbody = scoreBoard.querySelector("tbody");

  // scores.forEach((row) => {
  //   const tr = document.createElement("tr");

  //   row.forEach((score) => {
  //     const td = document.createElement("td");
  //     td.textContent = score;
  //     tr.appendChild(td);
  //   });

  //   tbody.appendChild(tr);
  // });

  // const total = scores.reduce(
  //   (acc, row) => {
  //     return acc.map((value, index) => value + row[index]);
  //   },
  //   [0, 0, 0]
  // );

  // const tr = document.createElement("tr");

  // total.forEach((value) => {
  //   const td = document.createElement("td");
  //   td.textContent = value;
  //   td.style.fontWeight = "bold";
  //   tr.appendChild(td);
  // });

  // tbody.appendChild(tr);
}
function init() {
  const gameBoard = document.getElementById("gameBoard");

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

    gameBoard.appendChild(row);
  }

  const inputs = gameBoard.querySelectorAll("input");

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

init();
