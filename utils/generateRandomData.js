import { v4 as uuidv4 } from "uuid";

export const generateUniqueId = () => {
  return uuidv4(); // Generates a unique UUID each time
};

export const generateUniqueId1 = () => {
  return Math.random().toString(36).substring(2, 12); // Generates a 10-character alphanumeric ID
};

export const generatePassword = (options = {}) => {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true, // Exclude similar looking characters (0, O, l, 1, etc.)
    customCharacters = null,
  } = options;

  let characters = "";

  if (customCharacters) {
    characters = customCharacters;
  } else {
    if (includeLowercase) characters += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) characters += "0123456789";
    if (includeSymbols) characters += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Remove similar looking characters
    if (excludeSimilar) {
      characters = characters.replace(/[0O1lI]/g, "");
    }
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return password;
};
