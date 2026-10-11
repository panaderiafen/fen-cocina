# fën · Cocina · v0.4.0

**App nueva de las jefas** · repo `fen-cocina` · dirección: `https://panaderiafen.github.io/fen-cocina/` · 10 de octubre de 2026 (v0.1.1 y v0.1.2: 10–11 de octubre; v0.2.0 a v0.4.0: 11 de octubre)

Reemplaza de a poco a la app de Producción. Guarda directo en la base nueva (Firebase **fen-produccion**):
- abre al tiro con lo guardado en el equipo;
- la dupla ve lo mismo al instante;
- cada número se guarda por separado (nunca "borrar la semana y reescribir");
- si algo no se guardó, lo dice;
- la planilla de Producción recibe una copia automática del plan semanal.

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
- [ ] Reglas v1.2.0 publicadas · script v2.4.0 (ping) · Sistema Fën v0.33.0 · abajo dice **Cocina v0.4.0**.
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
| Pastelería, Cafetería | Solo **Recetas** (consulta). Siguen planificando en la app actual hasta su etapa |

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
firestore-produccion.rules (v1.2.0) → consola de Firebase de fen-produccion → Firestore → Reglas (la copia en GitHub es respaldo)
```

## Instalación (una vez)
1. **Firebase fen-produccion** creado con las 5 cuentas (la tuya y la de cada área), registro desactivado y app web registrada (ver mensaje del 10-oct).
2. **Reglas:** Firestore → Reglas → borrar todo → pegar `firestore-produccion.rules` → **Publicar**.
3. **admins:** Firestore → Datos → Iniciar colección `admins` → ID del documento = **tu UID** → campo `ok` (booleano) `true`.
4. **config.js:** pega tu firebaseConfig (o mándamelo y lo dejo puesto).
5. **Script de Producción v2.3.0** (ver su README) y **Sistema Fën v0.31.0** → Producción: conectar, asignar las cuentas de las áreas, "Leer la planilla" → "Copiar". El control de totales debe decir **Todo cuadra**.
6. **GitHub:** repo `fen-cocina` → sube todos los archivos → Settings → Pages → rama main. Abajo de la app debe decir **Cocina v0.4.0**.
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
