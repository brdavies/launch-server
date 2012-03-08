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

/**
 * This table defines what to do when a specific branch is modified. 
 */
var action_table = [{
    branch   : "live",
    dir      : "/srv/node/your-app-name",
    relaunch : 'echo "A command to relaunch your-app-name (live)"'
} , {
    branch   : "dev",
    dir      : "/srv/node/your-app-name",
    relaunch : 'echo "A command to relaunch your-app-name (dev)"'
}];

var post_receive = require(process.argv[2] + "/post_receive.js");

post_receive(action_table, function(data) {
    
    /* This callback is made once the application has been deployed. If a more
     * complicated sequence is required to relaunch the application, do it
     * here. */
    console.log(data);
    
});