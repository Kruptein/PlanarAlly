.. _upgrading:

Upgrading
==========

This document will show you how to upgrade to a newer version of PlanarAlly.

When a new version is released, make sure to read the information in the release notes in case anything extra has to be done for that release.

Upgrading a release >= 0.11.0
-------------------------------

Since release 0.11.0 a new save format is in use, which among other benefits also makes upgrading much easier.

1. Backup important files
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A first step when upgrading a PlanarAlly installation is always to backup your current save and assets.

Your save file is by default called `planar.sqlite` and is located in the `PlanarAlly` folder.
If you've modified your server config (server_config.cfg) to use a different save file, you should back that one up.

Assets uploaded to your server are not stored in the same save file, but are instead stored in a special folder that can be found in `PlanarAlly/static/assets/`.

Optionally you can also backup your server_config.cfg file in the PlanarAlly folder if you modified it.
This is especially important as this file will almost definitely be overwritten when downloading a new release,
whereas the other files mentioned should not change.

2. Download the new version
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Zip/tar download**
Releases are always published on github (https://github.com/Kruptein/PlanarAlly/releases).
On this page you have the option to download the source code as a zip or as a tar.gz.
Under normal circumstances another zip file called 'planarserver.zip' should also be present,
this is a version of PlanarAlly that is compiled as a Windowds binary.

If you used any of the aforementioned files to install PlanarAlly, you should be able to safely download the new version and extract it to the same folder as your current installation.

If you made changes to your server_config before upgrading, make sure to reapply those changes.

**Git**
If you installed PlanarAlly using git, you should be able to simply pull the changes.

3. 