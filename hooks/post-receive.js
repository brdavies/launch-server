/**
 * @file post-receive.js
 *
 * @brief git post-receive script (in javascript).
 *
 * @section usage Usage Instructions
 *
 * -# Copy this post-receive.js file to the 'hooks' directory of your
 *    repository. If gitolite is used to host the repository this will be
 *    something like '/srv/git/repositories/node.proxy.git/hooks'.
 *
 * -# Edit or create post-receive (a shell script) in the same location (e.g.
 *    '/srv/git/repositories/node.proxy.git/hooks/post-receive') and add:
 *
 *    repo_dir=`pwd`
 *    launch_dir="/path/to/launch"
 *    node ./hooks/post-receive.js ${launch_dir} ${repo_dir}
 *
 * -# Modify @ref action_table to perform different actions when changes are
 *    made to different branches in the repository.
 */


desc('Post-receive deployment');
task('post-receive', [ 'validate-deploy' ], function() {

    var options = {
        /**
         * This table defines what to do when a specific branch is modified. */
        table : [{
            branch   : "live",
            dir      : "/srv/node/your-app-name",
            relaunch : 'echo "A command to relaunch your-app-name (live)"'
        } , {
            branch   : "master",
            dir      : "/srv/node/your-app-name",
            relaunch : 'echo "A command to relaunch your-app-name (dev)"'
        }],

        /**
         * Path to the repository. */
        repo : process.env.repo,

        /**
         * Path to the launch application that does all the work of
         * deploying. */
        launch_app : process.env.launch_app
    };

    var post_receive = require(process.env.launch_app + "/post_receive.js");

    post_receive(options, function(data) {

        /* This callback is made once the application has been deployed. If a more
         * complicated sequence is required to relaunch the application, do it
         * here. */
        console.log(data);
    });

    complete();

}, true);

desc('Validate parameters');
task('validate-deploy', [ ], function() {

    if (!process.env.repo) {
        console.log('Path to source repository not defined (repo=xxxx).');
        fail();
    } else if (!process.env.launch_app) {
        console.log('Root directory of launch application not defined (launch_app=xxxx).');
        fail();
    } else {
        complete();
    }

}, true);