const _ = require('lodash');

module.exports = function (context, req) {
    context.log('"simpleimport" function called');
    _.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 });
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};