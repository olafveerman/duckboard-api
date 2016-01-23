'use strict';

var Hapi = require('hapi');
var Boom = require('boom');
var req = require('request');
var Good = require('good');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

// TODO:
// - Is console.error the most elegant way to report first errors? Can't be returned to good?

var server = new Hapi.Server(+process.env.PORT, '0.0.0.0');

var parseStatus = function (data) {
  // If we can parse a GH state, return a state ID
  // Otherwise return null
  var state;
  switch (data.state) {
    case 'success':
      state = 1;
      break;
    case 'pending':
      state = 2;
      break;
    case 'failure':
      state = 3;
      break;
    case 'error':
      state = 99;
      break;
  }
  return state;
};

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    try {
      // Load the config every time, so changes are picked up on the fly
      var repoConfig = fs.readFileSync('./repos.json');
    } catch (e) {
      var err = 'Can\'t find repos.json. Make sure there is one.';
      return reply(Boom.badImplementation(err));
    }
    try {
      var repos = JSON.parse(repoConfig);
    } catch (e) {
      err = 'repos.json is not a valid JSON.';
      return reply(Boom.badImplementation(err));
    }

    var tasks = [];
    var token = 'token ' + process.env.GH_TOKEN;

    _.forEach(repos, function (r) {
      var task = function (cb) {
        // Branch defaults to master if none is defined.
        var branch = (r.branch || 'master');

        var options = {
          url: 'https://api.github.com/repos/' + r.repo + '/commits/' + branch + '/status',
          method: 'GET',
          headers: {
            'User-Agent': 'node.js',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': token
          }
        };

        req(options, function (err, res, body) {
          body = JSON.parse(body);
          var error;

          // Turn the Github error code into something more meaningful.
          if (res.statusCode === 401) {
            // This leads to a single 500 error.
            error = 'Can\'t authenticate. Are you using a valid GH token?';
            return cb(error);
            // return reply(Boom.badImplementation(err));
          } else if (res.statusCode === 404) {
            // This shouldn't lead to an error on the API side. It will just return null
            error = 'Can\'t access the \'' + branch + '\' branch of ' + r.repo + '. Either the branch or repo doesn\'t exist, or the app doesn\'t have the right access token.';
          }

          if (err || res.statusCode !== 200) {
            console.error(error || err || res);
          }

          var repoState = parseStatus(body);
          cb(null, repoState);
        });
      };

      tasks.push(task);
    });

    async.parallel(tasks, function (err, results) {
      if (err) {
        reply(Boom.badImplementation(err));
      } else {
        reply(null, results);
      }
    });
  }
});

server.register({
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, (err) => {
  if (err) {
    throw err; // something bad happened loading the plugin
  }

  server.start(() => {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
});
