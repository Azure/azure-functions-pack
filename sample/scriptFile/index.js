module.exports = function (context, req) {
    context.log('"scriptFile.index" function called');
    const res = {
        body: {
            "success":false
        }
    }
    context.done(null, res);
};