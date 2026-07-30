# Reflexión Individual sobre el Uso de Inteligencia Artificial - Justina Smith
  
**Proyecto:** Ronda App — Entrega 3 (Desarrollo de Aplicaciones Móviles 2026)  

---

## 1. Rol y Caso de Uso de la IA en el Proyecto

En esta última entrega me enfoqué en el desarrollo de juegos (Anotador de Truco, Generala, Sorteador, Ligas y Torneos), testing unitario con revisión de casos borde y pulido visual final. Usé la IA para analizar la lógica de negocio de los anotadores, generar algoritmos de fixtures (todos contra todos y eliminación directa), redactar tests unitarios para `authService` y `meetupService`, y configurar Skeletons en `MeetupDetailScreen` junto con animaciones de entrada (*stagger*) y feedback táctil (*scale*).

## 2. Herramientas de IA Utilizadas

- **Claude:** Consultor para pensar la lógica de juegos antes de codificar (fixtures y estados de partida) y estructurar la suite de pruebas.
- **Anti-Gravity:** Asistente en tiempo real en el editor para generar componentes visuales, aplicar animaciones fluidas con React Native / Reanimated y escribir tests directamente en el repositorio.

## 3. Aspectos Positivos y Aciertos

Lo más valioso fue el ahorro de tiempo en lógica y matemática. La IA resolvió rápido los algoritmos de fixtures y llaves de torneos sin tener que armarlos desde cero. Aceleró la creación de tests unitarios cubriendo casos de éxito/falla con Mocks claros, y facilitó la integración de Skeletons y animaciones sin romper la consistencia visual existente.

## 4. Errores y Cosas que Tuve que Corregir

Se requirió auditar las sugerencias por varios errores prácticos:
- **Animaciones incompatibles:** Sugirió librerías pesadas o incompatibles con Expo Go / SDK 53 que debieron reemplazarse por soluciones nativas más livianas.
- **Lógica de juegos sin UX:** Proponía estados de juego y tableros muy rígidos en Truco y Generala, los cuales ajusté manualmente para un uso ágil en celular.
- **Mocks desactualizados:** Generó mocks con estructuras viejas en los tests de servicios que exigieron corrección manual de llamadas y respuestas.

## 5. Impacto en la Metodología de Trabajo

Mi rol evolucionó a **diseñar la lógica, pedir soluciones específicas y validar su funcionamiento real**. Aprendí a no saltar etapas, postergando el pulido visual (*polish*) hasta tener juegos y tests 100% operativos. La IA aceleró la producción, pero el criterio de UI/UX y la corrección de casos borde dependieron enteramente de la revisión humana.