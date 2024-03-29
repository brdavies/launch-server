var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

require('./colors');

exports.error = function (message) {
    console.log('\n  ✘ '.red + ' ' + message + '\n');
};

exports.success = function (message) {
    console.log('\n  ✔ '.green + ' ' + message + '\n');
};

exports.notice = function (message) {
    console.log('\n  ● '.yellow + ' ' + message + '\n');
};

exports.printItem = function (prefix, item) {
    console.log(prefix);
    Object.keys(item).forEach(function (key) {
        console.log('|-- ' + key + ': ' + item[key]);
    });
};

exports.remote = function (host, cmd, callback) {
    var ssh = spawn('ssh', [host, cmd]), out = '';

    process.stdout.write(('\n  $ ssh ' + host + ' ' + cmd + '\n    ').blue);

    ssh.stdout.on('data', function (data) {
        out += data;
        process.stdout.write(('' + data).replace(/\n/g, '\n    ').grey);
    });

    ssh.stderr.on('data', function (data) {
        process.stdout.write(('' + data).replace(/\n/g, '\n    ').red);
    });

    ssh.on('exit', function (code) {
        callback(code, out);
    });

    ssh.stdin.end();
};


exports.local = function (cmd, callback) {
    var proc = exec(cmd);

    console.log(('\n  $ ' + cmd).blue);
    process.stdout.write('\n    ');

    proc.stdout.on('data', function (data) {
        process.stdout.write(('' + data).replace(/\n/g, '\n    ').grey);
    });

    proc.stderr.on('data', function (data) {
        process.stdout.write(('' + data).replace(/\n/g, '\n    ').red);
    });

    proc.on('exit', function (code) {
        callback(code);
    });

    proc.stdin.end();
};
