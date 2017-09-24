# Makefile

BUNDLE=demoquest
BUNDLE_DIST=demoquest-dist.js
BUNDLE_JS=demoquest.js

SCENES=intro road cave building closet

MAKE_SCENES=$(patsubst %,media/scenes/%/scene.json,$(SCENES))
SCENE_TARGETS = $(call MAKE_TARGETS)

all: $(SCENE_TARGETS) $(BUNDLE_DIST)

# Scene generation
media/scenes/%/scene.json: rawmedia/%.xcf
	@echo BUILDING: $@
	@mkdir `dirname $@` 2> /dev/null || true
	@./tools/makescene.py $< `dirname $@`

# Source generation
$(BUNDLE_JS): main.js
	browserify -t babelify -s $(BUNDLE) main.js -o $(BUNDLE_JS)

$(BUNDLE_DIST): $(BUNDLE_JS)
	uglifyjs $(BUNDLE_JS) > $(BUNDLE_DIST)

watch:
	watchify -v -t babelify -s $(BUNDLE) main.js -o $(BUNDLE_JS)
