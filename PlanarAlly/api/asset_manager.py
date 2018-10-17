import functools
import hashlib

import auth
from app import sio, app, FILE_DIR, logger

ASSETS_DIR = FILE_DIR / "static" / "assets"
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir()


@sio.on('Asset.Upload', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_upload(sid, file_data):
    filename = file_data['name']
    uuid = file_data['uuid']

    global PENDING_FILE_UPLOAD_CACHE
    if uuid not in PENDING_FILE_UPLOAD_CACHE:
        PENDING_FILE_UPLOAD_CACHE[uuid] = {}
    PENDING_FILE_UPLOAD_CACHE[uuid][file_data['slice']] = file_data
    if len(PENDING_FILE_UPLOAD_CACHE[uuid]) != file_data['totalSlices']:
        # wait for the rest of the slices
        return

    # All slices are present
    data = b''
    for slice in range(file_data['totalSlices']):
        data += PENDING_FILE_UPLOAD_CACHE[uuid][slice]['data']

    sha1 = hashlib.sha1()
    sh = hashlib.sha1(data)
    hashname = sh.hexdigest()

    if not (ASSETS_DIR / hashname).exists():
        with open(ASSETS_DIR / hashname, "wb") as f:
            f.write(data)

    del PENDING_FILE_UPLOAD_CACHE[uuid]

    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    folder = functools.reduce(dict.get, file_data['directory'], user.asset_info)
    if folder is None:
        logger.warning(f"Directory structure {file_data['directory']} is not valid for {user.name}")
        return

    file_info = {'name': file_data['name'], 'hash': hashname}
    if '__files' not in folder:
        folder['__files'] = []
    folder['__files'].append(file_info)

    policy.save()

    await sio.emit("Asset.Upload.Finish", {"fileInfo": file_info, "directory": file_data['directory']}, room=sid,
                   namespace='/pa_assetmgmt')


@sio.on('Asset.Directory.New', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_mkdir(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    folder[data['name']] = {'__files': []}
    policy.save()


@sio.on('Asset.Rename', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_rename(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['isFolder']:
        folder[data['newName']] = folder[data['oldName']]
        del folder[data['oldName']]
    else:
        for fl in folder['__files']:
            if fl['name'] == data['oldName']:
                fl['name'] = data['newName']
    policy.save()


@sio.on("Inode.Move", namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_mv(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['target'] == '..':
        target_directory = data['directory'][:-1]
    else:
        target_directory = data['directory'] + [data['target']]
    target_folder = functools.reduce(dict.get, target_directory, user.asset_info)
    name = data['inode'] if data['isFolder'] else data['inode']['name']
    if data['isFolder']:
        target_folder[name] = folder[name]
        del folder[name]
    else:
        if not target_folder['__files']:
            target_folder['__files'] = []
        target_folder['__files'].append(data['inode'])
        folder['__files'] = [fl for fl in folder['__files'] if fl['hash'] != data['inode']['hash']]
    policy.save()


@sio.on('Asset.Remove', namespace='/pa_assetmgmt')
@auth.login_required(app, sio)
async def assetmgmt_rm(sid, data):
    policy = app['AuthzPolicy']
    user = policy.sid_map[sid]['user']
    folder = functools.reduce(dict.get, data['directory'], user.asset_info)
    if data['isFolder'] and data['name'] in folder:
        del folder[data['name']]
    else:
        index = next((i for i, fl in enumerate(folder['__files']) if fl['name'] == data['name']), None)
        if index is not None:
            folder['__files'].pop(index);
    policy.save()