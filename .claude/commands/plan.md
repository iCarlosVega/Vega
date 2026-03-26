# Command: /plan

## Execution Steps:
1. **Analyze Request:** Read the user's `$ARGUMENTS` to understand the project requirements.
2. **Discover Agents:** Run a directory scan of `.claude/agents/`. Read the YAML manifests of all available `.md` files to understand the available talent pool and their scopes.
3. **Draft the Pipeline:** Construct a logical, phased `executionPipeline` utilizing the necessary agents. Determine which agents can run in parallel and which must be sequential.
4. **Update State:** Write the proposed pipeline to `.claude-vega/state.json` and set `currentPhase` to `"planning"`.
5. **Request Approval:** Output the proposed pipeline to the terminal and explicitly ask the user for approval. Do not proceed until the user confirms. Once confirmed, set `planApproved: true`.
