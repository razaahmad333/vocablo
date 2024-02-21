const { getRoom, updateBoardAndScores } = require("../store/room");
const { getValidWordsFromBoard } = require("../utils/word");
const emitters = require("./emitters");

const usersInLobby = new Map();

exports.receiversMap = (ws, type, data) => {
  switch (type) {
    case "joinedLobby":
      this.joinedLobby(ws, data);
      break;
    case "joinedGame":
      this.joinedGame(ws, data);
      break;
    case "changedBoard":
      this.changedBoardState(ws, data);
      break;
    case "savedBoard":
      this.saveBoardState(ws, data);
      break;
    default:
      break;
  }
};

exports.joinedLobby = (ws, data) => {
  const { userId } = data;
  usersInLobby.set(userId, ws);
};

exports.joinedGame = async (ws, data) => {
  const { roomId, userId } = data;

  usersInLobby.set(userId, ws);

  const room = await getRoom(roomId, true);

  if (!room.members.every((member) => usersInLobby.has(member.userId))) {
    return;
  }

  room.members.forEach((member) => {
    const ws = usersInLobby.get(member.userId);
    emitters.emitRoomDetails(ws, {
      room,
      lastJoinee: userId,
    });
  });
};

exports.changedBoardState = async (ws, data) => {
  const { roomId, board } = data;

  const room = await getRoom(roomId);
  console.log(usersInLobby.keys());
  room.members
    .filter((member) => member !== data.userId)
    .forEach((member) => {
      const ws = usersInLobby.get(member);
      emitters.emitChangingBoardState(ws, board);
    });
};

exports.saveBoardState = async (ws, data) => {
  const { roomId, board, currentPlayerIndex } = data;

  const { members, usedWords, scores } = await getRoom(roomId, true);

  members.forEach((member) => {
    const ws = usersInLobby.get(member.userId);
    emitters.emitMemberSubmitted(ws, { currentPlayerIndex });
  });

  const validWords = await getValidWordsFromBoard(board);

  console.log(validWords);

  const scoringWords = validWords.filter((word) => !usedWords.includes(word));

  usedWords.push(...scoringWords);

  const newScores = scoringWords.join("").length;

  const isNewTurn =
    scores.length === 0 || scores.slice(-1)[0].every((score) => score !== "");

  if (isNewTurn) {
    scores.push(new Array(members.length).fill(""));
  }

  scores[scores.length - 1][currentPlayerIndex] = newScores;

  await updateBoardAndScores(roomId, { board, scores, usedWords });

  members.forEach((member) => {
    const ws = usersInLobby.get(member.userId);
    emitters.emitSavedBoardState(ws, {
      board,
      scores,
      scoringWords,
      currentPlayerIndex: (currentPlayerIndex + 1) % members.length,
    });
  });
};

exports.usersInLobby = usersInLobby;
