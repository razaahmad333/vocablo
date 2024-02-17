

const {areWordsValid} = require("./utils/word");

areWordsValid(["Zebra", "Apple", 'safeee'], (isValid) => {
  console.log(isValid);
});
