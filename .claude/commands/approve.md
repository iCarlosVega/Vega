# Command: /approve

## Execution Steps:
1. **Read State:** Open `.claude-vega/state.json` and check `awaitingApprovalFor`. If it is `null`, inform the user that no approval gate is currently active and halt.
2. **Confirm Agent:** Display the name of the agent whose work is pending review and confirm with the user that they have reviewed the relevant artifacts in `.claude-vega/artifacts/`.
3. **Update State:**
   - Set `awaitingApprovalFor` to `null`.
   - Set `planApproved` to `true`.
   - Set `currentPhase` back to `"building"`.
4. **Resume Pipeline:** Continue the `/build` execution from the next agent in the `executionPipeline`.
