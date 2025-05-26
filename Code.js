/**
 * Creates a new instance of BlingApi.
 * @param {Object} appData - Stores application-level credentials.
 * @param {Object} userData - Stores user authentication tokens.
 * @returns {BlingApi} - New BlingApi instance.
 */
function Constructor(appData, userData) {
  return new BlingApi(appData,userData);
}


