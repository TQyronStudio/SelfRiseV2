1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. If there is a bug, find the root cause and fix it properly. No temporary fixes. Act like a senior developer.
9. After you OR ANY SUB-AGENT successfully completes any task, the responsible agent MUST immediately update the corresponding checkbox in `projectplan.md` to `[x]`. Sub-agents must coordinate to avoid conflicts.
10. The `projectplan.md` file is our single source of truth for ALL agents. No agent (main or sub) may delete, clear, or overwrite the entire content without explicit permission. All agents must add to it or check off tasks in coordination.
11. When using sub-agents, the main Claude Code must:
    - Brief each sub-agent on these workflow rules before delegation
    - Ensure each sub-agent follows the same projectplan.md update protocol
    - Coordinate between multiple sub-agents working on related tasks
    - Consolidate sub-agent results into coherent plan updates
12. Each sub-agent must:
    - Read and understand the existing projectplan.md context before starting
    - Update their specific tasks in projectplan.md with [x] when completed
    - Add their changes to the review section under their specialization
    - Never work in isolation - always coordinate through projectplan.md
13. For complex tasks requiring multiple sub-agents:
    - Create a coordination section in projectplan.md
    - Each agent documents their part of the solution
    - Main Claude Code consolidates and verifies consistency
    - Single review section covers all agents' contributions
14. PROJECT DOCUMENTATION MANAGEMENT:
When working on SelfRise V2, maintain clean documentation structure:
 - **projectplan.md**: ONLY active development phases, incomplete tasks, and current planning. Maximum 25,000 tokens.
 - **projectplan-archive.md**: All completed features, fixes, and historical implementations. Reference for context but don't modify.
 - **technical-guides.md**: Development guidelines, patterns, best practices, and coding standards. Reference when implementing.
 - **implementation-history.md**: Detailed technical fixes, root cause analyses, and implementation details. Reference for debugging similar issues.

 CRITICAL: When completing any task, move detailed implementation notes to appropriate archive file and update projectplan.md with brief summary only. Always check projectplan.md token count and archive content when it approaches 25,000 tokens.