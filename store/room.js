const db = require("../firestore");

const { getUser } = require("./user");

const {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  orderBy,
  updateDoc,
} = require("firebase/firestore");

const roomCollection = collection(db, "rooms");

const createRoom = async (room) => {
  const docRef = await addDoc(roomCollection, room);
  return docRef.id;
};

const getRoom = async (roomId, populateMembers = false) => {
  const q = query(roomCollection, where("roomId", "==", roomId), orderBy("createdAt"));
  const querySnapshot = await getDocs(q);
  let lastQS  = querySnapshot.docs.pop();
  
  if (!lastQS) {
    throw new Error("Room not found");
  }
  const room = lastQS.data();
  room.id = lastQS.id;
  
  if (populateMembers) {
    const members = [];
    for (const memberId of room.members) {
      const user = await getUser(memberId);
      members.push(user);
    }
    room.members = members;
    room.board = JSON.parse(room.board);
    room.scores = JSON.parse(room.scores || "[]");
    room.usedWords = JSON.parse(room.usedWords || "[]");
  }
  return room;
};

const addMemberToRoom = async (roomId, userId) => {
  const room = await getRoom(roomId);
  const roomRef = doc(db, "rooms", room.id);
  room.members.push(userId);
  await updateDoc(roomRef, { members: room.members });
};

const updateBoardAndScores = async (roomId, { board, scores, usedWords }) => {
  const room = await getRoom(roomId);
  const roomRef = doc(db, "rooms", room.id);
  await updateDoc(roomRef, {
    board: JSON.stringify(board),
    scores: JSON.stringify(scores),
    usedWords: JSON.stringify(usedWords),
  });
};

const getRoomByUserId = async (userId, populateMembers = false) => {
  const q = query(roomCollection, where("members", "array-contains", userId));
  const querySnapshot = await getDocs(q);
  let room;
  querySnapshot.forEach((doc) => {
    room = doc.data();
    room.id = doc.id;
  });
  if (populateMembers) {
    const members = [];
    for (const memberId of room.members) {
      const user = await getUser(memberId);
      members.push(user);
    }
    room.members = members;
    room.board = JSON.parse(room.board);
    room.scores = JSON.parse(room.scores || "[]");
    room.usedWords = JSON.parse(room.usedWords || "[]");
  }
  return room;
};

module.exports = {
  createRoom,
  getRoom,
  addMemberToRoom,
  updateBoardAndScores,
  getRoomByUserId,
};
