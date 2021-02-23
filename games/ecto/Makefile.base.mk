.DEFAULT_GOAL := help

# -- cosmetics --
rs = \033[0m
ul = \033[4;37m
bd = \033[1;37m
rd = \033[1;31m
gr = \033[0;90m

# -- help --
help:
	@awk "$$HELP" $(MAKEFILE_LIST)
.PHONY: help

define HELP
BEGIN {
	print "$(ul)usage:$(rs)";
	print "  $(bd)make <target>$(rs)\n";
	print "$(ul)targets:$(rs)";
}
/^## (.*)$$/ {
	$$1=""; docs=$$0;
	getline;
	sub(/:/, "", $$1);
	printf "  $(rd)%-$(help-column-width)s$(gr) %s$(rs)\n", $$1, docs;
}
endef
export HELP
