# Bloque 6 — Correcciones de diseño y texto

## Corrección 1 — Mensaje en inglés en ChangePasswordScreen

Problema:
Cuando la nueva contraseña es igual a la actual, aparece el mensaje
"New password should be different from the old password." en inglés.
Debe estar en español.

Alcance:
En ChangePasswordScreen.tsx (o en authSchemas.ts si el mensaje
viene del schema Zod o de Supabase), buscar ese mensaje exacto
y reemplazarlo por:
"La nueva contraseña debe ser diferente a la actual."

Si el mensaje viene de Supabase (error de la API), interceptarlo
en authService.changePassword() y reemplazarlo antes de retornarlo.

No hacer:
- No cambiar la lógica de validación
- No tocar otros archivos

Archivos esperados:
- src/features/auth/screens/ChangePasswordScreen.tsx (o authService.ts
  o authSchemas.ts según dónde esté el mensaje)

---

## Corrección 2 — Modal de eliminar cuenta: input de email no visible

Problema:
En el modal de confirmación de eliminación de cuenta, el input
de email no se ve bien — el campo aparece muy pequeño y no permite
ver el texto mientras se escribe.

Alcance:
En ProfileScreen.tsx, en el modal de confirmación de email:

1. El TextInput debe tener:
   - width: '100%'
   - minHeight: 48
   - paddingHorizontal con valor del theme
   - fontSize adecuado (mínimo 16sp)
   - backgroundColor visible (no transparente)
   - borderWidth y borderColor definidos
   - color del texto explícito (no heredado)

2. El layout del modal debe asegurarse de que el input
   ocupe el ancho completo disponible dentro del modal

3. Si el modal usa position absolute o tiene overflow hidden,
   verificar que el input no quede cortado

No hacer:
- No cambiar la lógica de validación del email
- No cambiar los botones ni el resto del modal

Archivos esperados:
- src/features/auth/screens/ProfileScreen.tsx (modal corregido)

---

## Corrección 3 — Documentar este prompt

Crear ia/entrega-2/prompts/bloque-6/02_correctivo_perfil.md
con el contenido completo de este prompt.

No hacer:
- No tocar archivos de código fuera de los indicados
- No hacer commits

Archivos esperados:
- ia/entrega-2/prompts/bloque-6/02_correctivo_perfil.md
