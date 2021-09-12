#!/usr/bin/env python3

from collections import namedtuple, OrderedDict
import tempfile
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

def pack_images(img_list):
    """Pack the list of PIL images into a new image, being somewhat space
    efficient. This returns the new image, and a list of locations."""
    # TODO - this is not space efficient
    pad = 1
    w = max(img.size[0] for img in img_list) + 2*pad
    h = pad
    for img in img_list:
        h += img.size[1]+pad
    h += pad

    pos_list = []
    dest_img = PIL.Image.new("RGBA", (w, h))
    x = 1
    y = 1
    for img in img_list:
        dest_img.paste(img, (x, y))
        pos_list.append((x, y, img.size[0], img.size[1]))
        y += img.size[1] + pad

    return (dest_img, pos_list)

def build_scene(src, dest):
    scene_info = extract_level_info(src)
    scene_info["layers"] = []

    # Load the scene logic file
    #logic = open(os.path.splitext(src)[0] + ".js", "r").read()
    #scene_info["logic"] = logic.replace("\n", " ")

    img_list = []
    img_names = []
    current = None
    layers = extract_layer_info(xcf_path)
    layer_num = 0
    object_num = 1
    for layer in reversed(layers):
        if (layer.name.startswith(">")):
            # Object belonging to the current layer
            #fname = "layer%d-%d.png" % (layer_num, object_num)
            layer_info["sprites"].append(
                OrderedDict((
                    ("name", layer.name[1:]),
                    #("src", fname),
                    ("x", layer.x),
                    ("y", layer.y)
                ))
            )
            img_names.append(layer.name[1:])
        else:
            layer_num += 1
            #fname = "layer%d.png" % layer_num
            object_num = 1
            current = layer
            layer_info = OrderedDict((
                ("name", layer.name),
                #("background", fname),
                ("sprites", []),
            ))
            scene_info["layers"].append(layer_info)
            img_names.append(layer.name)

        with tempfile.NamedTemporaryFile(suffix=".png") as tmpfile:
            #full_dest = os.path.join(dest, fname)
            extract_xcf_to_png(xcf_path, tmpfile.name, layer.name)
            #print(layer.name)
            img = PIL.Image.open(tmpfile.name)
            img = img.crop(
                (layer.x, layer.y, layer.x+layer.w, layer.y+layer.h))

            img_list.append(img)

    # Write the packed sprite file
    destname = "sprites.png"
    (dest_img, pos_list) = pack_images(img_list)
    dest_img.save(os.path.join(dest, destname))

    frames = {}
    for (name, (x, y, w, h)) in zip(img_names, pos_list):
        frames[name] = {
            "frame" : {"x" : x, "y" : y, "w" : w, "h" : h},
            "rotated" : False,
            "trimmed" : False,
            "spriteSourceSize" : {"x" : 0, "y" : 0, "w" : w, "h" : h},
            "sourceSize" : {"w" : w, "h" : h}
        }

    # Write out the json file describing the sprite file structure
    json_data = {
        "frames" : frames,
        "meta" : {
            "app" : "makescene.py conversion",
            "version" : "1",
            "image" : destname,
            "format" : "RGBA8888",
            "size" : {"W" : dest_img.size[0], "h" : dest_img.size[1]},
            "scale" : "1"
        }
    }
    fd = open(os.path.join(dest, "sprites.json"), "w")
    fd.write(json.dumps(json_data, indent=4, sort_keys=True))
    fd.close()

    # Now write out the scene meta data
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
