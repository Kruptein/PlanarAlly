# -*- mode: python -*-
import os
import sys
from pathlib import Path

pa_dir = Path(SPECPATH).resolve()


def _(arg):
    return pa_dir / arg


block_cipher = None


a = Analysis([_('planarserver.py')],
             pathex=[pa_dir],
             datas=[
    (_('VERSION'), '.'),
    (_('server_config.cfg'), '.'),
    (_('static'), 'static'),
    (_('templates'), 'templates'),
],
    hiddenimports=['engineio.async_drivers.aiohttp'],
    hookspath=None,
    runtime_hooks=None,
    excludes=None,
    cipher=block_cipher)
pyz = PYZ(a.pure,
          cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='PlanarAllyServer.exe',
          debug=False,
          strip=None,
          upx=True,
          console=True,
          icon='./static/favicon.ico')
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='planarserver')
