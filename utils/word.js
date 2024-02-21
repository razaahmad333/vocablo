const fs = require("fs");
const path = require("path");
const readline = require("readline");

const filePath = path.join(__dirname, "../words.txt");

exports.areWordsValid = (words, callback) => {
  const fileStream = fs.createReadStream(filePath);
  let linesRead = 0;
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log("Checking word...");

  const validWords = [];

  // let checkedWords = words.reduce((acc, word) => {
  //   acc[word.toLowerCase()] = false;
  //   return acc;
  // }, {});

  rl.on("line", (line) => {
    linesRead++;
    let sourceWord = line.trim().toLowerCase();

    words.forEach((word) => {
      if (word.includes(sourceWord)) {
        validWords.push(sourceWord);
      }
    });
  });

  rl.on("close", () => {
    console.log("Lines read:", linesRead);
    callback(validWords);
  });

  rl.on("error", (err) => {
    console.log("Error", err);
    callback(false);
  });
};

exports.getValidWordsFromBoard = (originalBoard) => {
  const board = [...originalBoard.map((row) => [...row])];

  let stringRev = "";

  for (let i = 0; i < board.length; i++) {
    let stringRow = "";
    for (let j = 0; j < board[i].length; j++) {
      stringRow += board[j][i];
    }
    stringRev += stringRow.split("").reverse().join("") + " ";
  }

  const rawString = [
    board.map((row) => row.join("")).join(" "),
    board.map((row) => row.reverse().join("")).join(" "),
    board
      .reduce((acc, row) => {
        row.forEach((col, index) => {
          acc[index] = (acc[index] || "") + col;
        });
        return acc;
      }, [])
      .join(" "),
    stringRev,
  ];

  const words = rawString
    .join(" ")
    .toLowerCase()
    .split(/[^a-zA-Z]/)
    .filter((word) => word.length > 1);

  console.log("words");

  console.log(words);

  return new Promise((resolve, reject) => {
    this.areWordsValid(words, (validWords) => {
      resolve(validWords);
    });
  });
};
