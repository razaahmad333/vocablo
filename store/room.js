const db = require("../firestore");

const { getUser } = require("./user");

const {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} = require("firebase/firestore");

const roomCollection = collection(db, "rooms");

const createRoom = async (room) => {
  const docRef = await addDoc(roomCollection, room);
  return docRef.id;
};

const getRoom = async (roomId, populateMembers = false) => {
  const q = query(roomCollection, where("roomId", "==", roomId));
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
  }
  return room;
};

const addMemberToRoom = async (roomId, userId) => {
  const room = await getRoom(roomId);
  const roomRef = doc(db, "rooms", room.id);
  room.members.push(userId);
  await updateDoc(roomRef, { members: room.members });
};

module.exports = {
  createRoom,
  getRoom,
  addMemberToRoom,
};
