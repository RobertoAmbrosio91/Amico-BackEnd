var Util = function () {};

Util.prototype.success = function (payload, message) {
    return {success: true, message: message, result: payload}
}
Util.prototype.error = function (payload={}, message) {
    return {success: false, message: message, result: payload}
}
module.exports =new Util();