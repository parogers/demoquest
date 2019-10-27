# Makefile

SCENES=intro road cave building closet darkroad ride ending

MAKE_SCENES=$(patsubst %,media/scenes/%/scene.json,$(SCENES))
SCENE_TARGETS = $(call MAKE_SCENES)

all: $(SCENE_TARGETS)

www/media/scenes/index.json: $(SCENE_TARGETS)
	@echo BUILDING: scene index
	@./tools/makeindex.py > $@

# Scene generation
www/media/scenes/%/scene.json: rawmedia/%.xcf
	@echo BUILDING: $@
	@mkdir `dirname $@` 2> /dev/null || true
	@./tools/makescene.py $< `dirname $@`
