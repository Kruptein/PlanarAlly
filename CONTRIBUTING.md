# Development Info

PlanarAlly consists of a client and a server component. If you want to run a development setup you'll need to install both components.

**Note:** This is only necessary if you want to make changes to the actual codebase. To simply use PA, follow the install instructions in the docs (the url can be found in the readme).

## Git usage

This project uses the gitflow branching strategy. This means that the master branch is intended for releases only. All pull requests should be done on the development branch.

## Server

All code of the server is located in the `server` folder at the root level of the git repository.
The server infrastructure runs on aiohttp, a python async webframework.
Install python >=3.6 (a virtual environment is recommended) and install all the dependencies.

### Example install

Lines 2 and 3 are optional. Replace `python` with `python3` if the default is not py3.

```
cd server
python -m venv env
source env/bin/activate
pip install -r requirements.txt
```

Change the server.cfg file to what you wish to use and you can start the webserver with a simple

`python planarserver.py`

The above command will start the server in production mode. This expects build js artifacts to be created and available to the server. (These can be created by building a production version of the client).
To use the server together with a development version of the client instead use:

`python planarserver.py dev`

## Client

The client is written in typescript, editing the javascript file directly is strongly discouraged and any pull request that only changes the js file will also be declined.

To get the client side up and running you'll need to install the dependencies with

`npm i`

To build a production version use:

`npm run build`

To build a development version use:

`npm run serve`

### Target version

As mentioned in the client and server steps, there's a difference between the development version and the production version. Make sure that you use the same target for both environments when building.

### The result

To actually view and interact with the result whether you use the development or the production version you simply need to browse to your localhost at port 8000 (by default).
