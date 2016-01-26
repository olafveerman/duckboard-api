# Duckboard API
This API has a single endpoint that returns the Github status of the projects that are configured in `repos.json`. The statuses are returned in the order that they are specified in the `json`.


| API ID | Github status |
| --- | --- |
| 1 | success |
| 2 | pending |
| 3 | failure |
| 99 | error |

When the status of a repo can't be fetched from Github, a `null` is returned. This may be because the repo or branch doesn't exist, or because the Personal Access Token that is used to authenticate doesn't have access to the repo.

## Development environment
To set up the development environment for this website, you'll need to install the following on your system:

- [Node and npm](http://nodejs.org/)

After these basic requirements are met, run the following commands in the website's folder:
```
$ npm install
```

### Getting started

```
$ node index.js
```

Launches the server, making the API available at `http://localhost:3000/`.

To fetch the status of private repositories, set a Personal Access Token of a Github account as environment variable. The account that was used to set up this token, needs to have access to the repos. For example:

```
$ GH_TOKEN=[token] node index.js
```

## License
This software is released into the public domain using the [Unlicense](http://unlicense.org/).