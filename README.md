# fën · Cocina · v0.17.0

**App nueva de las jefas** · repo `fen-cocina` · dirección: `https://panaderiafen.github.io/fen-cocina/` · 10 de octubre de 2026 (v0.1.1 y v0.1.2: 10–11 de octubre; v0.2.0 a v0.13.1: 11 de octubre; v0.14.0 a v0.16.1: 12 de octubre; v0.16.2 a v0.16.4: 13 de octubre; v0.17.0: 14 de octubre)

Reemplaza de a poco a la app de Producción. Guarda directo en la base nueva (Firebase **fen-produccion**):
- abre al tiro con lo guardado en el equipo;
- la dupla ve lo mismo al instante;
- cada número se guarda por separado (nunca "borrar la semana y reescribir");
- si algo no se guardó, lo dice;
- la planilla de Producción recibe una copia automática del plan semanal.

## Novedades v0.17.0 · Bodegas por área responsable (decisión de Emmanuel, 14-oct)
Va con **Sistema Fën v0.65.0**, el **script de Producción v2.11.0** y las **reglas v1.8.0**. Hasta que confirmes los responsables en Sistema Fën, Cocina funciona **igual que la v0.16.4**.

**La decisión:** cuatro bodegas, **Panadería, Bollería, Pastelería y Cafetería**. Cada materia prima crítica tiene **una sola área responsable** (las harinas → Panadería). Su stock es uno solo y **baja con lo que consume cualquier área**: la harina que usan Bollería y Pastelería baja la harina de Panadería. Cafetería sigue con su propia bodega (otro stock físico, como ahora).

**En Cocina → Bodega (después de confirmar):**
- Cada área ve **solo las materias primas de las que es responsable**: Panadería ve las harinas aunque las use Bollería; Bollería, sus insumos; Pastelería, los suyos; Cafetería, igual que antes.
- **Llegó mercadería** y **Conteo de bodega** ofrecen solo esas. El título dice la bodega: "Conteo de bodega · Panadería · hoy".
- La ayuda dice "Bodega Panadería: las materias primas de las que Panadería es responsable…", con un (i) que lo explica.
- **Bajo el mínimo** (arriba de la Bodega y la línea en Hoy / Bitácora de turno): solo lo suyo. Sin precios.
- **Correo:** la tablet pide el aviso solo de lo suyo y llega a Administración y a **las jefas de esa área** (no a las demás). Cafetería nunca recibe la harina; Bollería no recibe lo de Panadería.

**Lo de antes no se pierde:** el stock de cada materia prima sigue en el mismo lugar (`stockmp/{mpId}`, `conteosmp/{mpId}`). Los conteos y llegadas anotados antes (por cualquier área de Producción) siguen valiendo para la responsable: si Bollería contó la harina ayer, ese conteo sigue siendo el último de la harina de Panadería. Cambiar la responsable más adelante tampoco mueve nada.

**Cómo queda guardado (para el que venga):**
- `config/bodegas` = `{ modo: 'responsable', areas: { PAN: 'PAN', BOL: 'BOL', PAS: 'PAS', CAF: 'CAF' }, responsables: { mpId: 'PAN' | 'BOL' | 'PAS' }, confirmado: { por, en }, historial: [...] }` (lo escribe Sistema Fën). Sin `responsables` para una materia prima = Panadería.
- Stock de producción: `stockmp/{mpId}` en su responsable (el documento de siempre). Si alguna vez una materia prima se marca crítica en **otra** bodega de producción, va en `stockmp/{BODEGA}__{mpId}` (Sistema Fën avisa; lo que consume un área va a la suya si la tiene; si no, a la responsable).
- Llegadas y conteos nuevos: `dias/{AREA}_{fecha}.bodega[id].bodega = 'PAN' | 'BOL' | 'PAS' | 'CAF'`. Cada guardado declara las anotaciones que toca en `movIds` (de a 30), para las reglas v1.8.0. Las de antes ('PROD' o sin campo) van al stock de siempre de la responsable.
- El cálculo compartido es `consumo.js` v0.17.0 (copia exacta en Sistema Fën v0.65.0): `bodegaConsumo`, `bodegaMov`, `puestos`, `idStockEn`, `areasAviso`.

**Archivos → GitHub, repo `fen-cocina` (raíz):** cambian `app.js`, `consumo.js`, `estilos.css`, `firestore-produccion.rules` (v1.8.0: va a la consola, paso 1); solo versión: `config.js`, `index.html` y `README.md`. Sin cambios: `modelo.js`, `bolleria.js`, `registros.js` (los tres iguales a los de Sistema Fën; `consumo.js` también es copia exacta), `buscador.js`, `cafeteria.js`, `congelado.js`, `editor.js`, `firebase.js`, `logo-fen.png`. Lo más simple: subir **todos** los del zip.

**Orden de instalación (importante):**
1. **Reglas v1.8.0** (`firestore-produccion.rules`, en este zip y en `reglas-produccion-v1.8.0.zip`): consola de Firebase → **fen-produccion** → Firestore Database → **Reglas** → pegar todo → **Publicar**. Mientras no confirmes los responsables, dejan hacer lo mismo que la v1.7.0 (las tablets sin recargar siguen funcionando).
2. **Script de Producción v2.11.0** (`produccion-script-v2.11.0.zip`): reemplaza **Seguridad** y **SistemaFen** → Implementar → Gestionar implementaciones → ✏️ → **Nueva versión**. Ping: `"version":"2.11.0"`.
3. **Sistema Fën v0.65.0**.
4. **Cocina v0.17.0** (este zip). **Recarga todas las tablets** (abajo debe decir Cocina v0.17.0).
5. Sistema Fën → Producción → Bodega → **Calcular** → **Asignar responsables**: revisa la propuesta y **Confirmar responsables**. Desde ese momento cada área ve solo lo suyo.
6. Si alguna tablet no se recargó, después de confirmar no podrá anotar llegadas ni conteos (las reglas le piden lo nuevo): recargarla.

**Revisar:**
- [ ] Abajo dice **Cocina v0.17.0**. Antes de confirmar: la Bodega se ve igual que ayer.
- [ ] Después de confirmar, Panadería → Bodega: "Bodega Panadería: las materias primas de las que Panadería es responsable", con las harinas; **no** aparece la mantequilla ni lo de Cafetería. El (i) lo explica.
- [ ] Bollería → Bodega: solo lo suyo (sin harinas). El conteo ofrece solo lo suyo.
- [ ] Pastelería → Bodega: solo lo suyo. Cafetería → Bodega: igual que antes.
- [ ] Bollería marca masas hechas → en Sistema Fën (Calcular) la harina de **Panadería** baja; en la tablet de Panadería se ve el stock nuevo.
- [ ] Algo de Panadería bajo el mínimo: aviso arriba de la Bodega de Panadería (no en Bollería) y un correo a ti y a las jefas de Panadería.
- [ ] Celular, tablet y PC: nada cortado ni corrido hacia el lado.

**Si algo sale mal:** vuelve a subir la v0.16.4 **y** en Sistema Fën no confirmes (o, si ya confirmaste, avísame: se vuelve a la bodega común cambiando `config/bodegas` a `modo: 'compartida'` y `areas` como estaba, lo que quedó en `antes`; no se pierde nada). Las reglas v1.8.0 pueden quedar.

## Novedades v0.16.4 · Panadería → Hoy: las masas van en "Recetas del día" (pedido de Emmanuel con las jefas de Panadería, 13-oct)
**Esta entrega incluye la v0.16.3** (chips de estado, pie de masa madre destacado, check en lo terminado; ver abajo). Si la v0.16.3 no se instaló, se instalan juntas.

**1. Masa ciabatta, Masa baguette (y cualquier "Masa …") en Recetas del día.** Van **primero**, antes de los productos, con la misma tarjeta completa que tenían (ingredientes escalados, tandas, ajuste de harina/agua, Marcar terminada, pasos) y una línea nueva: **"Para: 150 Ciabatta · 20 Focaccia (1,5 c/u)"** (cuántos de cada producto y cuánta masa lleva cada uno cuando no es 1).
- **Masa madre blanca, Poolish y el pie** siguen en **Elaboraciones previas** (se hacen antes).
- Si no queda ninguna elaboración previa, esa sección no aparece.
- En la Ciabatta / Focaccia dice "Harina y agua: se ajustan en Masa ciabatta (arriba, en Recetas del día)".

**2. "Ordenar Hoy"** (link chico junto a "Recetas del día", con botón (i)): la jefa marca qué sub recetas van en Recetas del día. Por defecto: las que empiezan con "Masa " (menos masa madre, poolish y pie). Vale para todos los días del área y la dupla lo ve al instante. Se guarda en `ajustes/PAN__hoy` (`{ area, recetaId: '_hoy', periodos: [], hoy: { recetasDia: { SR020: true, … }, por, en } }`): las reglas v1.7.0 ya dejan escribir ahí a la cuenta del área (**no cambian las reglas**). Lo que no se tocó sigue lo de por defecto.

**3. "Marcar todo como hecho"** incluye las masas, con **las mismas claves de siempre** (`sub_SR020`…): la bodega y el historial quedan iguales (la bodega descuenta solo los productos, `rec_…`; la masa no se cuenta dos veces). **Insumos del día** sin cambios.

**4. Bollería, Pastelería y Cafetería:** sin cambios (su Hoy no tiene "Ordenar Hoy").

**Archivos → GitHub, repo `fen-cocina` (raíz):** cambian `app.js` y `estilos.css`; solo versión: `config.js`, `index.html` y `README.md`. Si no instalaste la v0.16.3, sube también `editor.js` (lo más simple: **todos** los del zip). Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `consumo.js` (los cuatro iguales a los de Sistema Fën), `buscador.js`, `cafeteria.js`, `congelado.js`, `firebase.js`, reglas (siguen las v1.7.0, no hay que publicar nada en Firebase) y script. Sistema Fën: nada.

**Revisar:**
- [ ] Abajo dice **Cocina v0.16.4** (y lo de la lista de la v0.16.3, si se instalan juntas).
- [ ] Panadería → Hoy: **Masa ciabatta** y **Masa baguette** aparecen arriba en "Recetas del día", con "Para: 150 Ciabatta · 20 Focaccia (1,5 c/u)" (con los números del día).
- [ ] Masa madre blanca y Poolish siguen en "Elaboraciones previas".
- [ ] "Marcar todo como hecho" marca también las masas; el stock de la bodega queda igual que antes (solo cuentan los productos).
- [ ] "Ordenar Hoy" → (i) explica; desmarcar Masa ciabatta → Guardar: vuelve a Elaboraciones previas (si estaba terminada, sigue terminada). Volver a marcarla.
- [ ] Bollería y Pastelería → Hoy: igual que antes.
- [ ] Celular, tablet y PC: nada cortado ni corrido hacia el lado.

**Si algo sale mal:** vuelve a subir la v0.16.3 (no cambia datos; el documento `ajustes/PAN__hoy` queda y no molesta).

## Novedades v0.16.3 · estado de cada receta a la vista, pie de masa madre destacado y check en lo terminado (pedido de Emmanuel, 13-oct)
Solo cambia cómo se ve: los datos, las reglas y los cálculos son los mismos.

**1. Recetas (las 4 áreas): un chip con el estado en cada receta**, en la lista, en Propuestas, en el detalle y en el formulario:
- **Borrador** (rojo suave) · **En prueba** (amarillo) · **En revisión** (celeste; "aprobándose" también se ve como En revisión) · **Consolidada** (verde: la vigente, aprobada) · **Anulada** (gris).
- **Devuelta** (rojo más fuerte, con ícono de alerta): va **arriba de la lista** y debajo dice **"Devuelta por Administración: <comentario>"**.
- Una receta consolidada con un cambio pendiente muestra los dos: **"Consolidada" + "Cambio en revisión"** (o "Cambio en prueba", "Cambio en borrador", "Cambio devuelto").
- En la lista, las anuladas quedan al final. Colores en pastel con texto legible (contraste AA, ≥ 4,5:1).

**2. Panadería → Hoy: el pie de masa madre** (sigue primero) tiene **borde azul** y el nombre va en un **chip azul** ("Pie de masa madre blanca"), como el chip "Hoy" pero en azul, para que no se confunda con el color de Panadería. Vale para cualquier pie (blanca o integral).

**3. Terminada:** al marcar terminada una tarjeta (recetas, elaboraciones previas, masas, empastes), además del título en verde aparece un **check junto al título** (para lectores de pantalla: "Terminada"). En el pie de masa madre, el check va junto al chip al marcarlo hecho.

**Revisado** en celular (390), tablet vertical (768), tablet acostada (1024) y PC (1280): en el celular los chips del detalle y del formulario bajan a una línea propia bajo el título.

**Archivos → GitHub, repo `fen-cocina` (raíz):** cambian `app.js`, `editor.js` y `estilos.css`; solo versión: `config.js`, `index.html` y `README.md`. Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `consumo.js` (los cuatro iguales a los de Sistema Fën), `buscador.js`, `cafeteria.js`, `congelado.js`, `firebase.js`, reglas (siguen las v1.7.0) y script. Requiere la v0.16.2 instalada (si no, sube todos los del zip).

**Revisar:**
- [ ] Abajo dice **Cocina v0.16.3**.
- [ ] Recetas: cada receta tiene su chip (Consolidada verde, En prueba amarillo, Borrador rojo suave, En revisión celeste, Anulada gris).
- [ ] Una receta con un cambio pendiente muestra "Consolidada" + "Cambio en revisión".
- [ ] Si Administración devuelve un cambio: esa receta queda primera, con el chip rojo "Cambio devuelto" y la línea "Devuelta por Administración: …". También arriba en Propuestas.
- [ ] Al abrir una receta (o su propuesta), los mismos chips junto al título; en el celular, en una línea bajo el título.
- [ ] Panadería → Hoy: el pie de masa madre sigue primero, con borde azul y el nombre en el chip azul.
- [ ] Marcar terminada una receta o elaboración: el título en verde y el check al lado.
- [ ] Celular, tablet y PC: nada cortado ni corrido hacia el lado.

**Si algo sale mal:** vuelve a subir la v0.16.2 (solo cambia cómo se ve).

## Novedades v0.16.2 · cada pantalla se ve bien en el celular, las tablets y el PC (regla de Emmanuel, 13-oct)
Se revisaron **todas las pantallas** de las 4 áreas (Hoy, Planificación, Bitácora, Metas, Masas, Merma, Bodega, Recetas y el formulario, Bitácora de turno) y los diálogos (anotar en la Bitácora, inventario, empastes, hice empastes, merma, derramado, calibración, conteo, llegada, ajuste, tandas, copiar semana, cambiar de área) en celular (390×844), tablet vertical (768×1024), tablet horizontal (1024×768) y PC (1280×900). Solo cambia cómo se ve: los datos y los cálculos son los mismos.

**Lo que se arregló:**
- **Planificación y Masas en el celular:** la página se corría hacia el lado (las etiquetas escondidas de cada casilla empujaban la página). Ahora la tabla se desliza **dentro de su caja**, con el nombre de la receta fijo a la izquierda, una sombra en el borde y arriba **"Desliza la tabla hacia el lado para ver todo"** (solo cuando no cabe). En la tablet vertical la Planificación cabe entera.
- **Barra de arriba en el celular:** "En línea", "Cambiar de área" y el nombre ya no se parten en dos líneas apretadas; "En línea" va arriba a la derecha y los dos botones en una línea (un nombre muy largo termina en "…").
- **Flechas de la semana** (Planificación, Metas, Masas): en el celular quedan a los lados del título, en la misma línea (antes la flecha "siguiente" caía abajo).
- **Hoy en el celular:** "Ajustar harina / agua" y "Tandas" lado a lado y "Marcar terminada" a lo ancho (antes, uno bajo otro con anchos distintos).
- **Bitácora de Bollería en el celular:** los botones de anotar, dos por línea y del mismo ancho.
- **Diálogos en el celular** (conteo, llegada, inventario, elaboré masas, formé, empastes, calibración, tandas): el nombre tiene espacio (antes quedaba en una columna angosta de 6–8 líneas); la columna de la unidad usa solo lo que necesita. El diálogo usa casi todo el ancho y se desliza por dentro.
- **Bodega:** "Contada hoy…" tenía un relleno de más (heredado del formulario de recetas); cada materia prima queda separada de la siguiente, así el stock ya no parece de la de abajo.
- **Filas nombre / valor** (Hoy de Bollería, congelado, meta): si no caben juntos, el valor baja a la línea siguiente a la derecha, en vez de apretar el nombre ("Masa / Base").
- **Metas en el celular:** el nombre del producto más ancho y casillas más justas.
- **Formulario de recetas:** el estado ("Borrador") alineado con el título.
- Textos de ayuda largos dentro de una casilla terminan en "…" en vez de cortarse a media palabra.

**Archivos → GitHub, repo `fen-cocina` (raíz):** cambian `estilos.css` y `app.js`; solo versión: `editor.js`, `config.js`, `index.html` y `README.md`. Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `consumo.js` (los cuatro iguales a los de Sistema Fën), `buscador.js`, `cafeteria.js`, `congelado.js`, `firebase.js`, reglas (siguen las v1.7.0) y script. Requiere la v0.16.1 instalada (si no, sube todos los del zip).

**Revisar:**
- [ ] Abajo dice **Cocina v0.16.2**.
- [ ] Celular, Panadería → Planificación: la página no se mueve hacia el lado; la tabla sí, con el nombre fijo y el aviso "Desliza la tabla…".
- [ ] Celular, arriba: "En línea" a la derecha; "Cambiar de área" y el nombre en una línea, sin partirse.
- [ ] Celular, Bollería → Metas y Masas: las dos flechas a los lados del título.
- [ ] Celular, Hoy: "Ajustar harina / agua" y "Tandas" lado a lado; "Marcar terminada" a lo ancho.
- [ ] Celular, Bodega → Conteo de bodega: el nombre de cada materia prima se lee en 1–2 líneas.
- [ ] Tablet (vertical y acostada) y PC: todo como antes, sin nada cortado.

**Si algo sale mal:** vuelve a subir la v0.16.1 (solo cambia cómo se ve).

## Novedades v0.16.1 · escribir para buscar en las listas de materias primas (pedido de Emmanuel, 12-oct)
Donde se elige una materia prima o insumo de una lista, ahora también se puede **escribir el nombre**.

- Arriba de la lista: **"Escribe para buscar…"**. Al escribir, la lista queda con lo que coincide y se elige la primera.
- Sin importar **tildes** ni **mayúsculas**, en **cualquier parte** del nombre y con **varias palabras en cualquier orden**.
- Si no hay nada: **"Sin resultados"** (la lista queda completa, con lo que estaba elegido antes de escribir). **Escape** o borrar: vuelve la lista completa (la primera vez que se aprieta Escape con texto, solo borra; no cierra la ventana).

**Dónde:** Recetas → **Falta una materia prima** → "Una que existe en otra área" (la lista para habilitarla). Era la única lista de materias primas en Cocina:
- **Llegó mercadería** y **Conteo de bodega** no tienen lista: muestran todas las críticas de la bodega, una por fila.
- **Merma** e **ingredientes/insumos de la receta** ya tenían su propio buscador: no cambian.

Por dentro: `buscador.js` nuevo (`conBuscador(select)`; copia exacta en Sistema Fën v0.54.1). El `<select>` sigue mandando (`select.value` igual que antes); no se duplica si se llama dos veces (`data-buscador`).

**Archivos → GitHub, repo `fen-cocina` (raíz):** nuevo `buscador.js`; cambian `editor.js`, `estilos.css`, `app.js`, `config.js`, `index.html` y `README.md` (estos tres, solo versión). Sin cambios: reglas (siguen las v1.7.0), script, `consumo.js` y los demás. Si no instalaste la v0.16.0, instala esta directo siguiendo sus pasos (abajo).

**Revisar:**
- [ ] Abajo dice **Cocina v0.16.1**.
- [ ] Recetas → Nueva receta → Falta una materia prima → "Una que existe en otra área": arriba de la lista está "Escribe para buscar…".
- [ ] Escribe "levadura" (o "levádura"): queda elegida la levadura.
- [ ] Escribe algo que no existe: "Sin resultados". Escape: vuelve la lista completa y la ventana sigue abierta.

**Si algo sale mal:** vuelve a subir la v0.16.0.

## Novedades v0.16.0 · Bodegas separadas y avisos de bajo el mínimo (pedido de Emmanuel, 12-oct)
**Esta entrega incluye la v0.15.0** (Cafetería, parte 1: calibración diaria, derramado, merma con fecha; ver abajo), que no alcanzó a instalarse. Se instalan juntas.

**Decisión:** el stock va por **bodega** (el lugar físico), no por área.
- **Producción**: Panadería, Bollería y Pastelería, igual que hoy (lo que cuenta un área vale para las tres).
- **Cafetería**: solo Cafetería.
- Más adelante se pueden agregar bodegas (por ejemplo, una por área con las harinas compartidas) sin rehacer nada: es cambiar el mapa área → bodega (`config/bodegas`).

**En Cocina → Bodega:**
- Cada área ve **solo su bodega**. Cafetería ve la de Cafetería; Panadería, Bollería y Pastelería, la de Producción.
- **Llegó mercadería** y **Conteo de bodega** muestran solo las materias primas críticas de esa bodega. El título dice cuál: "Conteo de bodega · Cafetería · hoy".
- **Bajo el mínimo:** arriba de la Bodega aparece el aviso "Bajo el mínimo en la bodega Cafetería: Leche (hay 3 l, mínimo 5 l)". Sin precios.
  - Si contaron o recibió mercadería después del último cálculo de Sistema Fën, el aviso usa ese conteo (y suma las llegadas), así se ve al tiro.
- **En Hoy** (y en la Bitácora de turno de Cafetería) aparece una línea chica "Bodega: Leche bajo el mínimo (hay 3 l)" que lleva a Bodega.
- **Correo:** cuando algo queda bajo el mínimo, la tablet le pide al script que avise por correo a Administración y a las jefas de esa bodega. Llega **uno por día por materia prima** (aunque se abra mil veces).
- **Límite:** se revisa cuando se abre Cocina o Sistema Fën, o cuando se cuenta o recibe. No hay revisión automática de noche.

**Cafetería (seguimiento de la v0.15.0):**
- Editar la calibración diaria ahora pasa a la planilla (**CAF_registros**, una fila por día; si la vuelven a editar, se corrige la misma fila).

**Lo de antes:** todo lo que ya existía queda en **Producción**. Si hoy algo es crítico solo por Cafetería (leche, café, vasos), Emmanuel lo pasa con **"Pasar a Cafetería"** en Sistema Fën. Las llegadas y conteos viejos no se mueven ni se borran.

**Cómo queda guardado (para el que venga):**
- `stockmp/{mpId}` = Producción (como siempre); `stockmp/CAF__{mpId}` = Cafetería, con `{ bodega, mp, critica, seguridad, envase, estado }`. Lo mismo `conteosmp`.
- Cada llegada o conteo lleva `bodega: 'CAF'` o `'PROD'` (sin el campo = Producción). Un área solo mueve su bodega.
- `config/bodegas = { areas: { PAN: 'PROD', BOL: 'PROD', PAS: 'PROD', CAF: 'CAF' }, nombres: { … } }` (opcional; vacío = eso mismo).
- El cálculo compartido es `consumo.js` v0.16.0 (copia exacta en Sistema Fën v0.54.0).

**Archivos → GitHub, repo `fen-cocina` (raíz):** lo más simple es subir **todos** los del zip. Comparado con la v0.14.0 (la instalada):
- Cambian `app.js`, `consumo.js`, `estilos.css`, `config.js`, `index.html`, `README.md` y `firestore-produccion.rules` (v1.7.0, va también a la consola: paso 1).
- De la v0.15.0: `editor.js`, `cafeteria.js` (nuevo) y `congelado.js` (versión).
- Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `firebase.js`, `logo-fen.png`.

**Orden de instalación (importante):**
1. **Reglas v1.7.0** (`firestore-produccion.rules`, está en este zip): consola de Firebase → proyecto **fen-produccion** → Firestore Database → **Reglas** → pegar todo → **Publicar**.
2. **Script de Producción v2.9.0** (`produccion-script-v2.9.0.zip`): reemplaza Seguridad y SistemaFen → Implementar → Gestionar implementaciones → ✏️ → **Nueva versión**. Ping: `"version":"2.9.0"`. Opcional: propiedad del script `ALERTAS_ADMIN` (tu correo; si no está, llega al dueño del script).
3. **Sistema Fën v0.54.0** → Producción → Bodega → Calcular. Pestaña **Cafetería**: marca sus críticas con su mínimo (o usa "Pasar a Cafetería").
4. **Cocina v0.16.0** (este zip). Recarga las tablets.
5. **Primer conteo** de cada crítica de Cafetería, desde la tablet de Cafetería.

**Revisar:**
- [ ] Abajo dice **Cocina v0.16.0**.
- [ ] Cafetería → Bodega: dice "Bodega Cafetería (solo de esta área)" y **no** aparece la harina. El conteo solo ofrece lo de Cafetería.
- [ ] Panadería → Bodega: dice "Bodega Producción (la comparten Panadería, Bollería y Pastelería…)" y no aparece lo de Cafetería.
- [ ] Contar en Cafetería algo por debajo del mínimo → aparece el aviso arriba; en la Bitácora de turno, la línea "Bodega: … bajo el mínimo".
- [ ] Llega el correo (a ti y a las jefas de Cafetería). Abrir de nuevo no manda otro el mismo día.
- [ ] Editar la calibración diaria → en unos segundos aparece en CAF_registros como `calibracion_diaria`.
- [ ] Y todo lo de la lista de la v0.15.0 (abajo).

**Si algo sale mal:** vuelve a subir la v0.14.0 de Cocina (las reglas v1.7.0 pueden quedar). Con ella vuelve la bodega común; en Cafetería el "último conteo" compartido no se guarda (sale un aviso), pero el conteo sí.

## Novedades v0.15.0 · Cafetería, parte 1 (pedidos de Emmanuel, 12-oct)
**Recetas:** Cafetería crea y cambia sus recetas en Cocina como las otras áreas (ya era así desde v0.8.0: "Nueva receta" y "Editar (nueva versión)" → propuesta → la apruebas en Sistema Fën → Desde Cocina). Ahora el formulario habla como Cafetería:
- Tipo: "Receta (se vende en la caja)" o "Sub receta (jarabe, cold brew…)".
- **Cada tamaño es una receta aparte** ("Latte 8 oz" y "Latte 12 oz").
- El café va en gramos: "1 shot = 18 g (configuración de Cafetería), 2 shots = 36 g". La leche también en gramos.
- Insumos: vasos, tapas, mangas (por unidad).
- Las reglas ya permiten propuestas y pedidos de materias primas de Cafetería.

**Bitácora de turno:**
- **Solo hoy:** sin cambiar de día ni de período. La fecha queda fija arriba al bajar.
- **Calibración diaria automática:** arriba dice "Calibración diaria: 6 shots (automática) · 108 g de café".
  - Se cuenta sola **cada día que Cafetería vende en la caja**.
  - Son 6 shots (después se podrá cambiar en Sistema Fën) × los gramos por shot de la configuración.
  - **Editar** guarda el número real del día: 8, o 0 si no se calibró (por ejemplo, si estuvo cerrado). Queda quién y a qué hora, y lo anterior se ve en "Cómo funciona" (no se borra).
  - Solo se cuentan días automáticos **desde que se instala esta versión**, nunca hacia atrás. La primera vez que Cafetería abre la v0.15.0, Cocina deja esa fecha en el día y la repite en los días siguientes.
- **"Calibración"** ahora se llama **"Calibración extra"**: es para lo que se calibra además de la diaria (cambio de molienda, de café). Se suma aparte, como siempre.
- **Derramado** (botón nuevo, accidente):
  - se eligen una o más preparaciones, con cuántas de cada una;
  - cada una queda como **merma** (motivo "Derrame o error", nota "Derramado"), así que va a Registro_merma y la ves valorizada en Sistema Fën como cualquier merma;
  - la bodega descuenta **la preparación entera** (café, leche, vaso…), porque se hizo y no se vendió;
  - en la bitácora va una línea por preparación ("Derramado · Latte · 2 unidades") y cada una se puede **anular**.
- **Total de café** incluye la calibración diaria.

**Merma de Cafetería:**
- La lista muestra **solo hoy**.
- Al anotar hay **Fecha**: parte en hoy y se puede cambiar hasta 7 días atrás, nunca a un día que no ha llegado. Se guarda en ese día.
- Las otras áreas siguen igual. Hacer lo mismo en ellas es fácil (sacar la condición de Cafetería). En Bollería hay que ver qué pasa con la merma "se perdió congelado" anotada en un día anterior: cambia el congelado de los días siguientes.

**Archivos → GitHub, repo `fen-cocina` (raíz):**
- Cambian `app.js`, `editor.js`, `consumo.js` (cálculo compartido, v0.15.0), `estilos.css` y `README.md`.
- Nuevo: `cafeteria.js`.
- Solo cambia la versión: `config.js`, `index.html`, `congelado.js`.
- Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `firebase.js`, `logo-fen.png`, **reglas** (siguen las v1.6.0) y script.

**Sistema Fën:**
- Hay que copiar `cocina/consumo.js` (el de esta versión) y que lo importe con `?v=0.16.0`. Mientras no se copie, Sistema Fën no descuenta ni la calibración diaria ni lo derramado. La merma derramada sí se ve valorizada desde ya.
- Pendientes ahí: cambiar los shots diarios, pasar los días con venta de Cafetería, y mostrar la calibración diaria en el resumen de café.

**Revisar:**
- [ ] Abajo dice **Cocina v0.15.0**.
- [ ] Cafetería → Recetas → Nueva receta: el tipo dice "se vende en la caja" y aparece la ayuda del shot. Enviarla a revisión → aparece en Sistema Fën → Desde Cocina.
- [ ] Bitácora de turno: no hay flechas ni "Esta semana". Dice "Calibración diaria: 6 shots (automática)". Editar → 8 → dice "editada por…".
- [ ] Derramado → 2 Latte + 1 Capuccino → tres preparaciones, una línea por preparación. Anular una.
- [ ] Merma: anotar algo con la fecha de ayer. Sale el aviso "anotada en el … (aquí se ve solo hoy)" y en la planilla queda con la fecha de ayer.
- [ ] Después de copiar `consumo.js` a Sistema Fën: Bodega → Calcular → el café baja 8 × gramos por shot por hoy, más el café de lo derramado.

## Novedades v0.14.0 · Hoy se nota cuando es hoy · Bollería: los empastes se hacen la semana en que se laminan (corrección de Emmanuel, 12-oct)
**Hoy (Panadería, Bollería y Pastelería):**
- Cuando el día elegido es **hoy**, toda la pantalla toma el color del área (más intenso) y la fecha dice **Hoy**.
- Otro día: fondo normal y el botón **"Volver a hoy"** a la vista, en la barra de la fecha.
- La **barra de la fecha queda fija arriba** al bajar (también en el celular). Lo mismo en la Bitácora (sin color).
- Cafetería no tiene Hoy (tiene Bitácora de turno): no cambia.

**Bollería · empastes (cambia la idea anterior):**
- Las **masas base** se siguen elaborando la semana anterior (PEM). Los **empastes se hacen la misma semana en que se laminan**, según lo que hay que formar esa semana.
- **"Elaboré masas"** (y "Marcar terminada" en Hoy) ahora anota **solo la masa**: no suma empastes al refri ni descuenta mantequilla de empaste de la bodega. Las anotaciones antiguas quedan como estaban (dicen "anotación antigua: con sus masas").
- **Masas (PEM)** y **Metas** ya no muestran empastes. **Hoy** ya no tiene tarjetas de empaste por masa.
- **Bitácora → botón "Empastes"**: panel de la semana (lunes a sábado; el domingo ya cuenta para la semana que empieza, como "La próxima" y el descongelado de la víspera). Por masa base:
  - **Necesarios esta semana**: lo que hay que formar (meta − stock inicial + dejar) pasado a masas = 1 empaste por masa.
  - **Ya usados al laminar**: los de "Formé" desde el lunes.
  - **En el refri**: inventario + hechos − usados.
  - **Hechos esta semana** (desde el domingo antes), día por día.
  - **Faltan por hacer** = necesarios − usados − en el refri.
  - **"Hice empastes"**: cuántos (número entero), en el día elegido. Suma al refri y **descuenta de la bodega** la receta del empaste (300 g × cantidad). Se ve en la Bitácora ("Hice empastes → refri") y se puede **anular** como las demás.
- **Hoy de Bollería**: la línea **"Empastes de la semana: faltan X (hay Y en el refri)"** abre el panel. Debajo, la **receta del empaste** escalada a lo que falta, para pesarla; su botón "Hice empastes" parte con ese número.
- El **inventario del congelador** sigue contando los empastes del refri.
- Sistema Fën (bodega) cuenta "Hice empastes" con el mismo cálculo. La proyección de la bodega pone el empaste con los productos de la meta de la semana, ya no con las masas.

**Archivos → GitHub, repo `fen-cocina` (raíz):** `app.js`, `congelado.js`, `consumo.js` (cálculo compartido, v0.14.0), `estilos.css`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `index.html`. Sin cambios: `modelo.js`, `bolleria.js`, `registros.js`, `firebase.js`, reglas y script.
**Sistema Fën:** la copia `cocina/consumo.js` es la misma de Cocina v0.14.0; `produccion.js` y `vista-produccion.js` la importan con `?v=0.14.0` (va con la próxima entrega de Sistema Fën).

**Revisar:**
- [ ] Abajo dice **Cocina v0.14.0**. Hoy con el color del área; al pasar a mañana, fondo normal y "Volver a hoy". Al bajar, la fecha queda arriba.
- [ ] Bollería, Hoy: marcar una masa terminada → en la Bitácora dice "Elaboré masas" sin línea de empastes; el refri no cambia.
- [ ] Bitácora → Empastes: los números calzan con la meta de la semana; "Hice empastes 10" → el refri sube 10 y faltan baja 10.
- [ ] Sistema Fën → Bodega → Calcular: la mantequilla baja 3 kg por esos 10 empastes.

## Novedades v0.13.1 · el domingo ya es de la semana que viene
- **Arreglo:** el domingo, después del inventario, Metas y Masas decían "Sin inventario del congelador". Miraban la meta que empieza el lunes, cuyas masas (PEM) se elaboraron la semana pasada, cuando todavía no había inventario. Un PEM que ya pasó ya no muestra ese aviso.
- **El domingo cuenta como preparación de la semana siguiente:** "La próxima" (y lo que se abre por defecto en Metas y Masas) es la meta cuyo PEM empieza mañana. Ejemplo: el domingo 11 abre la meta del lun 19, con el PEM del lun 12 al vie 16.
- El descuento de las masas que sobran ya se calcula **desde el domingo**, con el inventario y lo descongelado ese día.
- Archivos: `app.js`, `congelado.js`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `firebase.js`, `index.html`, `estilos.css`.

## Novedades v0.13.0 · Bollería: stock inicial, sobre stock y empastes al laminar (decisiones de Emmanuel, 11-oct)
**Metas, por producto:**
- **Meta**: lo que sale en la semana (lunes a sábado o domingo).
- **Stock inicial**: los productos formados y congelados con que parte la semana. Desde el domingo antes sale solo de la Bitácora (dice "congelado"); antes es el **previsto**: lo que planearon dejar la semana anterior.
- **Dejar próx. semana**: el sobre stock que quieren dejar congelado para la semana siguiente (ej. 200 XL). Si no lo cambian, vale lo de la semana anterior ("como la semana pasada").
- **A formar = meta − stock inicial + dejar.** Ejemplo: 720 − 220 + 200 = 700 XL = 70 masas.
- El **PEM** y "Hay que elaborar" salen de "a formar". Las masas que sobran en el congelador se descuentan como antes, ahora comparando contra todo lo que hay que formar en la semana en curso (con la merma de laminado) menos lo ya descongelado para ella.
- **Cierre del viernes**: el sábado sugerido ya no toca lo que quieren dejar.

**Empastes:**
- No se descongelan: viven en el refri y se gastan **al laminar**, que se anota con **"Formé"** (empastes = piezas × masas por pieza de los productos con empaste). La anotación muestra "Empastes usados al laminar".
- "Descongelé masas" ya no resta empastes y avisa cuántos se necesitan para laminar esas masas y cuántos hay en el refri.
- "Congelado al cierre" dice "N empastes en el refri". Si quedan en negativo, avisa.
- Las anotaciones antiguas de "Descongelé" (antes de esta versión) siguen restando sus empastes, como cuando se anotaron.

**Rendimiento real de la semana:** las masas descongeladas el domingo cuentan para la semana que empieza.

**Archivos:** `app.js`, `congelado.js`, `estilos.css`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `firebase.js`, `index.html`. Reglas, script y Sistema Fën sin cambios (los cálculos compartidos siguen en v0.11.0).

**Revisar:**
- [ ] Metas de la próxima semana: poner "Dejar próx. semana" (ej. 200 XL) → "A formar" cambia y el PEM pide las masas de eso.
- [ ] Bitácora: "Descongelé masas" no baja los empastes; "Formé" sí, con "Empastes usados al laminar".
- [ ] Domingo, después del inventario: la meta que empieza el lunes muestra el stock inicial "congelado".

## Novedades v0.12.3 · título corto en Masas
- El título de Masas ahora es **"PEM · lun 5 al vie 9 oct"** (Plan de elaboración de masas), más corto para que no se desarme en el celular o la tablet. Abajo sigue "Para la meta del…".
- Archivos: `app.js`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `firebase.js`, `index.html`, `estilos.css`.

## Novedades v0.12.2 · las anuladas abajo
- En **todas las áreas**, en la Bitácora (Bollería), Merma, Bitácora de turno (Cafetería) y los movimientos de Bodega, las anotaciones **anuladas** bajan a **"Anuladas (N)"**, cerrado, al final de la lista. Adentro se ven como antes: tachadas y sin botón. Nada se borra.
- Archivos: `app.js`, `estilos.css`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `firebase.js`, `index.html`. Reglas, script y Sistema Fën sin cambios.

## Novedades v0.12.1 · Bitácora más fácil de leer · Masas = Plan de elaboración de masas (PEM)
- **Bitácora:** cada anotación tiene su título y **una línea por cosa** (nombre a la izquierda, número a la derecha), como "Congelado al cierre". Ejemplo: Inventario del congelador → Masa Base 84 masas / Empastes de Masa Base 46 / Croissant XL 220.
- **Masas:** el título ahora es **"Plan de elaboración de masas (PEM) · lun 5 al vie 9 oct"** y abajo, más chico, **"Para la meta del lun 12 al dom 18 oct"**. En Metas, el título vuelve a ser solo "Meta del…". El enlace de Metas dice "Repartir en el Plan de elaboración de masas (PEM)".
- Archivos: `app.js`, `estilos.css`, `README.md` y los demás (solo versión): `editor.js`, `config.js`, `firebase.js`, `index.html`. Reglas, script y Sistema Fën sin cambios.

## Novedades v0.12.0 · Bollería descuenta lo congelado · marcar todo · copiar de cualquier semana
**Bollería — se piden menos masas si ya sobran congeladas** (decisión de Emmanuel, 11-oct):
- En **Metas**, **Masas** y **Hoy**, "necesarias" ya descuenta las masas que sobran en el congelador. Ejemplo: "63 necesarias (70 de la meta − 7 congeladas)".
- Un solo aviso, arriba, explica por qué se piden menos: "Se piden menos masas porque ya hay congeladas. Masa Base: 70 de la meta − 7 congeladas = 63". En **"Cómo se calcula"**: en el congelador − ya elaboradas para esta meta − por descongelar para la meta en curso = de más.
- Sale de la **Bitácora**: inventario, elaboré, descongelé y merma congelada. El número no cambia en la semana mientras se anote lo que pasa.
- Se descongela la víspera: lo descongelado del **domingo antes al sábado** cuenta para la meta en curso; lo del domingo siguiente ya es para la próxima.
- El inventario del congelador ahora recuerda: **antes de contar, marquen las masas de hoy** (lo que se anota después se suma encima).
- **Sin inventario del congelador** no descuenta nada y lo avisa. **Antes de la semana de elaboración** tampoco (se pide la meta completa).
- Si lo congelado alcanza, la masa dice "Cubierta con lo congelado".
- Archivo nuevo: `congelado.js` (el cálculo). Prueba: `pruebas/cocina/congelado.test.mjs`.

**Bollería — Hoy:** arriba, el aviso **"Marcar terminada descuenta la bodega"** y el botón **"Marcar todo como hecho"** (masas, empastes y elaboraciones previas). Cada masa marcada así pasa a la Bitácora igual que con "Marcar terminada". Se puede deshacer una por una.

**Panadería — Planificación:**
- **"Copiar de otra semana"**: muestra las 12 semanas anteriores (y las 2 siguientes) que tienen plan, con cuántas recetas y unidades. Parte marcada la anterior.
- **"Deshacer la copia"**: la semana vuelve a como estaba antes de copiar (se guarda en el mismo plan, `antesDeCopiar`). Se ofrece durante 3 días después de copiar. Lo que se deshace queda en 0, nada se borra. La planilla se actualiza sola.

**Archivos:** `app.js`, `congelado.js` (nuevo), `editor.js`, `config.js`, `firebase.js`, `index.html`, `estilos.css`, `README.md`. Los cálculos compartidos con Sistema Fën (`modelo.js`, `bolleria.js`, `registros.js`, `consumo.js`) no cambian. **Reglas, script y Sistema Fën sin cambios.**

**Revisar:**
- [ ] Bollería: hacer el inventario del congelador en la Bitácora. En Masas de la próxima meta aparece el aviso con el descuento, y "Cómo se calcula" calza con lo que hay.
- [ ] Bollería, Hoy: "Marcar todo como hecho" → en la Bitácora aparece "Elaboré N masas… (desde Hoy)".
- [ ] Panadería: "Copiar de otra semana" en una semana vacía y luego "Deshacer la copia".

## Novedades v0.11.1 · Bollería: cuándo se elaboran las masas
- En **Metas** y **Masas**, justo debajo de "Meta del lun 19 al dom 25 oct", dice **"Las masas se elaboran del Lun 12 al Vie 16 (semana anterior)"**. Así queda claro que lo que se elabora esta semana es para la meta de la próxima.
- Archivos: `app.js`, `editor.js`, `config.js`, `firebase.js`, `index.html`, `estilos.css` y `README.md`. Los cálculos (`modelo.js`, `bolleria.js`, `registros.js`, `consumo.js`) no cambian: siguen en v0.11.0, igual que la copia de Sistema Fën. Reglas y script sin cambios.

## Novedades v0.11.0 · el conteo vale como cierre del día
Regla de Fën: la bodega se cuenta **al terminar la producción del día**. En Cafetería, después de cerrar la caja.
- **El conteo vale como cierre de su día.** Lo marcado como hecho ese día, aunque lo marquen después de contar, ya está incluido y no se descuenta de nuevo.
- **Desde el día siguiente** se descuenta todo lo hecho, lo vendido y la merma.
- **Las llegadas** van por hora: si llega mercadería después de contar, se suma.
- El diálogo de conteo lo explica.
- **Panadería, en Hoy:** un aviso recuerda que **"Marcar terminada" descuenta la bodega**, y el botón **"Marcar todo como hecho"** marca de una vez las recetas y elaboraciones que faltan del día. Pide confirmar y se puede deshacer una por una.
- Archivos: `consumo.js`, `app.js`, `estilos.css` y los demás `.js` (solo versión). Reglas y script sin cambios.

## Novedades v0.10.1 · arreglos del conteo en sacos
- **El plural:** decía "sacoses" cuando el envase se escribió en plural en Sistema Fën. Ahora entiende las dos formas: saco / sacos, caja / cajas, bidón / bidones.
- **El formulario de conteo y llegada:** el nombre va arriba y debajo los sacos + los kg sueltos, en una línea, también en el celular.
- **Bodega en el celular:** la lista de críticas se salía de la pantalla con textos largos. Ahora corta en líneas.
- Archivos: `app.js`, `consumo.js`, `estilos.css` y los demás `.js` (solo versión). Reglas y script sin cambios.

## Novedades v0.10.0 · contar en sacos
**Qué cambia:**
- **GitHub (fen-cocina):** `app.js`, `consumo.js`, `estilos.css`, `README.md` y los demás `.js` (solo versión).
- **Reglas y script:** no cambian.
- **Sistema Fën v0.41.0:** ahí se configura el envase de cada crítica.

**En Bodega:**
- Si Administración configuró un envase para una materia prima (por ejemplo, harina en **saco de 25 kg**), el conteo y la llegada se escriben en **sacos + lo suelto**, como "3 sacos + 5 kg". La app muestra el total al tiro: "= 80 kg".
- En las anotaciones queda el detalle: "Conteo: Harina T80 · 80 kg (3 sacos + 5 kg)".
- El stock también se ve en sacos: "85 kg · 3,4 sacos".
- Sin envase, se sigue contando en kg, litros o unidades.

**Lista de verificación v0.10.0**
- [ ] Abajo dice **Cocina v0.10.0**.
- [ ] Con la harina configurada en sacos, el conteo pide sacos + kg sueltos y muestra el total.

## Novedades v0.9.0 · conteo de bodega compartido entre áreas
**Qué cambia:**
- **GitHub (fen-cocina):** `app.js`, `estilos.css`, `firestore-produccion.rules`, `README.md` y los demás `.js` (solo versión).
- **Reglas v1.6.0:** colección `conteosmp`, con el último conteo de cada materia prima. La escribe el área que cuenta y la leen todas.
- **Sistema Fën v0.40.0:** la diferencia del conteo dice qué puede ser.

**En Bodega:**
- En la lista de críticas, cada una dice cuándo se contó por última vez, qué área y quién la contó, y cuánto había.
- En **Conteo de bodega**, al lado de cada materia prima aparece el último conteo.
- Si **otra área ya la contó hoy**, aparece un aviso en color: "Panadería ya la contó hoy a las 08:10: si la cuentan de nuevo, vale la última".
- Si se anula un conteo que era el último, deja de aparecer como último.
- El conteo que vale es siempre el más reciente, sea de la área que sea. La diferencia con lo que decía la cuenta se ve en Sistema Fën.

**Orden:** reglas v1.6.0 → Sistema Fën v0.40.0 → Cocina v0.9.0.

**Lista de verificación v0.9.0**
- [ ] Abajo dice **Cocina v0.9.0**.
- [ ] Contar una materia prima en un área. En otra área, en Bodega, aparece "Contada hoy … · (área) · …". Al abrir Conteo de bodega se ve el aviso.

## Novedades v0.8.0 · Cafetería crea sus recetas; su consumo entra a la bodega
**Qué cambia:**
- **GitHub (fen-cocina):** `editor.js`, `consumo.js`, `app.js`, `README.md` y los demás `.js` (solo versión).
- **Reglas:** no cambian (siguen las v1.5.0). **Script:** no cambia (sigue el v2.8.0).
- **Sistema Fën v0.38.0.**

**Qué cambia en Cocina y en la bodega:**
- **Cafetería crea y edita sus recetas en Cocina**, como las otras áreas. Cada cambio es una propuesta que apruebas en Sistema Fën.
- **Consumo de Cafetería en la bodega** (lo calcula Sistema Fën):
  - lo **vendido en la caja** de productos vinculados a una receta de Cafetería, bajado por su receta hasta las materias primas (café, leche, vasos…);
  - los gramos de café de la **bitácora de turno** (calibraciones, café botado, pruebas), descontados de la materia prima que elijas en Sistema Fën.
- Lo que se vende en la cafetería pero es de otra área (croissant, pan) no descuenta aquí: lo cuenta su área al hacerlo.
- Cafetería cuenta la bodega **después de cerrar la caja** (desde v0.11.0 el conteo vale como cierre del día).

**Lista de verificación v0.8.0**
- [ ] Abajo dice **Cocina v0.8.0**.
- [ ] En Cafetería → Recetas aparece **Nueva receta**.

## Novedades v0.7.0 · Bodega: llegadas, conteo y stock de las materias primas críticas (P5)
**Qué cambia:**
- **GitHub (fen-cocina):** `consumo.js` (**nuevo**), `app.js`, `modelo.js`, `bolleria.js`, `estilos.css`, `index.html`, `config.js`, `firestore-produccion.rules`, `README.md` y los demás `.js` (solo versión).
- **Reglas v1.5.0:** las áreas pueden **leer** `stockmp` (qué materias primas son críticas, su mínimo y cómo están). Solo Administración lo cambia.
- **Script de Producción v2.8.0:** copia llegadas y conteos a `MP_stock_movimientos`.
- **Sistema Fën v0.37.0:** el stock, el consumo por área y las alertas.

**Cómo funciona (bodega común: un stock por materia prima):**
- Sección nueva **Bodega** en las cuatro áreas:
  - **Llegó mercadería:** qué llegó y cuánto (en kg, litros o unidades), con proveedor o factura.
  - **Conteo de bodega:** lo que hay ahora. El conteo reemplaza lo que decía la cuenta desde ese momento.
  - Lo que cuenta o recibe un área vale para todas.
- **El stock baja solo con lo que marcan como hecho:**
  - Panadería: recetas terminadas.
  - Bollería: masas elaboradas con su empaste, y productos formados (bitácora). *(Desde v0.14.0: la masa sola; los empastes con "Hice empastes".)*
  - Pastelería: recetas terminadas.
  - Además, la merma de materias primas.
  - Las recetas se bajan por sus sub recetas hasta las materias primas. Una preparación de otra área la cuenta el área que la hace (la crema pastelera la cuenta Pastelería, no Bollería al rellenar). El pie de masa madre no se cuenta.
  - Cafetería todavía no descuenta: eso irá con las ventas.
- **Aviso arriba** cuando una materia prima crítica está bajo el mínimo, o va a quedar bajo el mínimo en los próximos días con lo planificado.
- **Las jefas ven cantidades, nunca precios.** El stock lo calcula Sistema Fën; la tablet muestra el último cálculo.

**Orden:**
1. Reglas v1.5.0 (consola de Firebase de fen-produccion → Firestore → Reglas → Publicar).
2. Script v2.8.0 (Seguridad y SistemaFen → Nueva versión). Ping: 2.8.0.
3. Sistema Fën v0.37.0 → Producción → Bodega → **Calcular**, y marca las críticas con su mínimo (harina, mantequilla, leche…).
4. Cocina v0.7.0.
5. Primer **conteo de bodega** de cada crítica: desde ahí la cuenta se mueve sola.

**Lista de verificación v0.7.0**
- [ ] Abajo dice **Cocina v0.7.0**. Cada área tiene **Bodega**.
- [ ] En Bodega aparecen las críticas que marcaste en Sistema Fën, con "Falta un conteo".
- [ ] Hacer el conteo. En Sistema Fën → Bodega → Calcular, el stock es lo contado.
- [ ] Marcar una receta terminada, volver a calcular: el stock baja.
- [ ] Anotar una llegada: sube, y aparece en la hoja MP_stock_movimientos.

## Novedades v0.6.0 · Merma en las cuatro áreas y Cafetería entra a la app nueva (P4b)
**Qué cambia:**
- **GitHub (fen-cocina):** `registros.js` (**nuevo**), `app.js`, `bolleria.js`, `estilos.css`, `index.html`, `config.js`, `README.md` y los demás `.js` (solo versión).
- **Reglas:** no cambian (siguen las v1.4.0).
- **Script de Producción v2.7.0:** copia la merma y la bitácora de café a la planilla, y le da a Sistema Fën los costos de la merma.
- **Sistema Fën v0.36.0:** la merma valorizada y los gramos por shot de Cafetería.

**Merma (Panadería, Bollería, Pastelería y Cafetería):** sección nueva **Merma**.
- **Anotar merma**: se busca qué se perdió (producto, preparación o materia prima del área) y se anotan la cantidad, el motivo y una nota opcional. Queda a nombre de quien entró con PIN.
  - La unidad la pone la app: unidades o gramos según la receta; g, ml o unidades según la materia prima.
  - Motivos: derrame o error, quemado o mal horneado, vencimiento, devolución de cliente, prueba de receta, otro.
- Se ve lo perdido por **hoy, semana o mes**, sumado por ítem, y cada anotación se puede **anular** (no se borra).
- **Sin precios:** las jefas no ven costos. Tú la ves valorizada en Sistema Fën.
- **Bollería y el congelado:** al elegir un producto que va al congelador o una masa base, aparece "Se perdió estando congelado".
  - **Marcado:** baja el stock congelado. Una masa deja su empaste.
  - **Sin marcar:** no toca el stock.
  - Ejemplo: descongelan 100 croissant y se queman 10. Los 100 ya salieron del stock al anotar "Descongelé", así que esos 10 **no** se marcan.

**Cafetería · Bitácora de turno** (Cafetería entra a la app nueva: Bitácora de turno, Merma y Recetas):
- **Calibración** (shots × gramos por shot), **Café botado** y **Prueba de receta**, en gramos de café, con nota.
- La anotación queda a nombre de **quien entró con PIN**. Si anota por un compañero, lo elige de la lista de personas de Cafetería (las de Asistencia). Ya no hay lista de baristas aparte ni turno mañana/tarde.
- Totales de **hoy, la semana o el mes**: calibración, café botado, pruebas y total de café.
- Los gramos por shot salen de la configuración de Cafetería en Sistema Fën (14 g si está vacía, como la app actual). Se pueden cambiar en cada calibración.

**Planilla:** la merma va sola a **Registro_merma** (con su costo, como la app actual) y la bitácora de café a **CAF_registros**.
- Se agregan las columnas id_cocina, anotado_por y anulado.
- Copiar dos veces no duplica, y una anotación anulada queda marcada en "anulado".

**Orden:**
1. Script v2.7.0 (Seguridad y SistemaFen → Nueva versión). Ping: 2.7.0.
2. Sistema Fën v0.36.0. Opcional: Producción → Configuración → Cafetería → gramos por shot.
3. Cocina v0.6.0.
4. Para que la tablet de Cafetería entre: Sistema Fën → Producción → Cuentas de las áreas (una cuenta de Cafetería, o "También entra a" en una tablet existente). Sus personas salen de Asistencia ("Leer la planilla" → "Copiar").

**Lista de verificación v0.6.0**
- [ ] Abajo dice **Cocina v0.6.0**. Cada área tiene la sección **Merma**.
- [ ] Anotar una merma de prueba y anularla. En la planilla, Registro_merma tiene la fila con "anulado = si" (tarda unos segundos).
- [ ] Bollería: una merma marcada "se perdió congelado" baja el congelado en la Bitácora; una sin marcar, no.
- [ ] Cafetería: anotar una calibración. El total cuadra y aparece en CAF_registros.
- [ ] Sistema Fën → Producción → Merma → "Ver": aparece valorizada.

## Novedades v0.5.1 · una tablet en más de un área
**Qué cambia:**
- **GitHub (fen-cocina):** `app.js`, `index.html`, `estilos.css`, `config.js`, `README.md` y los demás `.js` (solo versión).
- **Reglas v1.4.0** (`firestore-produccion.rules`): una cuenta puede tener varias áreas (`areas`). En cada una ve y cambia lo mismo que una cuenta propia de esa área. Las cuentas de una sola área siguen igual.
- **Script de Producción v2.6.0**: el PIN y la copia a la planilla usan el área en que está la tablet.
- **Sistema Fën v0.35.0**: ahí se marca a qué otras áreas entra cada cuenta.

**Cómo funciona en la tablet:**
- Arriba aparece **Cambiar de área** (solo si la cuenta tiene más de una). Elige el área y listo.
- Antes de cambiar se guarda lo que estaba escrito (cantidades, plan, notas, receta en edición) **en el área donde se escribió**.
- En el área nueva se pide el **PIN de una persona de esa área**. Si la persona que estaba también es de esa área (en Asistencia), sigue sin PIN.
- La pantalla del PIN también tiene "Cambiar de área", por si entraste a la equivocada.
- Al recargar, la tablet vuelve a la última área en que estuvo.

**Orden:**
1. Reglas v1.4.0 (consola de Firebase de fen-produccion → Firestore → Reglas → pegar → Publicar).
2. Script v2.6.0 (Seguridad y SistemaFen → Nueva versión). Ping: 2.6.0.
3. Sistema Fën v0.35.0 → Producción → Cuentas de las áreas → **Cambiar** en la cuenta → marca "También entra a" → Guardar.
4. Cocina v0.5.1. En la tablet, recarga la página.

**Lista de verificación v0.5.1**
- [ ] Abajo dice **Cocina v0.5.1**.
- [ ] En la tablet compartida aparece "Cambiar de área"; en las de una sola área, no.
- [ ] Cambiar a la segunda área: pide el PIN de alguien de esa área y se ven sus secciones (por ejemplo, Bollería con Bitácora, Metas y Masas).
- [ ] En la segunda área se carga todo (no sale "Este equipo perdió el permiso…"). Si sale, revisa que las reglas publicadas sean las v1.4.0.
- [ ] Escribir algo, cambiar de área y volver: quedó guardado donde se escribió.

## Novedades v0.5.0 · Pastelería entra a la app nueva (P4a)
**Qué cambia:**
- **GitHub (fen-cocina):** `app.js`, `editor.js`, `bolleria.js`, `modelo.js`, `index.html`, `config.js`, `estilos.css`, `README.md`.
- **Reglas v1.3.0** (`firestore-produccion.rules`): cada área puede **leer** (no cambiar) el plan y las metas de las otras. Pastelería lo necesita para sus sugerencias.
- **Script de Producción v2.5.0** y **Sistema Fën v0.34.0**, para pasar las recetas de Bollería a Pastelería.

**Orden:**
1. Reglas v1.3.0.
2. Script v2.5.0 (nueva implementación).
3. Sistema Fën v0.34.0 → Producción → **Pasar recetas de Bollería a Pastelería**: revisa las marcadas y pásalas.
4. Cocina v0.5.0.
5. Autoriza la tablet de Pastelería con su cuenta. En Asistencia deben estar las personas de Pastelería; Sistema Fën las copia con "Leer la planilla" → "Copiar".

**Pastelería: Hoy, sin plan semanal** (como "Recetas del día" de la app actual, pero compartido y con fecha):
- Cada receta aprobada de Pastelería muestra:
  - **Semana: sugerido**: lo que piden los productos que planificaron Bollería (metas) y Panadería (plan) esa semana. Por ejemplo, 50 croissant relleno × 40 g = 2 kg de crema, con de qué productos sale;
  - **hecho** en la semana (lo marcado como terminado) y **cuánto falta**.
- **Hoy**: escriben cuánto hacen (gramos o unidades, según la receta) y la receta aparece arriba **escalada**, con **Tandas** y **Marcar terminada**. Lo terminado suma a la semana. La dupla lo ve al instante.
- **Insumos de hoy** y **Notas del día**.
- Pastelería también **crea y edita recetas** en Cocina, con propuestas que apruebas en Sistema Fën, igual que Panadería y Bollería.

**Lista de verificación v0.5.0**
- [ ] Reglas v1.3.0, script v2.5.0 (ping), Sistema Fën v0.34.0; abajo dice **Cocina v0.5.0**.
- [ ] Sistema Fën → Producción → "Ver las recetas de Bollería": vienen marcados los rellenos y cremas (sub recetas). Los productos como "Croissant relleno" no se marcan. Pasar.
- [ ] En la planilla, las recetas movidas están en PAS_recetas con el mismo ID, y hay registro en "Movimientos_recetas".
- [ ] Tablet de Pastelería: Hoy muestra sus recetas con lo sugerido de la semana. Escribir una cantidad → aparece escalada → Marcar terminada → suma a "hecho".
- [ ] Bollería y Panadería siguen igual.

## Novedades v0.4.2 · formulario de recetas más ordenado
Incluye todo lo de la v0.4.1. Qué cambia en el formulario:
- **Ingredientes en una grilla fija:**
  - en el celular, el nombre arriba con la × al lado, y debajo **Unidades · Gramos · %** en casillas iguales;
  - en la tablet horizontal o el computador, todo en una línea;
  - las filas siempre calzan: "—" donde no aplica, por ejemplo las unidades de una materia prima.
- **Rinde y En** del mismo alto, lado a lado, con una ayuda debajo.
- **Bloques con fondo tenue:** Ingredientes con el color del área muy suave; Insumos y Pasos en gris arena. Cada bloque tiene su título y su botón "+".
- **Pasos numerados** (Paso 1, Paso 2…).
- **Botones:**
  - en el celular, uno bajo otro, primero **Enviar a revisión**, después **Marcar en prueba**, y "Anular propuesta" aparte, como enlace;
  - en pantallas anchas, en una fila a la derecha.

**Qué cambia en GitHub (fen-cocina):** `editor.js`, `app.js`, `bolleria.js`, `index.html`, `config.js`, `estilos.css` y `README.md`.

## Novedades v0.4.1 · arreglo: no aparecían materias primas al armar una receta
- Una materia prima con **"áreas habilitadas" vacío** en la planilla sirve para **todas las áreas**, como en la app actual. Cocina solo mostraba las que nombraban el área.
- **Buscador nuevo de ingredientes e insumos:** se escribe parte del nombre ("huev") y aparecen hasta 8 opciones para tocar, sin importar tildes. Reemplaza la lista del navegador, que no funcionaba igual en todas las tablets.
- Si no hay ninguna con ese nombre para el área, lo dice y sugiere "Falta una materia prima".
- **Las casillas nuevas (ingrediente, insumo, paso) ya no desaparecen solas.** Al agregar una vacía, el guardado automático no la incluye y Firebase responde con los campos en otro orden. La app creía que la dupla había cambiado algo y redibujaba el formulario. Ahora compara por contenido.
- Vale igual para Panadería y Bollería (usan el mismo formulario).

**Qué cambia en GitHub (fen-cocina):** `editor.js`, `app.js`, `bolleria.js`, `index.html`, `config.js`, `estilos.css` y `README.md`. Reglas, script y Sistema Fën **sin cambios**.

## Novedades v0.4.0 · Recetas: formulario, propuestas y aprobación (P3)
**Qué cambia:**
- **GitHub (fen-cocina):** nuevo `editor.js`; cambian `app.js`, `bolleria.js`, `modelo.js`, `index.html`, `config.js`, `estilos.css` y `README.md`.
- **Reglas v1.2.0** (`firestore-produccion.rules`): consola de Firebase de fen-produccion → Firestore → Reglas → pegar → **Publicar**.
- **Script de Producción v2.4.0** y **Sistema Fën v0.33.0**, que traen la aprobación.

**Orden de instalación:** 1) reglas v1.2.0 · 2) script v2.4.0 (con implementación nueva) · 3) Sistema Fën v0.33.0 · 4) Cocina v0.4.0.

**Desde ahora, Panadería y Bollería crean y cambian recetas solo en Cocina.** Pastelería y Cafetería siguen con el formulario de la app actual hasta su etapa (P4).

**En Cocina → Recetas** (Panadería y Bollería):
- **Nueva receta** y **Editar (nueva versión)** en una receta vigente. Cada cambio es una **propuesta**: la receta vigente **no cambia** y sigue en la planificación hasta que la apruebes.
- **Formulario:**
  - nombre, tipo (receta o sub receta), rinde (unidades o gramos);
  - ingredientes: se buscan entre las materias primas y sub recetas habilitadas para el área;
  - una sub receta que rinde unidades se pone en unidades (0,05 masa = 80 g);
  - Panadería: % panadero en vivo, y se puede escribir el % o los gramos;
  - Bollería: clasificación (producto, masa base/empaste/poolish, relleno), peso de 1 unidad, "se planifica en Masas", "se congela" y unidades por caja;
  - insumos (envases), pasos y notas internas.
  - **Lo escrito se guarda solo.** Sin costos: la jefa no ve precios.
- **Estados:** Borrador → **En prueba** → **Enviar a revisión**. "Retirar de revisión" la devuelve a borrador. "Anular" la deja en el registro.
  - En revisión, sus datos no se pueden cambiar.
  - **Devuelta**: muestra tu comentario y se corrige.
  - Las recetas en prueba **no** entran a la planificación ni a las metas (como hoy).
- **Falta una materia prima:** se pide una nueva (nombre, si es ingrediente o insumo, cómo se compra) o que se habilite una de otra área. Te llega a Sistema Fën y, cuando la resuelves, aparece para elegirla.
- **Panadería · "Llevar el ajuste a la receta"**, en el modal de harina/agua cuando hay un ajuste guardado: envía a revisión la receta con esos % y esa harina. El ajuste sigue valiendo mientras la apruebas.

**Lista de verificación v0.4.0**
- [ ] Reglas v1.2.0 publicadas · script v2.4.0 (ping) · Sistema Fën v0.33.0 · abajo dice **Cocina v0.4.2**.
- [ ] Bollería → Recetas → Nueva receta → enviar a revisión → aparece en Sistema Fën → Producción → **Desde Cocina** con su costo.
- [ ] Aprobarla → aparece en Recetas y en Metas de Bollería; en la planilla queda como consolidada.
- [ ] Devolver otra con un comentario → la jefa lo ve y la puede corregir.
- [ ] Pedir una materia prima → crearla en Sistema Fën con su precio → aparece para elegirla en Cocina.

## Novedades v0.3.0 · Bitácora de Bollería (P2b)
**Qué cambia en GitHub (fen-cocina):** `app.js`, `bolleria.js`, `modelo.js`, `index.html`, `config.js`, `estilos.css` y `README.md`. **Las reglas no cambian** (v1.1.0) y Sistema Fën tampoco (v0.32.0).

Nueva sección **Bitácora** en la tablet de Bollería: lo que realmente pasó cada día, con quién lo anotó y a qué hora. La dupla lo ve al instante.
- **Anotar:**
  - **Inventario del congelador**: lo que cuentan. Reemplaza lo anterior y desde ahí todo se mueve solo. **Háganlo el primer día.**
  - **Elaboré masas**: +masas y +empastes congelados. *(Desde v0.14.0: solo masas; los empastes se anotan con "Hice empastes".)*
  - **Descongelé masas**: −masas y −empastes. El empaste sale con su masa.
  - **Formé**: piezas formadas, cuántas van al congelador; las demás se hornean ese día.
  - **Horneé desde el congelador**.
  - "Marcar terminada" en una masa de **Hoy** la anota sola ("Elaboré 10 masas… (desde Hoy)"). Deshacer la anula.
- **Nada se borra**: "Anular" deja la anotación tachada, con quién la anuló, y deja de contar.
- **Congelado al cierre del día**, que sale de la bitácora y no del plan:
  - masas y empastes por masa base, y productos (en cajas si la receta tiene "unidades por caja");
  - avisa si no cabe en el congelador (capacidades en Sistema Fën) o si algo queda en negativo;
  - pasa de una semana a otra sin volver a 0.
- **Meta de la semana**: "van 35 de 100 · faltan 65". Cuenta lo horneado: lo formado y horneado el mismo día más lo horneado desde el congelador.
- **Rendimiento real de la semana**: masas descongeladas contra piezas formadas, pasadas a masas según la receta.
- **Cierre del viernes (para imprimir)**:
  - congelado al cierre;
  - qué **hornear el sábado**: se sugiere lo que falta de la meta, sin pasar de lo congelado;
  - qué **descongelar el domingo** para el lunes: lo deciden ellas.
  - "Guardar e imprimir" abre la impresión. Para tener PDF, elijan "Guardar como PDF".

**Lista de verificación v0.3.0**
- [ ] Tablet de Bollería: abajo dice **Cocina v0.3.0**. Aparece **Bitácora**.
- [ ] Bitácora → **Inventario del congelador** con lo que hay hoy → el congelado lo muestra.
- [ ] Formé → 10 croissant XL, 6 al congelador: el congelado sube 6 y la meta suma 4.
- [ ] Anular esa anotación: todo vuelve atrás y la anotación queda tachada.
- [ ] Viernes → Cierre del viernes → Guardar e imprimir.

## Novedades v0.2.0 · Bollería, primera parte (P2a)
**Qué cambia:**
- **GitHub (fen-cocina):** nuevo `bolleria.js`; cambian `app.js`, `modelo.js`, `index.html`, `config.js`, `estilos.css` y `README.md`.
- **Reglas de Firebase v1.1.0** (`firestore-produccion.rules`): consola de Firebase de **fen-produccion** → Firestore → Reglas → borrar todo → pegar → **Publicar**. Agregan la colección `metas`. **Sin esto, Bollería no puede guardar las metas.**
- **Sistema Fën v0.32.0** (Configuración de Producción: la amasadora en kg).

La tablet de Bollería ahora tiene **Hoy**, **Metas**, **Masas** y **Recetas**:
- **Metas** (por semana, "meta del lun 19 al dom 25 oct"): piezas por producto. Se ofrecen las recetas **aprobadas** que llevan una masa base. Para cada una, la app dice cuánto rinde 1 masa (Croissant XL: 0,1 masa → rinde 10). Calcula:
  - **masas base** enteras y kg (600 XL → 60 masas, 96 kg), con la merma de laminado si la configuraste;
  - **empastes**: 1 por masa, con los gramos que piden las recetas (30 g × 10 = 300 g); *(desde v0.14.0 no van en Metas ni en el PEM: se hacen la semana de la meta)*
  - avisa si dos productos de la misma masa piden distinto empaste por masa.
- **Masas** (para esa meta, se elaboran de lunes a viernes de la semana anterior):
  - masas por día, cada número se guarda solo;
  - **Repartir parejo**;
  - "Faltan N", "Sobran N" o "Completo";
  - por día: tandas (en masas enteras según la amasadora), empastes y kilos *(v0.14.0: sin empastes)*. Avisa cuando un día pasa de las tandas normales.
- **Hoy:** las masas del día. Se calculan de las Masas de la meta de la semana siguiente. Muestra:
  - tandas según la amasadora (10 masas con 5 por tanda → 2 tandas de 5), con la receta escalada por tanda; se pueden cambiar con "Tandas";
  - las elaboraciones previas (Poolish Masa Base), los empastes del día y los insumos *(v0.14.0: en vez de los empastes del día, "Empastes de la semana")*;
  - "Marcar terminada" y notas del día, compartidas con la dupla.
- **Formado y horneado** de la meta en curso: se anotan en la **Bitácora** (v0.3.0).

Cómo reconoce las recetas:
- **masa base**: clasificación "Masa Base" con "aparece en la grilla" marcado;
- **empaste**: sub receta de masa base que no va a la grilla (o se llama "Empaste");
- **producto**: receta que lleva una masa base.

**Lista de verificación v0.2.0**
- [ ] Reglas v1.1.0 publicadas.
- [ ] Sistema Fën → Producción → Configuración → Bollería: amasadora en kg.
- [ ] Tablet de Bollería: abajo dice **Cocina v0.2.0**. Aparecen Hoy, Metas, Masas y Recetas.
- [ ] Metas → poner la meta de la próxima semana: aparecen las masas y los empastes.
- [ ] Masas → Repartir parejo → Hoy (el día que toca) muestra las masas en tandas.
- [ ] Panadería sigue igual.

## Novedades v0.1.2
**Qué cambia en GitHub:** los mismos 6 archivos de la v0.1.1. Si aún no subiste la v0.1.1, esta la incluye.

- **Peso por pieza en el ajuste**, en las recetas que rinden unidades (Masa ciabatta, Hogaza…). El modal muestra:
  - cuánto pesa cada pieza con los % que pusiste, por ejemplo: "194 g (receta 198 g)";
  - la harina base que mantiene el peso, por ejemplo: "102,1 g", calculada como harina × 198 / 194;
  - un botón **Usar** que la pone en "Harina base". Se puede corregir a mano antes de guardar.
- Sirve igual si bajas el agua, la masa madre o los dos.
- En las masas que van por kilos (masa madre) no aparece, porque esos kilos ya se mantienen solos.

## Novedades v0.1.1 (ajustes de Panadería)

**Qué cambia en GitHub:** `app.js`, `modelo.js`, `index.html`, `config.js`, `estilos.css` y `README.md`. Las reglas de Firebase y el script de Producción **no cambian**.

- **Elaboraciones previas con tarjeta completa** (Masa ciabatta, Masa madre blanca, Poolish…). Cada tarjeta muestra:
  - los ingredientes a la vista;
  - **Tandas**: en 1 a 6 tandas, o "de hasta N". Va en unidades si la receta rinde unidades (Masa ciabatta: "de hasta 30 un") y en kg si va por peso (masa madre);
  - **"Dividir siempre así"**: los días siguientes la tarjeta ya sale dividida ("· como siempre"). Lo guardado en un día manda sobre lo de siempre;
  - **Ajustar harina / agua**, también en las sub recetas:
    - Masa ciabatta (por unidades) mantiene la harina de cada unidad;
    - Masa madre (por peso) mantiene los kilos que piden los panes y cambia las proporciones;
  - **Marcar terminada**.
- Si una receta no trae % panadero (por ejemplo, la masa madre), los % se calculan de sus gramos.
- **Producto hecho de una masa** (Ciabatta = 1 un de Masa ciabatta):
  - la tarjeta muestra "Masa ciabatta 150 un · 29,7 kg", sin el "1 %" que venía de la planilla;
  - no tiene botón de ajuste; dice que la harina y el agua se ajustan en la masa;
  - antes el modal de la Ciabatta mostraba "Harina base 100 g · Masa Ciabatta 1 %", que no servía para nada.
- Un ajuste en la masa (por ejemplo, el agua de la Masa ciabatta) pasa a la masa madre que va dentro, al pie de masa madre y a los insumos.

## Qué trae la v0.1.0 (etapa P1)

| Área | Qué tiene |
|---|---|
| **Panadería** | **Hoy**, **Planificación** y **Recetas** |
| Bollería | **Hoy**, **Bitácora** (v0.3.0), **Metas**, **Masas** y **Recetas** |
| Pastelería | **Hoy** (recetas del día, v0.5.0) y **Recetas** |
| Cafetería | Solo **Recetas** (consulta). Sigue en la app actual hasta su etapa |

**Hoy (Panadería)**, para cualquier día (flechas ‹ ›):
- **Pie de masa madre** los días que toca (por defecto martes y viernes). Si el período cruza a la semana siguiente, usa el plan de esa semana; antes tomaba el lunes de la semana en curso.
- **Elaboraciones previas** (masa madre, poolish…) con sus ingredientes y "Marcar hecho".
- **Insumos del día**: la harina en sacos de 25 kg, y la lista completa.
- **Una tarjeta por receta**, con los ingredientes escalados y el % panadero.
- **Ajustar harina / agua**, para cuando llega una harina distinta:
  - vale para la tarjeta, las **tandas**, las elaboraciones previas y los insumos;
  - se elige "Solo este día" o "Desde este día, hasta que lo quite";
  - lo ve la dupla y queda quién lo hizo.
- **Tandas**: dividir en 1 a 5 tandas; cada una muestra su receta escalada.
- **Marcar terminada**, con quién y a qué hora. Se comparte con la dupla.
- **Notas del día**, compartidas.

**Planificación (Panadería):**
- recetas aprobadas × días, por semana ("lun 12 al dom 18 oct");
- cada celda se guarda sola;
- agregar receta;
- copiar la semana anterior;
- la planilla `PAN_planificacion` se actualiza sola unos segundos después.

**Recetas:** las del área, con su estado; detalle escalado a la cantidad que se quiera, con los pasos.

**Llevar el ajuste a la receta**: desde v0.4.0.

## Entrada
1. **Autorizar el equipo** (una vez, lo haces tú): la cuenta del área (correo y contraseña de Firebase).
2. Cada persona toca su nombre y pone su **PIN de Asistencia**. Lo revisa el script de Producción con Asistencia, con el mismo bloqueo tras varios intentos.
3. La persona queda recordada **12 horas** en ese equipo. "Cambiar" deja entrar a otra persona.
4. "Quitar autorización de este equipo" (abajo) obliga a autorizarlo de nuevo.

Quién entra a cada área sigue saliendo de la app actual (Administración → Seguridad). Sistema Fën lo copia con "Leer la planilla".

## Archivos y dónde va cada uno
```
index.html, app.js, modelo.js, bolleria.js, registros.js, consumo.js, congelado.js, cafeteria.js, editor.js, firebase.js, estilos.css, logo-fen.png  → GitHub, repo fen-cocina (raíz)
config.js                          → GitHub, raíz (lleva el firebaseConfig de fen-produccion)
README.md                          → GitHub, raíz
firestore-produccion.rules (v1.8.0) → consola de Firebase de fen-produccion → Firestore → Reglas (la copia en GitHub es respaldo)
```

## Instalación (una vez)
1. **Firebase fen-produccion** creado con las 5 cuentas (la tuya y la de cada área), registro desactivado y app web registrada (ver mensaje del 10-oct).
2. **Reglas:** Firestore → Reglas → borrar todo → pegar `firestore-produccion.rules` → **Publicar**.
3. **admins:** Firestore → Datos → Iniciar colección `admins` → ID del documento = **tu UID** → campo `ok` (booleano) `true`.
4. **config.js:** pega tu firebaseConfig (o mándamelo y lo dejo puesto).
5. **Script de Producción v2.3.0** (ver su README) y **Sistema Fën v0.31.0** → Producción: conectar, asignar las cuentas de las áreas, "Leer la planilla" → "Copiar". El control de totales debe decir **Todo cuadra**.
6. **GitHub:** repo `fen-cocina` → sube todos los archivos → Settings → Pages → rama main. Abajo de la app debe decir **Cocina v0.5.0**.
7. En la tablet de Panadería, abre la dirección, autoriza con la cuenta de Panadería y prueba el PIN.

## Lista de verificación v0.1.1 y v0.1.2
- [ ] Abajo dice **Cocina v0.1.2** (si no, recarga la página una vez).
- [ ] Masa ciabatta → Ajustar → baja el agua 2 puntos: dice el peso por pieza nuevo y la harina sugerida. "Usar" → "igual que la receta".
- [ ] Hoy: "Elaboraciones previas" muestra Masa ciabatta con sus ingredientes, en unidades y kg.
- [ ] Masa ciabatta → Tandas → "de hasta 30" → se ve dividida. Con "Dividir siempre así", el día siguiente también.
- [ ] Masa madre blanca → Tandas → 2 → dos mitades. Ajustar → cambiar el agua → el total no cambia y las proporciones sí.
- [ ] La Ciabatta ya no tiene el modal raro: dice "se ajustan en Masa ciabatta".

## Lista de verificación v0.1.0
- [ ] La tablet de Panadería pide el PIN y muestra solo a las personas de Panadería.
- [ ] Hoy muestra las recetas del plan, el pie de masa madre el martes y el viernes, y los insumos.
- [ ] Un ajuste de agua cambia la tarjeta y las tandas. En otro equipo de Panadería se ve igual.
- [ ] "Marcar terminada" en un equipo aparece en el otro.
- [ ] Cambiar un número en Planificación, esperar 30 s: aparece en `PAN_planificacion` de la planilla.
- [ ] Una tablet autorizada con la cuenta de Bollería muestra solo Recetas y el aviso de la app actual.

## Si algo sale mal
- **"No se pudo leer el área de esta cuenta"**: falta asignarla en Sistema Fën → Producción → Cuentas de las áreas, o las reglas no están publicadas.
- **El PIN dice que no hay conexión con el servidor**: revisa que el script de Producción esté en v2.3.0 (`…/exec?action=ping`).
- **"Planilla pendiente"** en Planificación: el plan está guardado en la base nueva. Solo falta la copia, y se reintenta sola.
- La app actual de Producción sigue funcionando igual. Volver a ella es usar la dirección de siempre.
