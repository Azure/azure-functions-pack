const good = function (context, req) {
    context.log('"entryPoint.good" function called');
    const res = {
        body: {
            "success":true
        }
    }
    context.done(null, res);
};

const bad = function (context, req) {
    context.log('"entryPoint.bad" function called');
    const res = {
        status:400,
        body: {
            "success":false
        }
    }
    context.done(null, res);
};

module.exports = {
    good: good,
    bad: bad
} 