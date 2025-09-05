import fs from "fs";
import path from "path";

// Cache the users data to avoid reading file multiple times
let cachedUsers = null;

/**
 * Read users data from file, using cache if available
 */
const readUsers = () => {
  if (!cachedUsers) {
    const usersPath = path.resolve("./test-data/users.json");
    cachedUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  }
  return cachedUsers;
};

/**
 * Get username from variable
 */
export const fetchUsername = (userVariable) => {
  try {
    const users = readUsers();

    // If it's a direct reference (e.g., "admin_1"), return the username
    if (users.data[userVariable]) {
      return users.data[userVariable].username;
    }

    // If it's already a username, verify it exists
    const userEntry = Object.values(users.data).find(
      (user) => user.username === userVariable
    );
    if (userEntry) {
      return userVariable;
    }

    return userVariable;
  } catch (error) {
    return userVariable;
  }
};

/**
 * Get organisation code from config
 */
export const getOrganisationCode = (organisation_code) => {
  try {
    const users = readUsers();
    return users.organisation_codes[organisation_code] || "default";
  } catch (error) {
    return "default";
  }
};

/**
 * Get user details by username or variable
 */
export const getUserDetails = (usernameOrVariable) => {
  try {
    const users = readUsers();

    // If it's a direct reference (e.g., "admin_1")
    if (users.data[usernameOrVariable]) {
      return users.data[usernameOrVariable];
    }

    // If it's a username, find the matching entry
    return (
      Object.values(users.data).find(
        (user) => user.username === usernameOrVariable
      ) || null
    );
  } catch (error) {
    return null;
  }
};

