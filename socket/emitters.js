exports.emitRoomDetails = (ws, {room, lastJoinee}) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "roomDetailShared",
      ...room,
      lastJoinee
    })
  );
};

exports.emitChangingBoardState = (ws, board) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "boardChanged",
      board,
    })
  );
};

exports.emitSavedBoardState = (ws, data) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "boardSaved",
      ...data,
    })
  );
};

exports.emitMemberJoined = (ws, member) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "memberJoined",
      member,
    })
  );
};

exports.emitGameStarted = (ws, roomId) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "gameStarted",
      roomId,
    })
  );
};


exports.emitMemberSubmitted = (ws, data) => {
  if (!ws) {
    console.log("No ws");
    return;
  }
  ws?.send(
    JSON.stringify({
      type: "memberSubmitted",
      ...data,
    })
  );
}