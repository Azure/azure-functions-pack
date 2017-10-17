module.exports = function (context, req) {
    context.log('"scriptFile.index" function called');
    const res = {
        body: {
            status:400,
            "success":false
        }
    }
    context.done(null, res);
};