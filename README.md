# fën · Cocina · v0.9.0

**App nueva de las jefas** · repo `fen-cocina` · dirección: `https://panaderiafen.github.io/fen-cocina/` · 10 de octubre de 2026 (v0.1.1 y v0.1.2: 10–11 de octubre; v0.2.0 a v0.9.0: 11 de octubre)

Reemplaza de a poco a la app de Producción. Guarda directo en la base nueva (Firebase **fen-produccion**):
- abre al tiro con lo guardado en el equipo;
- la dupla ve lo mismo al instante;
- cada número se guarda por separado (nunca "borrar la semana y reescribir");
- si algo no se guardó, lo dice;
- la planilla de Producción recibe una copia automática del plan semanal.

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
- Un consejo para Cafetería: el conteo de bodega cuadra mejor si se hace **antes de abrir o después de cerrar**. Las ventas de una caja ya cerrada cuentan al final de su día.

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
  - Bollería: masas elaboradas con su empaste, y productos formados (bitácora).
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
  - **Elaboré masas**: +masas y +empastes congelados.
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
  - **empastes**: 1 por masa, con los gramos que piden las recetas (30 g × 10 = 300 g);
  - avisa si dos productos de la misma masa piden distinto empaste por masa.
- **Masas** (para esa meta, se elaboran de lunes a viernes de la semana anterior):
  - masas por día, cada número se guarda solo;
  - **Repartir parejo**;
  - "Faltan N", "Sobran N" o "Completo";
  - por día: tandas (en masas enteras según la amasadora), empastes y kilos. Avisa cuando un día pasa de las tandas normales.
- **Hoy:** las masas del día. Se calculan de las Masas de la meta de la semana siguiente. Muestra:
  - tandas según la amasadora (10 masas con 5 por tanda → 2 tandas de 5), con la receta escalada por tanda; se pueden cambiar con "Tandas";
  - las elaboraciones previas (Poolish Masa Base), los empastes del día y los insumos;
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
index.html, app.js, modelo.js, bolleria.js, editor.js, firebase.js, estilos.css, logo-fen.png  → GitHub, repo fen-cocina (raíz)
config.js                          → GitHub, raíz (lleva el firebaseConfig de fen-produccion)
README.md                          → GitHub, raíz
firestore-produccion.rules (v1.3.0) → consola de Firebase de fen-produccion → Firestore → Reglas (la copia en GitHub es respaldo)
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
