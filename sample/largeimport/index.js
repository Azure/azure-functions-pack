const azure = require('azure');

module.exports = function (context, req) {
    context.log('"largeimport" function called');
    const insights = azure.InsightsClient;
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};