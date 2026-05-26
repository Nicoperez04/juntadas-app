# Documento de Alcance -- Ronda App 

**Grupo:** Egüen Agustina, Pascucci Agostina, Perez Nicolas, Smith Justina, Talavera Santiago

**Fecha de Actualización:** 10/05/2026

**Versión / Entrega:** Entrega 1 - MVP Básico

## Historial de Revisiones (Changelog)

| Versión | Fecha | Autor | Descripción de los Cambios |
|----|----|----|----|
| 1.0 | 10/05/2026 | Egüen Agustina, Pascucci Agostina, Perez Nicolas, Smith Justina, Talavera Santiago | Creación del documento para la Entrega 1 (MVP Básico). Definición de alcance inicial. |

## 1. Descripción del Proyecto y Visión 

### 1.1. Problema que Resuelve 

Organizar una juntada con amigos suele ser un proceso caótico que requiere saltar entre múltiples herramientas. Los detalles, cambios de último momento y confirmaciones terminan perdiéndose en un mar de mensajes desordenados. Además, si el grupo quiere sumar juegos o llevar puntajes durante el encuentro, debe recurrir a otras aplicaciones. Al terminar, las fotos y videos quedan repartidos en celulares individuales o redes temporales, perdiéndose el registro compartido de la experiencia. Frente a esto, proponemos una aplicación móvil que concentre en un solo lugar la organización integral del evento, las dinámicas en vivo y el álbum unificado posterior.

### 1.2. Público Objetivo 

La aplicación está dirigida principalmente a jóvenes y adultos jóvenes que organizan juntadas o eventos presenciales con amigos de forma frecuente, especialmente estudiantes universitarios y grupos que comparten previas, asados, cumpleaños, reuniones casuales o pequeñas salidas. Se trata de usuarios que valoran organizar juntadas de forma simple, la interacción grupal presencial y la posibilidad de conservar recuerdos del encuentro en un entorno compartido.

### 1.3. Justificación de Plataforma (¿Por qué una App Móvil?) 

La elección de una aplicación móvil responde a la naturaleza del problema: la gestión de un evento social requiere portabilidad y disponibilidad constante. El teléfono celular es el único dispositivo capaz de acompañar a los usuarios antes, durante y después del encuentro, facilitando la organización diaria. Una app nativa permite enviar notificaciones en tiempo real, capturar contenido multimedia en el momento y fomentar dinámicas interactivas de forma presencial; atributos que una plataforma de escritorio o web no podría ofrecer con la misma agilidad.

## 2. Requerimientos Funcionales (RF) 

**Alcance E1:**

#### Módulo 1 -- Gestión de Juntadas

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-01** | **Crear Juntada** | La aplicación debe permitir a un usuario crear una juntada ingresando, como mínimo, título, fecha, horario, lugar y descripción breve. | E1 (MVP) |
| **RF-02** | **Consultar Juntada** | La aplicación debe permitir visualizar el detalle de una juntada, incluyendo su información principal, participantes y contenido disponible. | E1 (MVP) |
| **RF-03** | **Editar Juntada** | La aplicación debe permitir modificar los datos básicos de una juntada antes de su realización. | E1 (MVP) |
| **RF-04** | **Cancelar Juntada** | La aplicación debe permitir al creador cancelar una juntada previamente creada. | E1 (MVP) |
| **RF-05** | **Finalizar Juntada** | La aplicación debe permitir al organizador finalizar una juntada activa. Al finalizar, el evento pasa a estado "finalizada", se traslada al historial y se deshabilita la edición de datos y cambios de asistencia. | E1 (MVP) |

#### Módulo 2 -- Participación en Juntadas

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-06** | **Unirse a juntada** | La aplicación debe permitir a un usuario incorporarse a una juntada existente mediante un mecanismo simple de acceso, como código o enlace. | E1 (MVP) |
| **RF-07** | **Registrar asistencia** | La aplicación debe permitir a cada participante indicar su estado de asistencia a la juntada. | E1 (MVP) |
| **RF-08** | **Modificar asistencia** | La aplicación debe permitir actualizar el estado de asistencia registrado previamente por un participante. El organizador de la juntada podrá modificar la asistencia de cualquiera de los participantes. | E1 (MVP) |
| **RF-09** | **Visualizar participantes** | La aplicación debe permitir consultar la lista de participantes de una juntada junto con su estado de asistencia. | E1 (MVP) |
| **RF-10** | **Abandonar juntada** | La aplicación debe permitir a un participante dejar de formar parte de una juntada a la que se había unido. | E1 (MVP) |
| **RF-11** | **Reincorporacion por abandono** |  La aplicación debe permitir a un usuario volver a unirse mediante código de invitación a una juntada que había abandonado previamente, reactivando su participación activa. | E1 (MVP) |

#### Módulo 3 -- Juego Integrado

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-12** | **Iniciar partida de Impostor** | La aplicación debe permitir a un usuario iniciar una partida del juego \"Impostor\" dentro del contexto de una juntada activa. | E1 (MVP) |
| **RF-13** | **Asignar roles ocultos** | La aplicación debe asignar de forma aleatoria, individual y privada el rol de \"Impostor\" o \"Jugador Regular\" a cada participante. | E1 (MVP) |
| **RF-14** | **Distribuir consigna de juego** | La aplicación debe revelar la palabra o consigna secreta a los jugadores regulares, mostrando una pantalla diferenciada (sin la palabra) al usuario con el rol de impostor. | E1 (MVP) |
| **RF-15** | **Elegir categoría** | La aplicación debe permitir elegir una categoría de palabras para el juego Impostor. | E1 (MVP) |


#### Módulo 4 -- Recuerdos compartidos

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-16** | **Cargar fotografías** | La aplicación debe permitir subir fotografías asociadas a una juntada determinada. | E1 (MVP) |
| **RF-17** | **Visualizar galería de la juntada** | La aplicación debe permitir consultar una galería básica con las fotografías cargadas para una juntada. | E1 (MVP) |
| **RF-18** | **Asociar contenido multimedia a la juntada** | La aplicación debe registrar cada fotografía cargada vinculándola con la juntada correspondiente y, cuando aplique, con el usuario que la subió. | E1 (MVP) |
| **RF-19** | **Eliminar fotografías** | La aplicación debe permitir a un participante eliminar las imágenes que él mismo haya cargado en la galería compartida de la juntada. | E1 (MVP) |

#### Módulo 5 -- Historial

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-20** | **Consultar historial de juntadas** | La aplicación debe permitir al usuario visualizar un listado básico de juntadas creadas o en las que haya participado. | E1 (MVP) |

#### Módulo 6 -- Usuarios

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-21** | **Gestionar información básica del usuario** | La aplicación debe permitir registrar y consultar la información básica de un usuario, incluyendo al menos su nombre visible y los datos mínimos necesarios para identificarlo dentro de la plataforma. | E1 (MVP) |
| **RF-22** | **Distinguir roles básicos de usuario** | La aplicación debe distinguir, al menos, entre el usuario organizador de una juntada y los usuarios participantes, habilitando acciones acordes a cada rol dentro de la primera etapa del sistema. | E1 (MVP) |
| **RF-23** | **Autenticación básica de usuarios** | La aplicación debe permitir el registro, inicio y persistencia de sesión de los usuarios de forma segura. | E1 (MVP) |

**Backlog**

#### Backlog para Entrega 2: Escalado Funcional

En la segunda entrega se prevé ampliar el dominio en su dimensión horizontal, incorporando más actores del mismo tipo, mayor cantidad de entidades gestionables y una lógica de uso más completa dentro de la misma experiencia de juntada.

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-24** | **Gestión de multiples eventos** | La aplicación debe permitir a un usuario crear, editar, eliminar y visualizar simultáneamente múltiples juntadas (activas, futuras o pasadas). | E2 |
| **RF-25** | **Catálogo de dinámicas sociales** | La aplicación debe permitir seleccionar e instanciar diferentes tipos de juegos (ej. anotador de Truco, anotador de Generala) desde un catálogo interno durante la ejecución de una juntada. | E2 |
| **RF-26** | **Gestión de galería compartida** | La aplicación debe permitir a los asistentes de una juntada cargar, visualizar y eliminar elementos multimedia (fotos/videos) en un álbum colaborativo exclusivo de ese evento. | E2 |
| **RF-27** | **Control de asistencia y accesos** | La aplicación debe validar el ingreso a una juntada mediante mecanismos de invitación (códigos o enlaces), gestionando el estado de los asistentes y previniendo duplicidades o accesos no autorizados | E2 |
| **RF-28** | **Historial detallado de juntadas** | La aplicación debe proveer a cada usuario un registro histórico de sus eventos pasados, incluyendo estadísticas de los juegos realizados y acceso directo al contenido multimedia archivado. | E2 |

#### Backlog para Entrega 3: Producto Final

En la tercera entrega se prevé expandir el producto en su dimensión vertical, incorporando nuevas capas organizativas, mayor diferenciación de roles y un mayor nivel de madurez funcional y técnica.

| ID | Requisito Funcional | Descripción del Requerimiento | Entrega Objetivo |
|----|----|----|----|
| **RF-29** | **Gestión de Grupos/Comunidades** | La aplicación debe permitir la creación de \"Grupos\" estables, funcionando como una entidad jerárquica superior que contenga y organice múltiples juntadas recurrentes | E3 |
| **RF-30** | **Control de acceso basado en roles** | La aplicación debe asignar permisos diferenciados a los usuarios según su nivel de autoridad dentro de un grupo o juntada (ej. Administrador, Moderador, Miembro, Invitado). | E3 |
| **RF-31** | **Moderación administrativa** | La aplicación debe permitir a los administradores gestionar los miembros de un grupo, cancelar juntadas y auditar o eliminar contenido multimedia que incumpla las normas. | E3 |
| **RF-32** | **Consolidación multimedia grupal** | La aplicación debe proveer una vista unificada que agrupe y permita gestionar todos los recuerdos y álbumes de las distintas juntadas pertenecientes a un mismo Grupo. | E3 |
| **RF-33** | **Panel de actividad grupal** | La aplicación debe mostrar un resumen consolidado a nivel de Grupo, destacando el historial de eventos, próximas juntadas programadas y la información general de la comunidad. | E3 |

## 3. Requerimientos No Funcionales (RNF) 

- **Plataforma Objetivo:** La aplicación será desarrollada utilizando el framework React Native.

- **Rendimiento:** El sistema debe garantizar tiempos de carga menores a 2 segundos al navegar entre las pantallas principales bajo condiciones normales. Además, el procesamiento y visualización de fotografías debe gestionarse de manera asíncrona o con optimización de recursos para no bloquear el hilo principal ni la fluidez de la interfaz.

- **Conectividad:** La aplicación requerirá una conexión a internet persistente para mantener sincronizada la información en tiempo real sobre las juntadas, los participantes y el almacenamiento de imágenes. Ante una pérdida de red, el sistema manejará la excepción de forma controlada, informando claramente al usuario mediante alertas visuales sin que la aplicación colapse.

- **Idioma y Accesibilidad:** La interfaz de la aplicación estará diseñada íntegramente en español. Desde la concepción en los *wireframes*, se aplicarán estándares básicos de accesibilidad móvil, garantizando tipografías legibles, contraste de colores adecuado y áreas táctiles lo suficientemente amplias para una interacción cómoda y sin frustraciones.

| ID | Categoría | Requisito No Funcional | Descripción |
|:---|:---|:---|:---|
| RNF-01 | Usabilidad | Facilidad de uso | La aplicación debe presentar una interfaz simple, amigable e intuitiva, de modo que un usuario pueda crear o unirse a una juntada sin necesidad de instrucciones extensas. |
| RNF-02 | Usabilidad | Navegación Clara | La aplicación debe ofrecer una navegación clara y consistente entre sus pantallas principales, permitiendo recorrer el flujo básico de la juntada de manera comprensible. |
| RNF-03 | Usabilidad | Accesibilidad básica | La interfaz debe contemplar criterios básicos de accesibilidad, incluyendo tamaños de texto legibles, contraste suficiente y áreas táctiles cómodas para interacción móvil. |
| RNF-04 | Rendimiento | Tiempo de respuesta | Las pantallas principales de la aplicación deben cargar en un tiempo razonable, apuntando a un tiempo de respuesta menor a 2 segundos en condiciones normales de uso y conectividad. |
| RNF-05 | Rendimiento | Gestión eficiente de contenido multimedia | La carga y visualización de fotografías debe realizarse sin afectar de forma crítica la fluidez general de la aplicación, priorizando un comportamiento estable en el flujo principal del MVP. |
| RNF-06 | Conectividad | Requerimiento de conexión | La aplicación debe requerir conexión a internet para sincronizar juntadas, participantes y fotografías compartidas. |
| RNF-07 | Conectividad | Comportamiento ante fallos de red | La aplicación debe manejar de forma controlada los errores de conectividad, informando al usuario cuando una operación no pueda completarse por problemas de red. |
| RNF-08 | Seguridad | Autorización de acceso funcional | La aplicación debe restringir las acciones sensibles según el rol funcional del usuario dentro de la juntada, diferenciando al menos entre organizador y participante. |
| RNF-09 | Seguridad | Protección de datos | La información intercambiada entre la aplicación y los servicios backend debe transmitirse mediante conexiones seguras. |
| RNF-10 | Seguridad | Protección de archivos y referencias | Las fotografías asociadas a una juntada deben almacenarse en un servicio externo de archivos, guardando en la base de datos únicamente sus referencias y metadatos necesarios. |
| RNF-11 | Fiabilidad | Consistencia de datos | La información de juntadas, participantes y fotografías debe mantenerse consistente luego de operaciones de creación, edición, unión o carga de contenido. |
| RNF-12 | Mantenibilidad | Modularidad | La aplicación debe organizarse en módulos funcionales diferenciados, al menos para gestión de juntadas, dinámica social/juegos y recuerdos compartidos, de forma que puedan evolucionar por separado. |
| RNF-13 | Mantenibilidad | Capacidad de evolución | La arquitectura elegida debe permitir incorporar nuevas funcionalidades en entregas posteriores sin necesidad de rehacer la estructura general de la aplicación. |
| RNF-14 | Portabilidad | Plataforma Objetivo | La aplicación debe desarrollarse como aplicación móvil multiplataforma, priorizando Android para las pruebas iniciales y permitiendo ejecución en entornos compatibles con React Native. |

## 4. Reglas de Negocio y Validaciones 

- **RN-01 (Asignación de Organizador):** El usuario que crea la juntada asume automáticamente el rol de \"Organizador\" y su estado de asistencia inicial se registra por defecto como confirmado.

- **RN-02 (Prevención de Duplicidad):** Un usuario no puede unirse a la misma juntada más de una vez. El sistema debe identificar si el usuario ya es participante y evitar duplicaciones si vuelve a ingresar el código o enlace de invitación.

- **RN-03 (Restricción de Cancelación):** Únicamente el usuario con el rol de \"Organizador\" tiene los permisos necesarios para cancelar una juntada. Al cancelarse, la juntada bloquea nuevas interacciones y uniones, pero se mantiene en el historial como solo lectura.

- **RN-04 (Condición de Juego):** Para iniciar una partida válida de \"Impostor\", la juntada debe contar con un mínimo de 3 participantes (1 impostor y al menos 2 jugadores regulares) para que la dinámica tenga sentido lógico.

- **RN-05 (Permisos de Galería):** Solo los usuarios que forman parte de la juntada pueden cargar contenido multimedia. Usuarios externos o no unidos no tendrán acceso de escritura ni lectura a las fotografías de ese evento.

## 5. User Stories y Criterios de Aceptación (Bonus E1) 

<table style="width:100%;">
<colgroup>
<col style="width: 11%" />
<col style="width: 37%" />
<col style="width: 12%" />
<col style="width: 38%" />
</colgroup>
<thead>
<tr>
<th>ID Historia</th>
<th>User Story</th>
<th>Prioridad</th>
<th>Criterios de Aceptación (Given/When/Then)</th>
</tr>
</thead>
<tbody>
<tr>
<td>US-01</td>
<td><p><strong>Como</strong> Organizador</p>
<p><strong>Quiero</strong> crear una juntada con título, fecha y lugar</p>
<p><strong>Para</strong> centralizar la información básica del evento en un solo lugar.</p></td>
<td><strong>Alta</strong></td>
<td><p><strong>1. Éxito en la creación:</strong></p>
<p><em><strong>Dado que</strong></em> el organizador ingresó todos los campos obligatorios, <em><strong>cuando</strong></em> presiona "Crear",</p>
<p><em><strong>entonces</strong></em> el sistema guarda la juntada y lo redirige al detalle de la misma.</p>
<p><strong>2. Validación de campos:</strong></p>
<p><em><strong>Dado que</strong></em> el organizador dejó el título o la fecha vacíos,</p>
<p><em><strong>cuando</strong></em> intenta guardar,</p>
<p><em><strong>entonces</strong></em> el sistema muestra un mensaje de error y no permite la creación.</p></td>
</tr>
<tr>
<td>US-02</td>
<td><p><strong>Como</strong> Participante</p>
<p><strong>Quiero</strong> unirme a una juntada mediante un código o enlace</p>
<p><strong>Para</strong> acceder a los detalles y dinámicas del grupo de forma rápida.</p></td>
<td><strong>Alta</strong></td>
<td><p><strong>1. Código válido:</strong></p>
<p><strong><em>Dado que</em></strong> el usuario ingresó un código de invitación existente, <em><strong>cuando</strong></em> confirma la acción,</p>
<p><em><strong>entonces</strong></em> es incorporado a la lista de participantes.</p>
<p><strong>2. Código inválido:</strong></p>
<p><em><strong>Dado que</strong></em> el usuario ingresa un código que no existe en el sistema, <em><strong>cuando</strong></em> intenta unirse,</p>
<p><em><strong>entonces</strong></em> el sistema informa que el código es incorrecto.</p></td>
</tr>
<tr>
<td>US-03</td>
<td><p><strong>Como</strong> Organizador</p>
<p><strong>Quiero</strong> iniciar una partida de "Impostor" dentro de la juntada</p>
<p><strong>Para</strong> fomentar la interacción social entre los invitados durante el encuentro.</p></td>
<td><strong>Media</strong></td>
<td><p><strong>1. Mínimo de jugadores:</strong></p>
<p><em><strong>Dado que</strong></em> hay 3 o más participantes unidos,</p>
<p><em><strong>cuando</strong></em> el organizador inicia el juego,</p>
<p><em><strong>entonces</strong></em> el sistema asigna los roles aleatoriamente.</p>
<p><strong>2. Restricción por quorum:</strong></p>
<p><em><strong>Dado que</strong></em> hay menos de 3 participantes,</p>
<p><em><strong>cuando</strong></em> se intenta iniciar la partida, <em><strong>entonces</strong></em> el sistema notifica que se requiere un mínimo de jugadores.</p></td>
</tr>
<tr>
<td>US-04</td>
<td><p><strong>Como</strong> Participante</p>
<p><strong>Quiero</strong> visualizar mi rol y la palabra secreta de forma privada</p>
<p><strong>Para</strong> jugar la dinámica del Impostor según las reglas asignadas.</p></td>
<td><strong>Media</strong></td>
<td><p><strong>1. Visualización de rol:</strong></p>
<p><em><strong>Dado que</strong></em> la partida ha iniciado, <em><strong>cuando</strong></em> el usuario abre la tarjeta de rol,</p>
<p><em><strong>entonces</strong></em> el sistema le muestra si es "Impostor" o "Jugador Regular".</p>
<p><em><strong>2. Confidencialidad de la palabra:</strong></em> <em><strong>Dado que</strong></em> el usuario recibió el rol de "Impostor",</p>
<p><em><strong>cuando</strong></em> ve su pantalla de juego, <em><strong>entonces</strong></em> el sistema no le revela la palabra secreta que ven los demás.</p></td>
</tr>
<tr>
<td>US-05</td>
<td><p><strong>Como</strong> Participante/Organizador</p>
<p><strong>Quiero</strong> subir fotografías a la galería de la juntada</p>
<p><strong>Para</strong> que todos los asistentes tengan un registro compartido de la experiencia.</p></td>
<td><strong>Media</strong></td>
<td><p><strong>1. Carga exitosa:</strong></p>
<p><em><strong>Dado que</strong></em> el usuario seleccionó una imagen de su galería,</p>
<p><em><strong>cuando</strong></em> confirma la subida,</p>
<p><em><strong>entonces</strong></em> la foto se visualiza correctamente en la galería común del evento.</p>
<p><strong>2. Manejo de red:</strong></p>
<p><em><strong>Dado que</strong></em> el usuario no cuenta con conexión a internet,</p>
<p><em><strong>cuando</strong></em> intenta subir una foto, <em><strong>entonces</strong></em> el sistema informa el error de conectividad y la carga no se realiza.</p></td>
</tr>
</tbody>
</table>
