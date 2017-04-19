const chai = require('chai');

module.exports = function (context, req) {
    context.log('"simple" function called');
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};