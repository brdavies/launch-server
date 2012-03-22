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
 *    node ./hooks/post-receive.js
 *
 * -# Modify @ref action_table to perform different actions when changes are
 *    made to different branches in the repository.
 *
 * @section post_receive Git Post Receive
 *
 * Revisions are fed in to the git post-receive hook from stdin. The input may
 * contain multiple lines formatted as "old_rev new_rev ref".
 */

/**
 * This function reads git revision data from stdin and executions actions
 * (defined in @p table) based on what branches have been modified.
 *
 * @param[in] table
 *     This table defines what to do when a specific branch is modified. The 'exec'
 *     key can be one of the following:
 *
 *     string: a system command to execute. The command receives three arguments,
 *     "old revision", "new revision", and "referenece". For example, if 'exec' is
 *     "echo" the script will print something like "4b6f... 33d1... master" (where
 *     "4b6f..." and "33d1..." are full revs).
 *
 *     function: a function to call. The function receives three arguments, "old
 *     revision", "new revision", and "referenece".
 */
module.exports = function(options, cb) {

    var post_receive = function(table, repo_dir, launch_dir, cb) {

        var exec = require('child_process').exec;
        var git_output = "";

        /**
         * This function executes the system command defined by @p cmd, passing
         * it @p rev_old, @p rev_new, and @p branch as command line arguments.
         *
         * @param[in] cmd
         *     A system command to execute (e.g. "echo").
         * @param[in] data
         *     Object with the following:
         *     - rev_old
         *       Old git revision (e.g.
         *       "4b6f298ae8af9c467ff7c048dacf6a042550ab52").
         *     - rev_new
         *       New git revision.
         *     - branch
         *       The git branch that changed (e.g. "master").
         */
        var run = function(cmd, data, cb) {

            if (data) {
                cmd += " " + data.rev_old + " " + data.rev_new + " " + data.branch;
            }
            var c = exec(cmd);

            c.stdout.on('data', function(data) {
                console.log(data);
            });

            c.stderr.on('data', function(data) {
                console.log(data);
            });

            c.on('exit', function(code) {
                if (cb) {
                    cb(data);
                }
            });
        };

        /**
         * This function executes the Jake build tool.
         *
         * @param[in] cmd
         *     A system command to execute (e.g. "echo").
         * @param[in] data
         *     Object with the following:
         *     - rev_old
         *       Old git revision (e.g.
         *       "4b6f298ae8af9c467ff7c048dacf6a042550ab52").
         *     - rev_new
         *       New git revision.
         *     - branch
         *       The git branch that changed (e.g. "master").
         * @param[in] cb
         *     Callback function executed when jake as exited.
         */
        var run_jake = function(data, cb) {

            var cmd = "";

            var args = "";

            args += " branch=" + data.branch;
            args += " rev=" + data.rev_new;
            args += " repo=" + repo_dir;
            args += " dir=" + data.dir;

            cmd += "cd " + launch_dir;
            cmd += "&& jake" + args;

            var c = exec(cmd);

            c.stdout.on('data', function(data) {
                console.log(data);
            });

            c.stderr.on('data', function(data) {
                console.log(data);
            });

            c.on('exit', function(code) {
                if (cb) {
                    cb(data);
                }
            });
        };

        var jake_complete = function(data) {
            if (data.relaunch) {
                run(data.relaunch, undefined, function() {
                    if (cb) {
                        cb(data);
                    }
                });
            } else if (cb) {
                cb(data);
            }
        };

        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', function(chunk) {
            git_output += chunk;
        });

        process.stdin.on('end', function() {

            /* Revisions are fed in to the git post-receive hook from stdin. Each
             * input line is formatted as "old_rev new_rev ref". Break up each line
             * in to parts and use the 'table' input paramter to figure out what to
             * do with the data. */

            var refs = git_output.split("\n");
            var ref;

            refs.forEach(function(ref) {

                if (ref) {
                    var data = {};
                    var revs = ref.split(" ");

                    data.rev_old = revs[0];
                    data.rev_new = revs[1];
                    data.branch = revs[2];

                    if (data.branch) {
                        data.branch = data.branch.split("/").pop();
                    }

                    table.forEach(function(entry) {

                        if (entry.branch == data.branch) {
                            data.dir = entry.dir;
                            data.relaunch = entry.relaunch;
                            if (entry.exec) {
                                switch (typeof(entry.exec)) {
                                case "string" :
                                    run(entry.exec, data);
                                    break;
                                case "function" :
                                    entry.exec(data);
                                    break;
                                };
                            } else if (entry.dir) {
                                run_jake(data, jake_complete);
                            }
                        }
                    });
                }
            });
        });
    };

    var fs = require('fs');

    if (!options) {
        throw new Error('Invalid options');
    } else if (!options.repo) {
        throw new Error("Repository path not set in options (repo).");
    } else if (!options.launch_app) {
        throw new Error("Launch application path not set in options (launch_app).");
    } else {
        fs.stat(options.repo, function(err, stat) {
            if ((err) || (!stat.isDirectory())) {
                throw new Error('Repository path ' + options.repo + ' is invalid.');
            } else {
                fs.stat(options.launch_app, function(err, stat) {
                    if ((err) || (!stat.isDirectory())) {
                        throw new Error(
                            'Launch application path ' + options.launch_app +
                            ' is invalid.');
                    } else {
                        post_receive(
                            options.table, options.repo, options.launch_app, cb);
                    }
                });
            }
        });
    }
};