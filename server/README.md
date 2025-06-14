# server

The PlanarAlly server is a python codebase.

We use UV for package management, for install instructions [see UV docs](https://docs.astral.sh/uv/getting-started/installation/).

If you want to use other solutions (e.g. pip, poetry, ...) check the `pyproject.toml` file to find out which dependencies are needed.

## Setup

### Python version

Older python versions may work, but PA generally tries to stay up to date with the latest python version.

Ensure the correct python version is set up:

`uv python install 3.13`

### Virtual environment

It's almost always strongly encouraged to use virtual environments when using python.

`uv venv --python-version=3.13`

The python-version argument is optional, but likely needed if you have multiple different python versions already installed.

### Sync the environment with the dependencies

Installing the actual dependencies to the environment:

`uv sync`

If you're not interested in the development dependencies you can also run

`uv sync --no-group dev`

to only install the required runtime dependencies.

### Running the server

Access the server by going to `http://localhost:8000` (can be modified in the server config)

#### Production mode

`uv run planarally.py`

In production mode the client files are expected to be present in the server folder.

#### Development mode

`uv run planarally.py dev`

In development mode it's expected that a separate client process is running.
Your main interaction is still through the server's port as it will do the client routing behind the scenes.
