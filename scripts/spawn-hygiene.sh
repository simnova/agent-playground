#!/bin/bash
# IAEP Spawn Hygiene Helper
# Run this (or source it) before any spawn_subagent to get the exact ultra-condensed
# prompt template. This enforces the hygiene rules from AGENTS.md and the orchestrator persona.
# Usage: ./scripts/spawn-hygiene.sh "front-end-developer" "your ultra-focused task here"
#
# This is an IAEP artifact (Iteration 001 / ongoing). Changes to this script should be
# accompanied by an updated metrics/iterations/NNN-*.md report and a new tag.

PERSONA_NAME="$1"
TASK="$2"

if [ -z "$PERSONA_NAME" ] || [ -z "$TASK" ]; then
  echo "Usage: $0 <persona-name> <ultra-focused-task-description>"
  echo "Example: $0 front-end-developer 'add one new data-e-ref to the projections card and verify count'"
  exit 1
fi

cat << PROMPT
Act as the persona defined in .grok/personas/${PERSONA_NAME}.toml (use read_file or open tools to load it fresh if you have not already in context); do not paste, embed, quote, or include the full instructions, toml body, or long description in the subagent prompt, title, or summary. Ultra-focused task only: ${TASK}. Begin work immediately with explicit first tool actions: 1. list_dir [relevant path] NOW. 2. [next relevant read or todo]. Use todo_write for all planning and tracking. Follow spawn hygiene strictly.
PROMPT
