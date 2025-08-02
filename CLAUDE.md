1. MANDATORY PREPARATION: Before starting ANY task:
   - Read projectplan.md for current status
   - Read projectplan-archive.md for implementation context  
   - Read technical-guides.md for coding standards
   - Check available sub-agents with `/agents` and select appropriate specialist
   - If no perfect agent match exists, explain why and proceed

2. SUB-AGENT AUTOMATIC SELECTION: Use specialists for these domains:
   - **react-native-expert**: Components, navigation, TypeScript, Expo issues
   - **gamification-engineer**: XP systems, streaks, level calculations, achievements  
   - **data-storage-architect**: AsyncStorage, migrations, data consistency
   - **mobile-ui-designer**: Styling, layout, accessibility, UX improvements
   - **habit-logic-debugger**: Habit tracking algorithms, bonus conversion, streak bugs
   - **performance-optimizer**: Lag, memory issues, render optimization
   - **mobile-tester**: Writing tests, test failures, coverage improvements
   - **app-store-publisher**: Deployment, ASO, release management
   - **security-integration-specialist**: Firebase, AdMob, API security
   - **business-logic-architect**: Recommendation engines, complex algorithms
   SUB-AGENT SELECTIVE USAGE: Use specialists ONLY for complex tasks (>30min work).
     For simple tasks (styling, typos, small bugs): work directly without agents
   ALWAYS ask yourself: "Is agent overhead worth it for this task?"

3. DOCUMENTATION MANAGEMENT (CRITICAL PRIORITY):
   - projectplan.md MAXIMUM 25,000 tokens - check token count before writing
   - When adding implementation details: brief summary in projectplan.md, full details in appropriate archive
   - When completing tasks: move detailed notes to archive, keep only essential info in main plan
   - Archive locations: projectplan-archive.md, technical-guides.md, implementation-history.md

4. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.

5. The plan should have a list of todo items that you can check off as you complete them

6. Before you begin working, check in with me and I will verify the plan.

7. Then, begin working on the todo items, marking them as complete as you go.

8. Please every step of the way just give me a high level explanation of what changes you made

9. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

10. Finally, add implementation summary to appropriate archive file and brief review to projectplan.md.

11. DO NOT BE LAZY. If there is a bug, find the root cause and fix it properly. No temporary fixes. Act like a senior developer.

12. After you OR ANY SUB-AGENT successfully completes any task, the responsible agent MUST immediately update the corresponding checkbox in `projectplan.md` to `[x]`. Sub-agents must coordinate to avoid conflicts.

13. The `projectplan.md` file is our single source of truth for ALL agents. No agent (main or sub) may delete, clear, or overwrite the entire content without explicit permission. All agents must add to it or check off tasks in coordination.