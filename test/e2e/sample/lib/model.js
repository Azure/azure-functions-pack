let sql = require('tedious');

class Model {
    getAll() {
        const request = new sql.Request("select 'hello'", function(err, rowCount) {
            // no op
        });
        return Promise.resolve([]);
    }

    add() {
        return Promise.resolve({});
    }
}

module.exports = {
    Model: Model
}