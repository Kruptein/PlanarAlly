from aiohttp import web

async def get_version(request: web.Request):
    try:
        with open('VERSION', 'r') as version_file:
            version_data = version_file.read()
    except:
        return web.HTTPError()

    return web.json_response(
        { 
            "version": version_data 
        }
    )
