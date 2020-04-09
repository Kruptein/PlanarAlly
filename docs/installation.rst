.. _installation:

Installation
=============

As the DM you'll have to decide where you want to host your game.
You can either use some service that hosts PlanarAlly for you,
or you can host PA yourself.

.. note::
    This only has to be done by the DM and is not relevant for normal players.


Using existing services
~~~~~~~~~~~~~~~~~~~~~~~~

.. warning::
    These services are not controlled by me and there is no guarantee that the
    software has not been altered.  Make sure you trust a service before using it.

The easiest setup is to use some existing online service.
At the moment of writing the only active service I'm aware of is `dndbox <https://planarally.dndbox.com>`_.

Using this method, gives you an instantly available service that requires no installation on your behalf.
The downside of this method is that you completely rely on the service and you cannot use it to play offline.

Self-hosting
~~~~~~~~~~~~~

Hosting PlanarAlly yourself requires a bit more setup
then simply using an existing service,
but it does give you more control and
you can rely on it working offline as well.

Self-hosting involves 2 steps:

* Installing/running the software,
* Configuring your network correctly so that other players can join.

.. warning::
    If you ever want to upgrade PA to a newer version, be sure to read the remarks in :ref:`upgrading`.

Installation
*************

For installation you again have two options:

* Precompiled binary
* Running through Docker with precompiled images
* Compiling through Docker
* Manual installation

The precompiled binary is the go-to method if you're not super techsavy and if you use Windows.
In all other circumstances, you'll have to manually install PlanarAlly.

Precompiled binary
^^^^^^^^^^^^^^^^^^^^

The binaries are created for each release, which can be found `here <https://github.com/Kruptein/PlanarAlly/releases/>`_.

1. Download the latest planarally-windows.zip
2. Extract it to a folder on your server.
3. Run the server by executing `PlanarAllyServer.exe`.
4. Optionally you can configure the server in the `server_config.cfg` file.
5. Restart the server after applying a change.

Running through Docker with precompiled images
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Docker is a system to run programs in isolated environments,
similar to virtual machines. It has the benefits that all
other requirements are handled by docker without affecting the host machine

Make sure you have a valid Docker installation with docker-compose.
See :ref:`docker` if you don't know how.

1. Create a folder for the files
2. Inside that folder, create a file called docker-compose.yml with the following content::

    version: "3.3"
    services:
      planarally:
        image: 'kruptein/planarally'
        container_name: planarally
        ports:
        - 8000:8000
        volumes:
        - 'data:/planarally/data'
        - 'assets:/planarally/static/assets'
        restart: always
    volumes:
      data:
      assets:

3. From a command line in the created folder, run `docker-compose up -d`

The server will keep running in the background, reloading after resets
To stop the server, run `docker-compose down`

Compiling through Docker
^^^^^^^^^^^^^^^^^^^^^^^^
Same as the last option, but compiling the image
directly instead using the precompiled one

Make sure you have a valid Docker installation with docker-compose
(usually installed separately).
See :ref:`docker` if you don't know how.

1. Download the latest source code from `here <https://github.com/Kruptein/PlanarAlly/releases/>`_. and open it.
2. Run `docker build -t planarally .`
3. Run the newly compiled image with the same instructions as above, but removing the `kruptein/` from the `image` line (the whole line should end up as `image: 'planarally'`)

.. note::
    Although it is not necessary, it is recomended that the folder for the `docker-compose.yml` file is independent from the source folder.

Manual Installation
^^^^^^^^^^^^^^^^^^^^^

Make sure you have a valid python 3.6+ installation.
See :ref:`python` if you don't know how.

1. Download the latest source code from `here <https://github.com/Kruptein/PlanarAlly/releases/>`_.
2. Open the client folder.
3. Execute `npm install`.
4. Execute `npm run build`.
5. Return to the PlanarAlly folder and open the server folder.
6. Execute `pip install -r requirements.txt`.
7. Run the server by executing `python planarserver.py`.
8. Optionally you can configure the server in the `server_config.cfg` file.
9. Restart the server after applying a change.

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

In folder "extra", you can find example systemd.service and nginx server configuration.

.. _python:

Python installation
~~~~~~~~~~~~~~~~~~~~~

Installation of python is very straightforward.

Download and install the latest python 3 version from `the python site <https://www.python.org/downloads/>`_.

.. note::
    If you use linux, you can probably install python using your system package manager.

Make sure to note where you install python as you will need it later on.


.. _docker:

Docker installation
~~~~~~~~~~~~~~~~~~~~

To install docker, follow the official instructions:

* `Windows <https://docs.docker.com/docker-for-windows/install/>`_ (installation consists in downloading and running the `installer <https://hub.docker.com/editions/community/docker-ce-desktop-windows>`_)
* `MacOs <https://docs.docker.com/docker-for-mac/install/>`_ (installation consists in downloading and running the `installer <https://hub.docker.com/editions/community/docker-ce-desktop-mac>`_)
* Linux (Instructions are available for `Ubuntu <https://docs.docker.com/install/linux/docker-ce/ubuntu/>`_, `Debian <https://docs.docker.com/install/linux/docker-ce/debian/>`_, `CentOS <https://docs.docker.com/install/linux/docker-ce/centos/>`_, `Fedora <https://docs.docker.com/install/linux/docker-ce/fedora/>`_)

.. note::
    If you use linux, you will need to install `docker-compose <https://docs.docker.com/compose/install/>`_ separately.
    
    You will probably want to run the `Linux post-installation steps <https://docs.docker.com/install/linux/linux-postinstall/>`_


.. _upgrading:

Upgrading
~~~~~~~~~~

When upgrading to a newer version of PlanarAlly, the necessary care has to be taken to make sure your existing data is not lost.

It's strongly advised to make a backup of the following data before performing an upgrade

Upgrading with precompiled or manual installation
*************************************************

To backup the data, make copies to another folder of the following files/folders:

* planar.sqlite: This is the database that contains all the saved sessions and user information.
* static/assets: This folder contains all the uploaded images for tokens/maps/... during gameplay.

When backed up, you should be able to safely overwrite any of the original PlanarAlly files
with the newer files from the version you want to upgrade to.

If you are running a manual installation, run `pip install -r requirements.txt` again in case the requirements have changed.

If the data is lost or not there after upgrading, copy the earlier backed up files to their original location.

Upgrading with docker
*********************

Upgrading with Docker is much safer, but it's still recommended to make backups.

The backup from docker can be created with:

* planar.sqlite: `docker cp planarally:/planarally/data ./data`
* static/assets: `docker cp planarally:/planarally/static/assets ./assets`

If you compiled the image yourself, you will have to recompile it, and tell docker to use the new image by running `docker-compose up -d` again.

If you are running the precompiled image, just run `docker-compose pull && docker-compose up -d` in the folder with the original `docker-compose.yml` file.

If the data is lost, you can restore it by running the previous commands with the arguments swapped:

* planar.sqlite: `docker cp ./data planarally:/planarally/data`
* static/assets: `docker cp ./assets planarally:/planarally/static/assets`
