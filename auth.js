const jwt = require("jsonwebtoken");

module.exports = function (token) {
    try {
        const decoded = jwt.verify(token, "randomString");
        return decoded.user.id;
    } catch (e) {
        return null;
    }
};
