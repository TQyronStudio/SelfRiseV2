# 🚨 KRITICKÝ PROBLÉM - Migration Chyba

## Problém:
Migration funkce `migrateHabitToTimeline()` používá **současný** `habit.scheduledDays` pro vytvoření historical timeline od creation date.

## Scénář problému:
1. **Červen 2024**: Habit vytvořen s `scheduledDays: ['monday', 'wednesday', 'friday']`
2. **Srpen 2024**: Uživatel změnil na `scheduledDays: ['monday']` (před implementací timeline)
3. **Září 2024**: Děláme migration - vytvoříme timeline s `['monday']` od creation date
4. **VÝSLEDEK**: Všechna historická data z června-srpna jsou nyní počítána jako Monday-only habit!

## Porušení Technical Guide:
```typescript
// ❌ WRONG: Migration zpětně mění význam historických dat
Timeline created: [{ scheduledDays: ['monday'], effectiveFromDate: '2024-06-01' }]
// Červnové úterky a pátky se z scheduled změní na bonus!

// ✅ CORRECT by mělo být:
Timeline should preserve: [{ scheduledDays: ['monday', 'wednesday', 'friday'], effectiveFromDate: '2024-06-01' }]
```

## Impact:
- ❌ Historical completion rates se změní
- ❌ Calendar view zobrazí wrong colors pro historical data
- ❌ Smart Bonus Conversions se změní
- ❌ Porušuje "MINULOST SE NEMĚNÍ" principle

## Řešení:
Migration nesmí používat současný schedule pro historical data, pokud nevíme přesnou historii změn.