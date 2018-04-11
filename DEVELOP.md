To work on PlanarAlly you'll need to setup a couple of things.

# Backend

The backend/server infrastructure runs on aiohttp a python async webframework.
To get started create a virtual environment with python >= 3.6 and install all required packages.
`pip install -r requirements.txt`

Change the server.cfg file to what you whish to use and you can start the webserver with a simple `python PlanarAlly/planarserver.py`.


# Client

The client side is written in Typescript and uses webpack to bundle files.  You'll need to install nodejs and install the npm dependencies as per devDependencies in package.json.
Make sure your IDE is set to Ecmascript6 as this is the js version we build to.
