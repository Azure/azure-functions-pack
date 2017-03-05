module.exports = function (context, req) {
    context.log('"./lib/externalScriptFile" function called');
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};