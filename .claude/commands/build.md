# Command: /build

## Execution Steps:
1. **Verify State:** Check `.claude-vega/state.json`. Ensure `planApproved` is `true`.
2. **Phase Iteration:** Read the `executionPipeline`. For the current active phase, identify the assigned agents.
3. **Spawn Agents:** For each agent in the current phase, execute them headlessly:
   `claude -p "Read .claude/agents/<agent_name>.md and execute your tasks." > .claude-vega/logs/<agent_name>.log &`
4. **The Standup Loop:** Pause and monitor the `actionQueue` in `state.json`.
   * If an agent pushes `{"status": "completed"}`, verify their `<agent_name>_state.md` checklist in `.claude-vega/artifacts/` and extract their `## Currently Working On` handoff notes.
   * If an agent pushes `{"status": "blocked"}`, initiate Blocker Mediation (see CLAUDE.md § 5).
   * If an agent pushes `{"status": "failed"}`, initiate a QA Rollback (see CLAUDE.md § 6).
5. **Phase Transition:** Once all agents in a phase complete successfully (and any `requires_human_approval` gates are cleared by the user via `/approve`), increment the phase and repeat Step 3.
