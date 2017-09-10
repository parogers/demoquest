
SCENES = intro road cave building

MAKE_TARGETS = $(patsubst %,media/scenes/%/scene.json,$(SCENES))

TARGETS = $(call MAKE_TARGETS)

all: $(TARGETS)

media/scenes/%/scene.json: rawmedia/%.xcf
	@echo BUILDING: $@
	@mkdir `dirname $@` 2> /dev/null || true
	@./tools/makescene.py $< `dirname $@`
