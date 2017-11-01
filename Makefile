# Makefile

BUNDLE=demoquest
SCENES=intro road cave building closet darkroad

MAKE_SCENES=$(patsubst %,media/scenes/%/scene.json,$(SCENES))
SCENE_TARGETS = $(call MAKE_SCENES)

.PHONY: dist watch

all: $(SCENE_TARGETS)

media/scenes/index.json: $(SCENE_TARGETS)
	@echo BUILDING: scene index
	@./tools/makeindex.py > $@

# Scene generation
media/scenes/%/scene.json: rawmedia/%.xcf
	@echo BUILDING: $@
	@mkdir `dirname $@` 2> /dev/null || true
	@./tools/makescene.py $< `dirname $@`

watch:
	watchify -v -t babelify -s $(BUNDLE) main.js -o $(BUNDLE).js

dist:
	test -d dist || mkdir dist 2> /dev/null
	uglifyjs $(BUNDLE).js > dist/$(BUNDLE)-dist.js
	cp page.js style.css *.md dist
	cp -R contrib dist
	cp -R media dist
	cat index.html | sed 's/demoquest.js/demoquest-dist.js/' > dist/index.html
	@echo ""
	@echo "*** Distribution files stored in 'dist' ***"
