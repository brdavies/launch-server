/*  Reference: https://github.com/mde/jake */

module.exports = function (share) {

    var spawn = require('child_process').spawn,
        fs = require('fs'),
        action = require('./action');

    share = share || {};

    /*
     * 1. Make destination directory.
     * 2. Clone repository to a known directory if it doesn't exist.
     * 3. Pull repository.
     * 4. Checkout cloned repository to the specific revision.
     * 5. Export current files to (checkout-index) revision-specific directory.
     * 6. If a Jakefile or Jakefile.js is found in the project's root directory,
     * 7  execute it. Otherwise perform npm install.
     * 8. Adjust symbolic link to point to the new location.
     * 9. Remove old directories.
     */

    desc('Deploy a new revision');
    task('deploy', [ 'launch:clean'], function() {
        action.success('Deployed ' + share.branch + ' @ ' + share.rev + '.');
        complete();
    }, true);

    desc('Remove old deployments');
    task('clean', [ 'launch:symlink'], function() {
        action.success('Removed outdated deployements.');
        complete();
    }, true);

    desc('Set symbolic link');
    task('symlink', [ 'launch:build'], function() {

        var cmd = "rm -f " + share.ln;
        cmd += " && ln -s " + share.dst + " " + share.ln;

        action.local(cmd, function(ret) {
            if (ret == 0) {
                action.success('Symbolic link updated.');
                complete();
            } else {
                action.success('Could not update symbolic link.');
                fail();
            }
        });

    }, true);

    desc('Build project');
    task('build', [ 'launch:checkout'], function() {

        var jakefile = share.dst + "/Jakefile";
        var msg = "Build successful";

        fs.stat(jakefile, function(err, stat) {
            if (err) {
                fs.stat(jakefile + ".js", function(err, stat) {
                    if (err) {
                        /* 'Jakefile' and 'Jakefile.js' do not exist, perform a
                         * regular npm install. */
                        jake.Task['launch:npm'].invoke();
                        action.success(msg);
                        complete();                        
                    } else {
                        jake.Task['launch:jake'].invoke();
                        action.success(msg);
                        complete();                        
                    }
                });
            } else {
                jake.Task['launch:jake'].invoke();
                action.success(msg);
                complete();
            }
        });
    }, true);

    desc('Install dependencies via npm');
    task('npm', [ ], function () {

        var cmd = 'cd ' + share.dst + ' && npm install --production';

        cmd = 'echo "' + cmd + '"';

        action.local(cmd, function (ret) {
            if (ret === 0) {
                action.success('Dependencies installed');
                complete();
            } else {
                action.error('Failed to install dependencies');
                fail();
            }
        });

    }, true);

    desc('Build project with Jake');
    task('jake', [ ], function () {

        var cmd = 'cd ' + share.dst + ' && jake install';

        action.local(cmd, function (ret) {
            if (ret === 0) {
                action.success('Jake build complete');
                complete();
            } else {
                action.error('Failed to build with jake. Does the target Jakefile[.js] have an "install" task?');
                fail();
            }
        });

    }, true);

    desc('Checkout project');
    task('checkout', [ 'launch:clone' ], function() {

        /* This step could be made more efficient by keeping a single copy of
         * the repository, checking out the required version, then exporting to
         * the directory with 'git checkout-index'. For now, clone the entire
         * repo and checkout to the required revision. */

        var cmd_checkout = '';

        cmd_checkout += 'git --git-dir="' + share.dst + '/.git"';
        cmd_checkout += ' --work-tree="' + share.dst + '"';
        cmd_checkout += " checkout";

        action.local(cmd_checkout, function(ret) {
            if (ret == 0 ) {
                action.success("Checkout successful.");
                complete();
            } else {
                action.error("Could not checkout " + share.rev);
                fail();
            }
        });
    }, true);

    desc('Clone project');
    task('clone', [ 'launch:validate' ], function() {

        var cmd_rm = "rm -rf " + share.dst;
        var cmd_clone = "git clone " + share.repo  + " " + share.dst;

        action.local(cmd_rm, function(ret) {
            if (ret == 0) {
                action.local(cmd_clone, function(ret) {
                    if (ret == 0) {
                        action.success("Clone successful.");
                        complete();
                    } else {
                        action.error("Could not clone repository.");
                        fail();
                    }
                });
            } else {
                action.error("Could not remove " + share.dst);
                fail();
            }
        });
    }, true);

    desc('Validate parameters');
    task('validate', [ ], function() {

        /*  Parameters for the operation are read from the command line (read,
         *  branch, rep, dir). */
        if (!process.env.rev) {
            action.error('Git revision not specified (rev=xxxx).');
            fail();
        } else if (!process.env.branch) {
            action.error('Git branch not specified (branch=xxxx).');
            fail();
        } else if (!process.env.repo) {
            action.error('Git source repository not specified (repo=xxxx).');
            fail();
        } else if (!process.env.dir) {
            action.error('Destination directory not specified (dir=xxxx).');
            fail();
        } else {
            share.branch = process.env.branch;
            share.rev = process.env.rev;
            share.repo = process.env.repo;
            share.dir = process.env.dir;
            share.dst = share.dir + "/." + share.rev;
            share.ln = share.dir + "/" + share.branch;
            action.success("Command line parameters valid.");
            complete();
        }

    }, true);
};
