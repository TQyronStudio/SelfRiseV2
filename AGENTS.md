1. MANDATORY PREPARATION: Before starting ANY task:
   - Read projectplan.md for current status
   - Read projectplan-archive.md for implementation context  
   - Read technical-guides.md for coding standards

2. WORKING MODE: Choose the simplest workflow that fits the task:
   - For small tasks, work directly and keep the change minimal.
   - For larger or risky tasks, first gather context, explain the approach, and use any available supporting tools only when they clearly reduce risk or speed up the work.
   - Do not rely on hardcoded specialist names or old agent lists. Use the current available capabilities of the environment.

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

12. After completing any planned task, immediately update the corresponding checkbox in `projectplan.md` to `[x]`.

13. The `projectplan.md` file is the single source of truth for project work. Do not delete, clear, or overwrite the entire content without explicit permission. Only add relevant notes, update relevant sections, or check off completed tasks.

14. Po dokončení úkolu a mé pochvale (např. „Dobrá práce", „Skvěle",
  „Perfektní", „Hezky", „Výborně", „Skvělá práce"):
     - Udělej `git add .` pro všechny změny
     - Vytvoř commit s popisným názvem (např. „Checkpoint XXX -
  Complete")
     - AUTOMATICKY pushni pomocí `git push` do remote repository
     - Potvrď úspěšné uložení a push

15. Vytváření a správa Technických  Průvodců (Technical Guides)

 Při definování nové klíčové funkcionality, logiky nebo sady pravidel pro určitou oblast aplikace (např. Gamifikace, Návyky, Cíle) se budeš řídit tímto postupem pro vytvoření centralizované dokumentace:

 1. Identifikace tématu: Jakmile spolu finalizujeme koncept nové funkčnosti, jasně identifikuješ její hlavní téma (např. "Gamifikace", "Sociální interakce", "Notifikace").

 2. Ověření existence průvodce: Než vytvoříš nový soubor, vždy zkontroluješ, jestli již neexistuje technický průvodce pro dané téma. Cílem je centralizovat informace a zabránit duplicitě.

   - Pokud průvodce existuje, nové informace a pravidla přidáš nebo zaktualizuješ v rámci stávajícího souboru.

   - Pokud průvodce neexistuje, vytvoříš nový.

 3. Vytvoření nového technického průvodce:

   - Vytvoříš nový soubor ve formátu Markdown (.md).

   - Název souboru bude striktně dodržovat formát: technical-guides:Téma.md (např. technical-guides:Gamification.md, technical-guides:Habits.md).

 4. Struktura a styl obsahu:

   - Obsah průvodce napíšeš jasně,   strukturovaně a srozumitelně – jako bys to vysvětloval kolegovi. Používej nadpisy, odrážky a zvýraznění textu pro maximální čitelnost.

   - Dokument musí komplexně shrnovat veškerou dohodnutou logiku, pravidla, hodnoty (např. výše odměn), podmínky a principy fungování dané funkčnosti. Bude sloužit jako hlavní referenční bod.

 5. Propojení s projectplan.md:

   - Do souboru projectplan.md nebudeš kopírovat detailní popis z technického průvodce.

   - Místo toho vložíš pouze jednoduchý a přímý odkaz na příslušný soubor.

   - Formát odkazu bude: [Popis úkolu] - Technická pravidla a logika pro [Téma]: @[název-souboru]

   - Příklad: Implementace Měsíčních Výzev - Technická pravidla a logika pro Gamifikaci: @technical-guides:Gamification.md

 Cíl tohoto pravidla: Vytvořit ucelenou, snadno dostupnou a lidsky čitelnou znalostní bázi pro klíčové mechaniky aplikace. Tím se zjednoduší projectplan.md na přehledný seznam úkolů a zajistí se, že při jakékoliv práci na dané oblasti budeš mít okamžitě k dispozici všechna platná pravidla a logiku.

16. Povinné Použití Průvodce Před Zahájením Práce

 1. Konzultace před akcí: Před zahájením jakéhokoliv úkolu (úprava, oprava, rozšíření), který se týká již existující funkčnosti, jsi povinen nejprve aktivně vyhledat a prostudovat relevantní technický průvodce. Je to tvůj první krok.

 2. Identifikace tématu: Pokud je úkol "Opravit chybu v odměnách za návyky", automaticky identifikuješ klíčová slova "odměny" a "návyky" a vyhledáš soubory technical-guides:Gamification-Core.md a technical-guides:Habits.md.

 3. Soulad s pravidly: Veškerý kód, který napíšeš nebo upravíš, musí být v naprostém souladu s logikou, hodnotami a principy definovanými v tomto průvodci. Průvodce je nadřazený tvým předchozím znalostem o projektu.

 4. Řešení nejasností: Pokud je zadání v rozporu s technickým průvodcem nebo pokud průvodce nepokrývá daný specifický případ, jsi povinen na to upozornit. Navrhneš aktualizaci průvodce a teprve po jejím odsouhlasení začneš implementovat změny v kódu.

16. 🚨 SURGICAL CHANGES ONLY - "Nerozbij fungující systémy"
    - PŘED každým úkolem: "Co aktuálně FUNGUJE a NESMÍ se pokazit?"
    - ZMĚŇ pouze minimum potřebné k vyřešení problému
    - TESTUJ po každé změně že funkční systémy stále fungují
    - Pokud zjistíš že musíš měnit funkční kód → ZEPTEJ SE NEJDŘÍV
    - Pokud něco přestane fungovat → OKAMŽITĚ zastav a diagnostikuj
