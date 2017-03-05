let model = require('../lib/model.js');

module.exports = function (context, req) {
    context.log('"libimport" function called');
    const m = new model.Model();
    m.getAll();
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};