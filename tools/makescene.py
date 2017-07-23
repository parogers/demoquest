#!/usr/bin/env python3

import collections
import subprocess
import sys
import re
import PIL, PIL.Image

def extract_xcf_info(src):
    proc = subprocess.Popen(["xcfinfo", src], stdout=subprocess.PIPE)
    (out, err) = proc.communicate()
    layers = []
    Layer = collections.namedtuple("layer", ("name", "x", "y", "w", "h"))
    for line in out.decode("UTF-8").split("\n"):
        m = re.match("^\+ (\d+)x(\d+)\+(\d+)\+(\d+) [^ ]* [^ ]* (.+)$", line)
        if (m):
            (w, h, x, y, name) = m.groups()
            layers.append(Layer(name, int(x), int(y), int(w), int(h)))
    return layers

def extract_xcf_to_png(src, dest, name):
    proc = subprocess.Popen(["xcf2png", src, name, "-o", dest])
    proc.wait()

path = sys.argv[1]
layers = extract_xcf_info(path)
for (count, layer) in enumerate(reversed(layers)):
    dest = "out%d.png" % (count+1)
    extract_xcf_to_png(path, dest, layer.name)
    img = PIL.Image.open(dest)
    img = img.crop((layer.x, layer.y, layer.w, layer.h))
    img.save(dest)
