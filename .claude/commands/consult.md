# Command: /consult

## Execution Steps:
1. **Parse Target:** Read `$ARGUMENTS` to identify the target agent (e.g., `@backend_dev`) and the urgent message or pivot instruction.
2. **Generate Brief:** Create an urgent `activeBrief` detailing the immediate priority shift or blocker resolution required.
3. **Inject Context:** Update `.claude-vega/state.json` to assign this brief to the target agent under `activeBriefs.<agent_name>`. If the target agent is currently running, instruct it to pause its current checklist, address the brief, and then resume.
4. **Log Decision:** Append an entry to the `consultLogs` array in `state.json` with the following shape:
   ```json
   {
     "timestamp": "<ISO 8601>",
     "target": "<agent_name>",
     "reason": "<why this pivot was triggered>",
     "expectedOutcome": "<what the agent should produce>"
   }
   ```
