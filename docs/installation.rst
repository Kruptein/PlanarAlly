.. _installation:

Installation
=============

As the DM you'll have to decide where you want to host your game.
You can either use some service that hosts PlanarAlly for you,
or you can host PA yourself, which requires a bit more setup.

.. note::
    This only has to be done by the DM and is not relevant for normal players.

Using existing services
~~~~~~~~~~~~~~~~~~~~~~~~

.. warning::
    These services are not controlled by me and there is no guarantee that the
    software has not been altered.  Make sure you trust a service before using it.

The easiest setup is to use some existing online service.
At the moment of writing the only active service I'm aware of is `dndbox <https://planarally.dndbox.com>`_.

Self-hosting
~~~~~~~~~~~~~

Hosting PlanarAlly yourself requires a bit more setup
then simply using an existing service,
but it does give you more control and
you can rely on it working offline as well.

Self-hosting involves 2 steps:

* Installing/running the software,
* Configuring your network correctly so that other players can join.

Installation
*************

For installation you again have two options:

* Precompiled binary
* Manual installtion

The first option is easier, but is only available on Windows currently,
and I do forget to create it from time to time. Feel free to ping me if I do.

Precompiled binary
^^^^^^^^^^^^^^^^^^^^

These are typically only provided for major releases and can be found `here <https://github.com/Kruptein/PlanarAlly/releases/>`_.

1. Download the latest planarserver.zip
2. Extract it to a folder on your server.
3. Run the server by executing `PlanarAllyServer.exe`.
4. Optionally you can configure the server in the `server_config.cfg` file.
5. Restart the server after applying a change.


Manual Installation
^^^^^^^^^^^^^^^^^^^^^

Make sure you have a valid python 3.6+ installation.
See :ref:`python` if you don't know how.

1. Download the latest source code from `here <https://github.com/Kruptein/PlanarAlly/releases/>`_.
2. Open the server folder.
3. Execute `pip install -r requirements.txt`.
4. Run the server by executing `python planarserver.py`.
5. Optionally you can configure the server in the `server_config.cfg` file.
6. Restart the server after applying a change.

Configuring
************

With the server running,
you should now be able to visit `http://localhost:8000 <http://localhost:8000>`_.

If you're players are on a local network,
you'll need to replace the `localhost`
part with your internal ip address.

If you're players are however somewhere else on the internet,
you'll also need to replace the `localhost` part,
but this time with your external ip address.
Additionally you'll probably need to modify your router to allow access from
the outside world on your personal computer on port 8000.
Look up information on `port forwarding` for more info on this topic.


.. _python:

Python installation
~~~~~~~~~~~~~~~~~~~~~

Installation of python is very straightforward.

Download and install the latest python 3 version from `the python site <https://www.python.org/downloads/>`_.

.. note::
    If you use linux, you can probably install python using your system package manager.

Make sure to note where you install python as you will need it later on.

