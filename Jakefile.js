var share = {};

var action = require('./index.js')(share).action;
var util = require('util');

desc('Deployment task');
task('default', ['launch:deploy'], function() {
});

desc('Print environmental variables');
task('env', [ ], function() {
    console.log(process.env);
    complete();
});