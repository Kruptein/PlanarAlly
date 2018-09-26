# Development Info

To work on PlanarAlly you'll need to setup a couple of things.

**Note:** This is only necessary if you want to make changes to the actual codebase.  To simply use PA, follow the install instructions in the README.

### Git usage

The master branch is intended to be a release branch.  Only merges from the dev branch are allowed into this branch when they are production ready.

If you want to do a pull request do it on the dev branch or any open feature branch, but never on the master branch.

## Backend

The backend/server infrastructure runs on aiohttp, a python async webframework.
To get started create a virtual environment with python >= 3.6 and install all required packages.
`pip install -r requirements.txt`

Change the server.cfg file to what you wish to use and you can start the webserver with a simple `python PlanarAlly/planarserver.py`.


## Client

If you wish to modify any of the client code, you are required to install the client side dev environment.  Editing the javascript file directly is strongly discouraged and any pull request that only changes the js file will also be denied.

The client side is written in Typescript and uses webpack to bundle files.  You'll need to install nodejs and install the npm dependencies as per devDependencies in package.json with `npm i`.
To build the javascript file use `npm run build`.  This file is automatically placed in the correct folder by webpack.

Make sure your IDE is set to Ecmascript6 as this is the js version we build to.
