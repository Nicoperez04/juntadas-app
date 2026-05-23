Fix — Las juntadas no aparecen al volver al home

## Problema

En `MeetupHomeScreen.tsx`, la lista de juntadas se carga una sola vez cuando el componente se monta. Al crear una juntada y volver al home, la lista no se actualiza porque el hook no vuelve a llamar a `getUserMeetups`.

## Fix

En `mobile/src/features/meetups/screens/MeetupHomeScreen.tsx`, reemplazá el `useEffect` que carga las juntadas por `useFocusEffect` de React Navigation. Esto recarga la lista cada vez que la pantalla recibe el foco, ya sea al montar o al volver desde otra pantalla.

```typescript
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Reemplazar el useEffect de carga inicial por esto:
useFocusEffect(
  useCallback(() => {
    refresh();
  }, [refresh])
);
```

La función `refresh` ya existe en el hook `useMeetups` — solo hay que llamarla desde `useFocusEffect`.

Si `refresh` no está en el hook o no está siendo retornada correctamente, verificá `mobile/src/features/meetups/hooks/useMeetups.ts` y asegurate de que `refresh` esté exportada y llame a `loadMeetups` con el `userId` actual.

## Restricciones

- Solo modificar `MeetupHomeScreen.tsx` y si es necesario `useMeetups.ts`
- No hacer commits
- Comentar el cambio en español explicando por qué se usa `useFocusEffect`

## Al finalizar reportá

- Archivos modificados
- Cómo quedó el `useFocusEffect` implementado
- Confirmación de que `refresh` estaba disponible o qué cambio fue necesario en el hook
