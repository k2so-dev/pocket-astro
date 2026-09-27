SHELL := /bin/bash

_PROJECT_ENV = $(shell grep -s '^PROJECT_NAME' .env | cut -d= -f2 | xargs)
PROJECT      = $(if $(_PROJECT_ENV),$(_PROJECT_ENV),$(shell basename $$PWD))
PB_PORT      = $(shell grep -s '^PB_PORT' .env | cut -d= -f2 | xargs | grep . || echo 8090)
ASTRO_PORT   = $(shell grep -s '^ASTRO_PORT' .env | cut -d= -f2 | xargs | grep . || echo 4321)
DOMAIN       = $(shell grep -s '^DOMAIN' .env | cut -d= -f2 | xargs)

COMPOSE      = docker compose -p $(PROJECT)
COMPOSE_PROD = $(COMPOSE) -f compose.yml -f compose.caddy.yml
RUN          = $(COMPOSE) --profile dev run --rm --no-deps dev
PB_EXEC      = $(COMPOSE) exec pocketbase pocketbase
PB_FLAGS     = --dir /pb_data --hooksDir /pb_hooks --migrationsDir /pb_migrations --encryptionEnv ENCRYPTION

C_GRN = \033[0;32m
C_CYN = \033[0;36m
C_RED = \033[0;31m
C_YLW = \033[1;33m
C_DIM = \033[2m
C_RST = \033[0m

ARGS = $(filter-out $@,$(MAKECMDGOALS))
%:
	@:

.DEFAULT_GOAL := help

.PHONY: init dev up down restart logs ps sh build deploy admin migrate pocketbase bun bunx astro shadcn biome check types swap upgrade status help

init:
	@if [ -f .env ]; then printf "$(C_YLW).env already exists$(C_RST)\n"; exit 0; fi; \
	cp .env.example .env; \
	sed -i -e "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$$(openssl rand -hex 16)|" -e "s|^PROJECT_NAME=.*|PROJECT_NAME=$$(basename $$PWD)|" .env; \
	printf "$(C_GRN).env created$(C_RST)\n"

dev:
	@$(COMPOSE) up -d pocketbase
	@$(COMPOSE) --profile dev run --rm --service-ports dev

up:
	@$(COMPOSE) up -d --build $(ARGS)

down:
	@$(COMPOSE_PROD) --profile dev down $(ARGS)

restart:
	@$(COMPOSE) restart $(ARGS)

logs:
	@$(COMPOSE_PROD) logs -f $(ARGS)

ps:
	@$(COMPOSE_PROD) ps

sh:
	@$(COMPOSE) exec $(or $(ARGS),pocketbase) sh

build:
	@$(COMPOSE) build astro

deploy:
	@if [ -z "$(DOMAIN)" ]; then printf "$(C_RED)Set DOMAIN and ACME_EMAIL in .env$(C_RST)\n"; exit 1; fi
	@git pull --ff-only
	@$(COMPOSE_PROD) up -d --build --remove-orphans
	@docker image prune -f >/dev/null
	@printf "$(C_GRN)Deployed → https://$(DOMAIN)$(C_RST)\n"

admin:
	@read -rp "Admin email: " EMAIL; \
	read -rsp "Admin password (min 10 chars): " PASS; echo; \
	$(PB_EXEC) superuser upsert "$$EMAIL" "$$PASS" $(PB_FLAGS)

migrate:
	@$(PB_EXEC) migrate $(ARGS) $(PB_FLAGS)

pocketbase:
	@$(PB_EXEC) $(ARGS) $(PB_FLAGS)

bun:
	@$(RUN) bun $(ARGS)

bunx:
	@$(RUN) bunx $(ARGS)

astro:
	@$(RUN) bun --bun astro $(ARGS)

shadcn:
	@$(RUN) bunx --bun shadcn-vue@latest $(ARGS)

biome:
	@$(RUN) bunx biome $(ARGS)

check:
	@$(RUN) bun run check

types:
	@docker run --rm -u $$(id -u):$$(id -g) -e HOME=/tmp -v $$PWD:/app -w /app node:lts-alpine \
		npx -y pocketbase-typegen --db pb/data/data.db --out src/lib/pb-types.ts

swap:
	@if swapon --show | grep -q .; then printf "$(C_YLW)Swap already enabled$(C_RST)\n"; exit 0; fi; \
	sudo fallocate -l $(or $(ARGS),2G) /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && \
	echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null && printf "$(C_GRN)Swap enabled$(C_RST)\n"

upgrade:
	@$(COMPOSE_PROD) --profile dev pull --ignore-buildable

status:
	@for s in pocketbase astro dev caddy; do \
		ID=$$(docker ps -q --filter "label=com.docker.compose.project=$(PROJECT)" --filter "label=com.docker.compose.service=$$s"); \
		if [ -n "$$ID" ]; then printf "  $(C_GRN)●$(C_RST) %-11s running\n" $$s; else printf "  $(C_DIM)○ %-11s stopped$(C_RST)\n" $$s; fi; \
	done

help:
	@printf "$(C_GRN)pocket-astro$(C_RST) $(C_DIM)[$(PROJECT)]$(C_RST)\n\n"
	@$(MAKE) --no-print-directory status
	@printf "\n$(C_GRN)SETUP$(C_RST)\n"
	@printf "  $(C_CYN)init$(C_RST)             Create .env with encryption key\n"
	@printf "  $(C_CYN)admin$(C_RST)            Create or update PocketBase superuser\n"
	@printf "  $(C_CYN)swap$(C_RST) [size]      Enable swapfile on small VPS (default 2G)\n"
	@printf "\n$(C_GRN)DEVELOPMENT$(C_RST)\n"
	@printf "  $(C_CYN)dev$(C_RST)              PocketBase + astro dev → http://localhost:$(ASTRO_PORT)\n"
	@printf "  $(C_CYN)bun$(C_RST) [cmd]        Run bun in dev container\n"
	@printf "  $(C_CYN)bunx$(C_RST) [cmd]       Run bunx in dev container\n"
	@printf "  $(C_CYN)astro$(C_RST) [cmd]      Run astro CLI\n"
	@printf "  $(C_CYN)shadcn$(C_RST) [cmd]     Run shadcn-vue CLI\n"
	@printf "  $(C_CYN)biome$(C_RST) [cmd]      Run biome\n"
	@printf "  $(C_CYN)check$(C_RST)            Type-check astro and vue\n"
	@printf "  $(C_CYN)types$(C_RST)            Generate src/lib/pb-types.ts from pb/data\n"
	@printf "\n$(C_GRN)RUN$(C_RST)\n"
	@printf "  $(C_CYN)up$(C_RST)               Build and start pocketbase + astro on localhost\n"
	@printf "  $(C_CYN)deploy$(C_RST)           Pull, build, start with caddy on DOMAIN (https)\n"
	@printf "  $(C_CYN)down$(C_RST)             Stop everything\n"
	@printf "  $(C_CYN)restart$(C_RST) [svc]    Restart services\n"
	@printf "  $(C_CYN)logs$(C_RST) [svc]       Follow logs\n"
	@printf "  $(C_CYN)ps$(C_RST)               List containers\n"
	@printf "  $(C_CYN)sh$(C_RST) [svc]         Shell into service (default pocketbase)\n"
	@printf "  $(C_CYN)build$(C_RST)            Build astro image\n"
	@printf "  $(C_CYN)upgrade$(C_RST)          Pull latest images\n"
	@printf "\n$(C_GRN)POCKETBASE$(C_RST)\n"
	@printf "  $(C_CYN)migrate$(C_RST) [cmd]    Run pocketbase migrate\n"
	@printf "  $(C_CYN)pocketbase$(C_RST) [cmd] Run any pocketbase command\n"
	@printf "  $(C_DIM)Admin → http://localhost:$(PB_PORT)/_/$(C_RST)\n\n"
