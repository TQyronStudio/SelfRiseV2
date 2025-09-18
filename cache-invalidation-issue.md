# 🚨 DRUHÝ PROBLÉM - Cache Invalidation Issue

## Problém:
`getHabitsContentHash()` nezahrnuje `scheduleHistory` v hashu, pouze `scheduledDays`.

```typescript
// ❌ SOUČASNÁ IMPLEMENTACE:
.map(h => `${h.id}-${h.scheduledDays.join(',')}-${h.updatedAt}`)

// ✅ MĚLO BY BÝT:
.map(h => `${h.id}-${h.scheduledDays.join(',')}-${JSON.stringify(h.scheduleHistory)}-${h.updatedAt}`)
```

## Problém scénář:
1. User má habit s timeline: `[{scheduledDays: ['mon'], effectiveFromDate: '2024-01-01'}]`
2. User přidá nový timeline entry: `[..., {scheduledDays: ['mon','tue'], effectiveFromDate: '2024-09-01'}]`
3. `habit.scheduledDays` zůstává `['mon','tue']` (current schedule)
4. `habit.updatedAt` možná zůstává stejné
5. **Cache se neinvaliduje** - používají se starý conversion results!

## Impact:
- ❌ Smart Bonus Conversions se neaktualizují při schedule changes
- ❌ Completion rates zůstanou cached s old timeline data
- ❌ Porušuje "Content-Aware Invalidation" principle z technical guide