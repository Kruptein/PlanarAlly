# Development Info

PlanarAlly consists of a client and a server component. If you want to run a development setup you'll need to install both components.

**Note:** This is only necessary if you want to make changes to the actual codebase. To simply use PA, follow the install instructions in the docs (the url can be found in the readme).

## Git usage

This project uses the gitflow branching strategy. This means that the master branch is intended for releases only. All pull requests should be done on the development branch.

### Format & Lint

All code is required to be formatted and linted before it can be merged. To format and lint the server you need to run

```bash
uv run ruff format src
uv run ruff check src
```
To format and lint the client code you need to run

```bash
npm run format
npm run lint
```

## Server

All code of the server is located in the `server` folder at the root level of the git repository.
The server infrastructure runs on aiohttp, a python async webframework.
Install python >=3.6 (a virtual environment is recommended) and install all the dependencies.

### Install & Setup

This project uses uv to manage its dependencies and run the server so to begin you will need to install UV from its official site. UV will automatically create the virtual environment so you only need to run the application to get going. Optionally you can run `uv sync` in the server directory to install the dependencies.

> This project uses Python 3 so ensure that python and UV are running with the correct version.

You can create a config.toml in the server/data directory to change settings. You can find the configuration values at the [PlanarAlly Site](https://www.planarally.io/server/management/configuration/)

You can change the host & port configuration in the config.toml to adjust for your application needs. For example

```toml
[webserver.connection]
type = "hostport"
host = "0.0.0.0"
port = 8000
```

### Running the server

You can run the server in either development or production mode. In development mode, requests are redirected to the Vite server, enabling real-time updates while building the client application. In production mode, the server instead serves the static assets generated from the client build.

#### Production

The command will start the server in production mode. This expects build js artifacts to be created and available to the server. (These can be created by building a production version of the client).

```bash
uv run planarserver.py
```

#### Development

To use the server together with a development version of the client instead use:

`uv run planarserver.py dev`

You will need to then start the client app. Then you will want to launch your browser at the host & port for the PA server (**not the client**). By default that will be: http://localhost:8000

## Client

The client is written in typescript, editing the javascript file directly is strongly discouraged and any pull request that only changes the js file will also be declined. 

Ensure you have the correct version of NPM installed (typically latest LTS). You can verify that by checking in the github actions [pull_request.yaml](.github/workflows/pull_request.yaml#65) To get the client side up and running you'll need to install the dependencies with

`npm i`

To build a production version use:

`npm run build`

To build a development version use:

`npm run dev`

### Target version

As mentioned in the client and server steps, there's a difference between the development version and the production version. Make sure that you use the same target for both environments when building.

### The result

To actually view and interact with the client app regardless of if you use the development or the production version. You will need to browse to your localhost at port 8000 (by default).

# Translation

PlanarAlly is currently using [vue-18n](https://github.com/kazupon/vue-i18n) to implement internationalization. Thus, we'll need to translate `LOCALE.json`, and put it into `client/src/locales` to enable the language selection.

**Note:** Installing the client component is only necessary if you want to generate an i18n report and check missing keys or unused translations.

## Adding a new language

The most convenient way is to copy `en.json` and rename it to the locale you want to contribute, such as `zh.json` for Chinese, `ja.json` for Japanese.

And then you'll need to check the new file and translate it into the language by replacing the English value while keeping the key:

```js
{
    ...
    "common": {
        "server_ver_prefix": "Server version:"
    }
    ...
    --> after translation -->
    "common": {
        "server_ver_prefix": "サーバーのバージョン："
    }
}
```

## Changing UI and adding keys

If you contribute to the codebase and change UI by adding strings, modifying existing strings, etc., you may need to make it i18n safe.

### Adding keys

There are two kinds of method to call i18n translation: `$t("key")` and `v-t="'key'"`.

`$t()` is an extended method for Vue

```
# To use it in html block:

<p>{{ $t("dir.sub_dir.file.key") }}</p>

# To use it in code block:

this.$t("dir.sub_dir.file.another_key").toString()
```

### Finding missing keys

PlanarAlly integrates [vue-i18n-plugin](https://github.com/intlify/vue-i18n-extensions) to provide i18n report.

To get missing keys and unused translations:

`npm run i18n:report`

To get the output file of the report:

`npm run i18n:report -- --output 'path/to/output.json'`

### Naming conventions of keys

PlanarAlly is using named formatting, and the keys are case-sensitive. The translation files are structured as below:

```json
{
    "common": {
        "server_ver_prefix": "..."
    },
    "game": {
        "ui": {
            "floors": {
                "new_name": "..."
            }
        }
    }
}
```

`Common` is for the common strings across all Vue files, and for other strings, please follow the rule:

`$Dir$_$Subdir$..._$File$_$key$_$ARGS$...`

To provide the JSON above, the two keys would be:

`common.server_ver_prefix`

and

`game.ui.floors.new_name`

You can also read [vue-i18n documents](https://kazupon.github.io/vue-i18n) for more details.
