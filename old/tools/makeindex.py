#!/usr/bin/env python3

import os
import sys
import json

cwd = os.path.dirname(sys.argv[0])
if cwd:
    os.chdir(cwd)

def get_scenes(basedir):
    for path in os.listdir(basedir):
        if os.path.exists(os.path.join(basedir, path, "scene.json")):
            yield path

if __name__ == '__main__':
    basedir = os.path.join("..", "media", "scenes")
    scenes = list(get_scenes(basedir))
    print(json.dumps(scenes))

