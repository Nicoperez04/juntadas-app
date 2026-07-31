# Reflexión Individual sobre el Uso de Inteligencia Artificial - Nicolás Perez
  
**Proyecto:** Ronda App — Entrega 3 (Desarrollo de Aplicaciones Móviles 2026)  

---

## ¿Para qué usamos IA durante el proyecto?

A lo largo del ciclo de vida de la aplicación, la IA tomó múltiples roles. La utilizamos intensivamente para:

* **Generación de código:** Para armar las estructuras iniciales de las pantallas, componentes de React Native y estilos básicos, ahorrándonos horas de tipeo mecánico.
* **Debugging y resolución de errores:** Cuando los builds de Android fallaban, le pasábamos los logs crudos y errores a la IA para aislar el problema.
* **Documentación:** Nos apoyamos en la herramienta para estructurar la documentación técnica, redactar readmes y dar formato a las reflexiones y definiciones del sistema.
* **Diseño de arquitectura:** La usamos en la fase de diseño para validar ideas y estructurar prompts complejos antes de tirar una sola línea de código.

---

## ¿Qué funcionó bien? ¿Qué respuestas tuvimos que corregir o descartar?

El nivel de productividad que alcanzamos en la maquetación y en la lógica estándar fue excelente. La IA es brillante cuando el problema está acotado y bien definido. Por ejemplo, al pedirle funciones específicas para manipular estados o integrar validaciones, el código generado solía funcionar al primer intento.

Sin embargo, el lado oscuro de la herramienta apareció con las configuraciones nativas y el ecosistema de Expo. Tuvimos que corregir y descartar muchísimas respuestas porque la IA sufría de *"alucinaciones técnicas"*. Muchas veces ignoraba que estábamos trabajando en el flujo administrado de Expo (*managed workflow*) y nos sugería modificar archivos nativos de Java o Kotlin que ni siquiera existían en nuestro repositorio, o nos recomendaba librerías desactualizadas de React Native que rompían el proyecto entero. Nos dimos cuenta de que la IA tiende a entrar en bucles de soluciones que no llevan a ningún lado si el contexto que le damos no es lo suficientemente estricto, como nos pasó con la inyección de la API Key de Google Maps.

---

## ¿Cómo cambió nuestra forma de trabajar respecto a proyectos anteriores?

Más que un cambio drástico de paradigma, siento que el uso de IA fue una evolución que encaja muy bien con el momento en el que estamos. Llevamos ya cuatro años en la carrera aprendiendo a analizar requerimientos, abstraer problemas y diseñar sistemas; sin embargo, en los proyectos de años anteriores muchas veces terminábamos consumiendo gran parte de nuestro tiempo peleando con la sintaxis del código, configuraciones de entorno o buscando soluciones a errores muy específicos en la documentación.

Con Ronda App, la IA actuó como un gran facilitador. No dejamos de programar, pero al delegar la escritura del código más mecánico y repetitivo, la proporción de nuestro esfuerzo cambió. Nos permitió enfocarnos mucho más en lo que realmente aporta valor y venimos practicando en la facultad: la arquitectura de la aplicación, la lógica de negocio y el diseño funcional. El desafío principal se trasladó a nuestra capacidad para comunicarle claramente el contexto del sistema a la IA, trabajar por bloques funcionales y, sobre todo, auditar críticamente sus respuestas para asegurar que respetaran las restricciones técnicas que nosotros mismos habíamos definido previamente.