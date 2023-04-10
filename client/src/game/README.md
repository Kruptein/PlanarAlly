# The game code

The main game code consists of 3 logical pieces.

-   dom: everything that needs access to the DOM, this is pretty much everything UI related
-   webworker: code that runs in a webworker context
-   core: code that does not depend on either dom or webworker

The goal is to have most critical render code to run in its own webworker.
We want to fallback to main-thread rendering if webworkers (or offscreencanvas) are not supported.
This means that unless we want to have a lot of code duplication, we need to make sure that the core logic does not depend on the dom, so that it can be called in a webworker, nor that it depends on things that are only available in a webworker.

The main codebase runs in a DOM context as this is a (vue) web application.
The core and webworker folders have their own tsconfig file to make sure we catch errors.

It should be assumed that all code in core is either run on the main thread OR on a webworker, but not exist in both at the same time.
