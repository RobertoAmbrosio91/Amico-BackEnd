/* HTTP status code constant starts */
module.exports.SERVER_ERROR_HTTP_CODE = 412;
module.exports.SERVER_NOT_ALLOWED_HTTP_CODE = 503;
module.exports.SERVER_OK_HTTP_CODE = 200;
module.exports.SERVER_NOT_FOUND_HTTP_CODE = 404;
module.exports.SERVER_INTERNAL_ERROR_HTTP_CODE = 500;
module.exports.EMAIL_REGEX=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
/* HTTP status codeconstant ends */

/* General Errors and Routes messages constants start */
module.exports.ROUTE_NOT_FOUND = 'You are at wrong place. Shhoooo...';
module.exports.SERVER_ERROR_MESSAGE = 'Something bad happend. It\'s not you, it\'s me.';

// DB Field Const
module.exports.VOTE_TYPES = ['Inspiring', 'Problem-Solving', 'Educational'];
module.exports.LIKE_TYPES = ["Heart", "Fire", "Top", "Laugh", "Mind_Blowing"];