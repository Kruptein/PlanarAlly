.. _lighting:

Lighting and Shadows
=====================

*This is an advanced topic mostly relevant for the DM*

PlanarAlly offers a variety of options for lighting.
Depending on your needs, a very simple lighting system can be used or
a dynamic system where vision of individual tokens plays an important role.

There are 2 DM settings that influence the lighting system for all players.

* Fill canvas with FOW
* LoS based lighting

There is also the draw tool which has two special draw modes related to lighting.

We'll start of with the basics and slowly add complexity throughout this document.
It's assumed for now that both DM settings are unchecked.

Default settings: No shadows
-----------------------------

The default settings make everything on the board (except the DM layer ofcourse) visible to all players.
This could be the desired set-up for a scenario that is entirely outside in broad daylight.

Adding lights to assets is something that is not super usefull in this case,
unless one of the characters has a bright red glowing globe for example.

Hiding/Showing areas
----------------------

When everything is visible to our players, we lose out on some potentially interesting encounters.

A quick way to hide or show areas is by drawing in the reveal or hide mode of the draw tool.
This can be used from any layer and will create special shapes that either absolutely obscure or reveal something.
These special shapes are always added to the fow layer no matter from which layer the action is done.
So if you mess something up or want to adjust something, you can go to the fow layer and play with the shapes as desired.

.. important::
    The shadows created by this tool are absolute and cannot be pierced by light,
    Only use them when something must remain secret at all costs.

.. tip::
    When projecting your battlemap on a table where you use physical tokens,
    an easy way to follow the progress of your players is by using the freehand
    draw shape with the hide/reveal mode.

Filling the board with fog
----------------------------

A more realistic system can be created by checking the DM option 'fill canvas with FOW'.
This will fill the entire screen with fog.

You can now start adding light sources to shapes and these will perce the fog.
When you move a shape with a lightsource, the light aura will follow the shape and
fog will fill in where the shape left as one expects.

.. note::
    Every player can choose the colour of the fog for its session,
    the DM can additionally change his/her fog opacity to see what's
    lurking in the shadows.

Emulating daylight
~~~~~~~~~~~~~~~~~~~

While being very handy for night scenario's, the global fog can seem a problem
when running a daylight based encounter.

One solution involves using the 'reveal' mode of the draw tool, to make large areas visible at all times.
Another approach, which is advised, is to use the LoS based vision system as explained below.

Obstacles
----------



Line of Sight based vision
---------------------------

The most advanced lighting system is the line of sight (LoS) approach.
When the DM enables this option, vision will be limited to that what each character can see.

.. important::
    This option will only provide vision to those assets that are explicitly marked as 'is a Token'.

    MAKE SURE ALL YOUR PLAYER TOKENS ARE MARKED AS SUCH.

    It's generally advised to only mark player controlled assets as tokens to reduce 
    the lighting draw time. *(although this only really has an impact when the amount
    of tokens dramatically increases)*

The combination of fog and LoS vision, creates the interesting dynamic that different players
see different things on their screen.  This can greatly increse immersion and encourage
rollplay.

Emulating day / night
~~~~~~~~~~~~~~~~~~~~

.. note::
    Currently this option requires the 'fill canvas with FOW' to be active as well.
    Work is being done to make it also work in daylight scenario's as described below.

Just as without the LoS based vision, the 'fill canvas with fow' option essentially acts as a
day/night toggle.

Night based encounters work automatically with the LoS system, daylight encounters also fill the
entire screen with fog, but apply a hidden aura to each token that emulates the sun light.
The range of this sight is by default 600ft.
