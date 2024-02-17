exports.emitRoomDetails = (ws, room) => {
  ws.send(
    JSON.stringify({
      type: "roomDetailShared",
      ...room,
    })
  );
};

exports.emitChangingBoardState = (ws, board) => {
  ws.send(
    JSON.stringify({
      type: "boardChanged",
      board,
    })
  );
};

exports.emitSavedBoardState = (ws, board) => {
  ws.send(
    JSON.stringify({
      type: "boardSaved",
      board,
    })
  );
};

exports.emitMemberJoined = (ws, member) => {
  ws.send(
    JSON.stringify({
      type: "memberJoined",
      member,
    })
  );
};

exports.emitGameStarted = (ws, roomId) => {
  ws.send(
    JSON.stringify({
      type: "gameStarted",
      roomId,
    })
  );
};
