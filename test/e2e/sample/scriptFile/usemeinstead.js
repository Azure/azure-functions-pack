module.exports = module.exports = function (context, req) {
    context.log('"scriptFile.usemeinstead" function called');
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};