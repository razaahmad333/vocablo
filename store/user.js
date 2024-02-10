const db = require("../firestore");

const {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} = require("firebase/firestore");

const userCollection = collection(db, "users");

const createUser = async (user) => {
  const docRef = await addDoc(userCollection, user);
  return docRef.id;
};

const getUser = async (userId) => {
  const q = query(userCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  let user;
  querySnapshot.forEach((doc) => {
    user = doc.data();
    user.id = doc.id;
  });
  return user;
};

module.exports = {
  createUser,
  getUser,
};
