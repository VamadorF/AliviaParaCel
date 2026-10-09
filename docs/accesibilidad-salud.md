# Accesibilidad en salud, aplicada a AliviaParaCel

Notas de octubre de 2026. Resumen de fuentes oficiales consultadas y consejos para esta app. No es un dictamen legal ni una auditoría de pantallas.

## Para quién es AliviaParaCel

App móvil del portal paciente de AlivIA, para personas con dolor crónico en Chile y quienes las cuidan: check-in diario, historial y contacto con AlivIA, con ingreso por RUT chileno.
La beta muestra datos de demostración. Quien la usa a menudo lo hace con una mano, con poca energía o con la letra del teléfono agrandada.

## Qué exigen o recomiendan las fuentes

### W3C — WCAG 2.2

[Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) es la recomendación vigente. Para una app de este tipo importan, entre otros, estos criterios:

- **1.4.1 Uso del color (A):** el color no es el único medio para informar, indicar una acción o distinguir un control.
- **1.4.3 Contraste mínimo (AA):** texto e imágenes de texto al menos **4,5:1**. El texto grande, al menos **3:1**.
- **1.4.4 Cambio de tamaño del texto (AA):** el texto puede agrandarse hasta **200 %** sin perder contenido ni funciones.
- **1.4.11 Contraste no textual (AA):** componentes de interfaz y partes gráficas necesarias para entender el contenido, al menos **3:1** respecto del color adyacente.
- **1.3.4 Orientación (AA):** no limitar la vista a vertical u horizontal, salvo que esa orientación sea esencial.
- **2.2.2 Pausar, detener, ocultar (A):** si algo se mueve, parpadea o se desplaza solo, dura más de cinco segundos y convive con otro contenido, la persona puede pausarlo, detenerlo u ocultarlo.
- **2.5.7 Movimientos de arrastre (AA):** lo que se hace arrastrando también se puede hacer con un toque simple, salvo que el arrastre sea esencial.
- **2.5.8 Tamaño del objetivo mínimo (AA):** el área de toque mide al menos **24 por 24 píxeles CSS**, con excepciones de separación, control equivalente y otras.
- **2.5.5 Tamaño del objetivo mejorado (AAA):** al menos **44 por 44 píxeles CSS**. Es un nivel por encima de AA.
- **2.3.3 Animación por interacción (AAA):** la animación disparada por una interacción se puede desactivar, salvo que sea esencial. No es requisito de AA.
- **3.2.6 Ayuda consistente (A):** si hay un contacto humano (datos o mecanismo), aparece en el mismo orden relativo en las pantallas del conjunto.
- **3.3.1 Identificación de errores (A)** y **3.3.2 Etiquetas o instrucciones (A):** el error se describe en texto y el campo explica qué hay que ingresar.
- **3.3.7 Entrada redundante (A):** no volver a pedir un dato ya ingresado en el mismo proceso, salvo excepciones (seguridad, dato que ya no vale, o que reingresarlo sea esencial).
- **3.3.8 Autenticación accesible mínima (AA):** un paso de acceso no exige una prueba cognitiva (recordar una contraseña o resolver un acertijo) si no hay alternativa, ayuda, reconocimiento de objetos o contenido personal. Pegar y los gestores de contraseñas son ejemplos de ayuda que el criterio menciona.
- **4.1.2 Nombre, función, valor (A)** y **4.1.3 Mensajes de estado (AA):** el lector de pantalla puede saber qué es cada control y oír confirmaciones sin tener que mover el foco.

La nota [Guidance on Applying WCAG 2.2 to Mobile Applications](https://www.w3.org/TR/wcag2mobile-22/) señala, para aplicaciones móviles, orientación, reflujo en pantallas chicas, alternativa al arrastre, tamaño mínimo de toque y menos tipeo repetido. El contraste de texto (4,5:1) y el contraste de interfaz (3:1) se aplican también ahí.

### NHS (Reino Unido)

El [service manual del NHS](https://service-manual.nhs.uk/accessibility/how-to-make-digital-services-accessible) (página actualizada en agosto de 2026) pide que sitios y apps móviles públicas del NHS cumplan WCAG 2.2 en los niveles A y AA, que la accesibilidad se piense en cada etapa y que en cada ronda de investigación participen personas con necesidades de acceso.

La [guía de contenido](https://service-manual.nhs.uk/accessibility/content) (actualizada en febrero de 2025) dice que el contenido claro es lo que más personas ayuda. Pide un solo encabezado principal, etiquetas visibles, errores que digan qué falló y cómo corregirlo, y no apoyarse solo en el color ni en la posición (“el botón rojo de la derecha”).

### HHS y Section 508 (Estados Unidos)

La [declaración de accesibilidad digital del HHS](https://www.hhs.gov/accessibility/hhs-digital-accessibility-statement/index.html) (revisión de contenido indicada en la página: 12 de agosto de 2026) compromete al departamento a cumplir o superar la Section 508 de la Rehabilitation Act. Como mínimo aplica **WCAG 2.0 nivel AA**, los estándares Section 508 y buenas prácticas a la tecnología de información y comunicación que desarrolla, adquiere, financia, mantiene o usa. La página no habla de WCAG 2.2.

### Australia — Digital Transformation Agency

La [página de accesibilidad de la DTA](https://www.dta.gov.au/accessibility) (actualizada el 15 de enero de 2026) dice que su sitio apunta a los requisitos de accesibilidad web del gobierno australiano, incluidos **WCAG 2.2**.

El [Digital Service Standard 2.0](https://www.dta.gov.au/sites/default/files/2023-11/Digital%20Service%20Standard%202.pdf), criterio 3 (“Leave no one behind”), pide cumplir la Disability Discrimination Act 1992 y la **última versión de WCAG**, usar lenguaje claro, probar con personas que dependen de tecnologías de apoyo y contemplar quién no puede usar el canal digital.

### Chile

[Ley 20.422](https://www.bcn.cl/leychile/navegar?idNorma=1010903) (texto en la Biblioteca del Congreso Nacional; última modificación registrada ahí: 16 de febrero de 2026). El artículo 3 define **accesibilidad universal**: entornos, procesos, bienes, productos, servicios y dispositivos comprensibles, utilizables y practicables por todas las personas, con seguridad y comodidad, de la forma más autónoma y natural posible. Define **diseño universal** como concebirlos desde el origen para que puedan usarlos todas las personas, o la mayor extensión posible. La ley no fija en ese artículo un nivel WCAG.

[Decreto 1 de 2015](https://www.bcn.cl/leychile/navegar?idNorma=1078308), del Ministerio Secretaría General de la Presidencia, aprueba la norma técnica de sistemas y sitios web de los órganos de la Administración del Estado. Los artículos 3, 5 y 7 piden disponibilidad y accesibilidad, tener en cuenta la Ley 20.422 y los estándares del W3C, y que el acceso funcione en distintos dispositivos. Obliga a esos órganos del Estado. AliviaParaCel no es un sitio de la Administración; el decreto sirve como referencia local, no como una obligación copiada tal cual a esta beta.

La [guía SENADIS de septiembre de 2022](https://kitdigital.gob.cl/archivos/insumos/nuevos/Manual%20Accesibilidad%20Web.pdf) (“Guía para la implementación de sitios web accesibles”, también alojada en Kit Digital) orienta a organismos públicos y privados, sigue WCAG 2.1 e incorpora el borrador de WCAG 2.2 de esa fecha. En 2022 el documento describe la 2.2 como aún en desarrollo. Hoy la recomendación publicada del W3C es la 2.2 enlazada arriba. La guía repite el umbral de contraste de texto de al menos 4,5:1 (3:1 para texto grande).

En el sitio del Minsal hay un PDF cuyo nombre de archivo incluye la palabra BORRADOR y cuyo encabezado deja en blanco el número y la fecha de la resolución: [Norma técnica estándar de acreditación para plataformas de telemedicina](https://www.minsal.cl/wp-content/uploads/2026/03/BORRADOR-NORMA-TECNICA-ESTANDAR-DE-ACREDITACION-PARA-PLATAFORMAS-DE-TELEMEDICINA.pdf). El texto pide constatar WCAG 2.1 o superior en plataformas de telemedicina. No es una resolución promulgada y no regula esta app de check-in.

## Consejos para esta app

Contraste con [DESIGN.md](../DESIGN.md). “Ya en el diseño” significa que el archivo ya lo pide; el consejo dice dónde aplicarlo.

1. **Áreas de toque de al menos 48 dp.** Ya en el diseño (controles ≥ 48 dp). WCAG 2.2 AA pide 24 píxeles CSS (2.5.8); el nivel AAA pide 44 (2.5.5). El diseño ya está por encima del mínimo AA. Mantenerlo en las caras de la escala, los chips del check-in, las cuatro pestañas y cualquier control de urgencias. Si dos objetivos quedan pegados, separarlos: el criterio AA acepta objetivos más chicos solo si un círculo de 24 píxeles centrado en cada uno no se cruza con otro.

2. **Contraste de texto 4,5:1 y de interfaz 3:1.** Ya en el diseño. Medirlo en el texto atenuado (`textMuted`) sobre fondo y sobre tarjeta, en “Paso N de M”, en bordes de chips y en el estado presionado. Un token escrito en la tabla no sustituye la medición. El gráfico de dolor, si se entiende por su forma o su trazo, entra en el 3:1 del criterio 1.4.11.

3. **El dolor se dice con número y palabra, además del color.** Ya en el diseño (no comunicar el dolor solo por color). WCAG 1.4.1 y la guía de contenido del NHS piden lo mismo: otro indicio además del color. En la escala y en el diario, leer y mostrar algo como “6, intenso”, no una cara o un tono sueltos. Las instrucciones no pueden ser “toca el rojo” ni “el de la derecha” (criterio 1.3.3 y la misma guía del NHS).

4. **Sin movimiento que compita con el registro.** Ya en el diseño la prohibición de puntos pulsantes. Sumar: nada que se mueva solo más de cinco segundos junto al check-in sin poder pausarlo, detenerlo u ocultarlo (2.2.2, nivel A). Respetar la opción del teléfono de reducir movimiento. Poder apagar toda animación causada por un toque es nivel AAA (2.3.3), no AA; igual conviene en un día de dolor o de mareo.

5. **Lector de pantalla: nombre, valor y confirmación.** Ya en el diseño: `accessibilityLabel` en iconos, foco visible y región en vivo al guardar. Cada cara de la escala anuncia número y palabra. El campo RUT anuncia su etiqueta (“RUT”) y, si falla, el texto del error, no solo un borde rojo. “Guardado” se anuncia sin obligar a buscar el mensaje (4.1.2 y 4.1.3). Probar el check-in completo con TalkBack y con VoiceOver.

6. **Lenguaje claro, una pregunta por paso.** El NHS trata el contenido claro como lo que más ayuda. El estándar australiano pide lenguaje llano. Ya en el diseño: “Paso N de M”, errores que empiezan con “Falta: …” y un solo H1 con un solo botón primario. En el check-in, palabras de todos los días (dolor, sueño, ánimo, medicamento). Si aparece un término clínico, va acompañado de una frase corta. Junto al RUT, un ejemplo visible del formato, no solo el texto fantasma del campo: el diseño ya prohíbe que el placeholder sea la única etiqueta.

7. **Crisis 131, con nombre y aparte de “Guardar registro”.** Ya en el diseño: la crisis se ve distinta del botón de guardar. El control dice “Llamar al 131” (o una frase equivalente), en texto, no solo con el color `danger`. Va en el mismo lugar relativo del Diario, del paso de urgencias del check-in y del Perfil (ayuda consistente, 3.2.6). No comparte estilo ni posición con guardar el registro.

8. **RUT: etiqueta, error corregible, pegar, no repetir.** Ya en el diseño el patrón “Falta: …”. El mensaje dice qué corregir (por ejemplo el dígito verificador), en texto. Se puede pegar el RUT. No se vuelve a pedir en el mismo check-in (3.3.7). El ingreso no depende de un acertijo o de memorizar un código extra (3.3.8); el RUT con su dígito ya es el identificador.

9. **La letra del sistema puede crecer y el teléfono puede girar.** Ya en el diseño: `allowFontScaling` siempre y sin alturas fijas que recorten texto. Comprobar login, escala de dolor y “Paso N de M” con la letra del sistema grande (el criterio 1.4.4 habla de 200 %). No fijar la app solo en vertical: el viewport 390×844 del diseño es la referencia de maqueta, no un candado (1.3.4). La navegación inferior no debe tapar el foco del campo RUT ni del botón de guardar (2.4.11, AA).

10. **La escala se elige con un toque.** Ya en el diseño el check-in por pasos. Elegir dolor, zona o ánimo no exige arrastrar un control; cada valor es un toque (2.5.7). Si más adelante hubiera un deslizador, dejar al lado botones o chips que hagan lo mismo.

11. **Probar con quien usa la app en un mal día.** El NHS pide incluir personas con necesidades de acceso en cada ronda de investigación: visión, motricidad, fatiga cognitiva, necesidades temporales. En esta app, una mano, letra grande, lector de pantalla, RUT mal escrito y el camino hasta el 131. El diseño tiene un checklist por pantalla; esta prueba es de flujo completo, no de una pantalla aislada.

12. **Un encabezado y una acción principal.** Ya en el diseño. En el check-in el H1 nombra la tarea (“Check-in diario”) y el paso va aparte, como texto, para que el lector no confunda el progreso con el título. Las cuatro pestañas llevan texto (Diario, AlivIA, Comunidad, Perfil): ya en el diseño.
