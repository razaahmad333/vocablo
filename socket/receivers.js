const { getRoom } = require("../store/room");
const { getValidWordsFromBoard } = require("../utils/word");
const emitters = require("./emitters");
const usersInLobby = new Map();

exports.mapReceivers = (ws, type, data) => {
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
    emitters.emitRoomDetails(ws, room);
  });
};

exports.changedBoardState = async (ws, data) => {
  const { roomId, board } = data;

  const room = await getRoom(roomId);
  room.members
    .filter((member) => member !== data.userId)
    .forEach((member) => {
      const ws = usersInLobby.get(member);
      emitters.emitChangingBoardState(ws, board);
    });
};

exports.saveBoardState = async (ws, data) => {
  const { roomId, board } = data;

  const validWords = await getValidWordsFromBoard(board);
  console.log(validWords);
  updateBoard(roomId, board);

  const room = await getRoom(roomId);

  room.members
    .filter((member) => member !== data.userId)
    .forEach((member) => {
      const ws = usersInLobby.get(member);
      emitters.emitSavedBoardState(ws, board);
    });
};