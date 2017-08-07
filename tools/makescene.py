#!/usr/bin/env python3

from collections import namedtuple, OrderedDict
import subprocess
import sys
import os
import re
import PIL, PIL.Image
import json

def extract_level_info(src):
    # Extract the comment (contains extra level info)
    proc = subprocess.Popen(["exiftool", "-comment", "-b", src],
                            stdout=subprocess.PIPE)
    (out, err) = proc.communicate()
    info = OrderedDict()
    for line in out.decode("UTF-8").split("\n"):
        (key, value) = line.split(":")
        info[key.strip()] = value.strip()
    return info

def extract_layer_info(src):
    """Returns a list of layers found in the XCF file"""
    proc = subprocess.Popen(["xcfinfo", src], stdout=subprocess.PIPE)
    (out, err) = proc.communicate()
    layers = []
    Layer = namedtuple("layer", ("name", "x", "y", "w", "h"))
    for line in out.decode("UTF-8").split("\n"):
        m = re.match("^\+ (\d+)x(\d+)\+(\d+)\+(\d+) [^ ]* [^ ]* (.+)$", line)
        if (m):
            (w, h, x, y, name) = m.groups()
            layers.append(Layer(name, int(x), int(y), int(w), int(h)))
    return layers

def extract_xcf_to_png(src, dest, layer_name):
    proc = subprocess.Popen(["xcf2png", src, layer_name, "-o", dest])
    proc.wait()

def build_scene(src, dest):
    scene_info = extract_level_info(src)
    scene_info["layers"] = []

    current = None
    layers = extract_layer_info(xcf_path)
    layer_num = 0
    object_num = 1
    for layer in reversed(layers):
        if (layer.name.startswith(">")):
            # Object belonging to the current layer
            fname = "layer%d-%d.png" % (layer_num, object_num)
            layer_info["things"].append(
                OrderedDict((
                    ("name", layer.name[1:]),
                    ("src", fname),
                    ("x", layer.x),
                    ("y", layer.y)
                ))
            )
        else:
            layer_num += 1
            fname = "layer%d.png" % layer_num
            object_num = 1
            current = layer
            layer_info = OrderedDict((
                ("name", layer.name),
                ("background", fname),
                ("things", []),
            ))
            scene_info["layers"].append(layer_info)

        full_dest = os.path.join(dest, fname)
        extract_xcf_to_png(xcf_path, full_dest, layer.name)
        #print(layer.name)

        img = PIL.Image.open(full_dest)
        img = img.crop((layer.x, layer.y, layer.x+layer.w, layer.y+layer.h))
        img.save(full_dest)

    fd = open(os.path.join(dest, "scene.json"), "w")
    fd.write(json.dumps(scene_info, indent=4))
    fd.close()

try:
    xcf_path = sys.argv[1]
    dest = sys.argv[2]
except:
    print("usage: makescene.py path/to/source.xcf dest/")
    sys.exit()

build_scene(xcf_path, dest)
