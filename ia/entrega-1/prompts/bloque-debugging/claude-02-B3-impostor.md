# Fix B3 — Bug impostor: eliminar último jugador restaura la lista

## Causa raíz identificada
En ImpostorStartScreen hay un useEffect que detecta cuando players.length
llega a 0 y restaura la lista desde la sesión guardada en Zustand.
Ese efecto fue diseñado para pre-cargar jugadores al volver de ImpostorRole,
pero no distingue entre "lista vacía porque el usuario la limpió" y
"lista vacía porque recién entró a la pantalla".

## Fix
En src/features/impostor/screens/ImpostorStartScreen.tsx aplicar 3 cambios:

### Cambio 1 — Agregar flag de control
Después de showAddPlayer agregar:

  const [playersManuallyCleared, setPlayersManuallyCleared] = useState(false);

### Cambio 2 — Actualizar handleRemovePlayer
  const handleRemovePlayer = useCallback((playerId: string) => {
    void triggerSelectionHaptic();
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== playerId);
      if (next.length === 0) setPlayersManuallyCleared(true);
      return next;
    });
  }, []);

### Cambio 3 — Actualizar la condición del useEffect
  if (session?.players.length && players.length === 0 && !playersManuallyCleared)

## Restricciones
- Solo modificar ImpostorStartScreen.tsx
- No modificar useImpostor.ts ni el store de Zustand
- No hacer commits