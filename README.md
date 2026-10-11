# fën · Cocina · v0.1.0

**App nueva de las jefas** · repo `fen-cocina` · dirección: `https://panaderiafen.github.io/fen-cocina/` · 10 de octubre de 2026

Reemplaza de a poco a la app de Producción. Guarda directo en la base nueva (Firebase **fen-produccion**):
- abre al tiro con lo guardado en el equipo;
- la dupla ve lo mismo al instante;
- cada número se guarda por separado (nunca "borrar la semana y reescribir");
- si algo no se guardó, lo dice;
- la planilla de Producción recibe una copia automática del plan semanal.

## Qué trae la v0.1.0 (etapa P1)

| Área | Qué tiene |
|---|---|
| **Panadería** | **Hoy**, **Planificación** y **Recetas** |
| Bollería, Pastelería, Cafetería | Solo **Recetas** (consulta). Siguen planificando en la app actual hasta su etapa |

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

**Llevar el ajuste a la receta** llega en P3, con el formulario de recetas nuevo y las aprobaciones en Sistema Fën.

## Entrada
1. **Autorizar el equipo** (una vez, lo haces tú): la cuenta del área (correo y contraseña de Firebase).
2. Cada persona toca su nombre y pone su **PIN de Asistencia**. Lo revisa el script de Producción con Asistencia, con el mismo bloqueo tras varios intentos.
3. La persona queda recordada **12 horas** en ese equipo. "Cambiar" deja entrar a otra persona.
4. "Quitar autorización de este equipo" (abajo) obliga a autorizarlo de nuevo.

Quién entra a cada área sigue saliendo de la app actual (Administración → Seguridad). Sistema Fën lo copia con "Leer la planilla".

## Archivos y dónde va cada uno
```
index.html, app.js, modelo.js, firebase.js, estilos.css, logo-fen.png  → GitHub, repo fen-cocina (raíz)
config.js                          → GitHub, raíz (lleva el firebaseConfig de fen-produccion)
README.md                          → GitHub, raíz
firestore-produccion.rules         → consola de Firebase de fen-produccion → Firestore → Reglas (la copia en GitHub es respaldo)
```

## Instalación (una vez)
1. **Firebase fen-produccion** creado con las 5 cuentas (la tuya y la de cada área), registro desactivado y app web registrada (ver mensaje del 10-oct).
2. **Reglas:** Firestore → Reglas → borrar todo → pegar `firestore-produccion.rules` → **Publicar**.
3. **admins:** Firestore → Datos → Iniciar colección `admins` → ID del documento = **tu UID** → campo `ok` (booleano) `true`.
4. **config.js:** pega tu firebaseConfig (o mándamelo y lo dejo puesto).
5. **Script de Producción v2.2.0** (ver su README) y **Sistema Fën v0.31.0** → Producción: conectar, asignar las cuentas de las áreas, "Leer la planilla" → "Copiar". El control de totales debe decir **Todo cuadra**.
6. **GitHub:** repo `fen-cocina` → sube todos los archivos → Settings → Pages → rama main. Abajo de la app debe decir **Cocina v0.1.0**.
7. En la tablet de Panadería, abre la dirección, autoriza con la cuenta de Panadería y prueba el PIN.

## Lista de verificación
- [ ] La tablet de Panadería pide el PIN y muestra solo a las personas de Panadería.
- [ ] Hoy muestra las recetas del plan, el pie de masa madre el martes y el viernes, y los insumos.
- [ ] Un ajuste de agua cambia la tarjeta y las tandas. En otro equipo de Panadería se ve igual.
- [ ] "Marcar terminada" en un equipo aparece en el otro.
- [ ] Cambiar un número en Planificación, esperar 30 s: aparece en `PAN_planificacion` de la planilla.
- [ ] Una tablet autorizada con la cuenta de Bollería muestra solo Recetas y el aviso de la app actual.

## Si algo sale mal
- **"No se pudo leer el área de esta cuenta"**: falta asignarla en Sistema Fën → Producción → Cuentas de las áreas, o las reglas no están publicadas.
- **El PIN dice que no hay conexión con el servidor**: revisa que el script de Producción esté en v2.2.0 (`…/exec?action=ping`).
- **"Planilla pendiente"** en Planificación: el plan está guardado en la base nueva. Solo falta la copia, y se reintenta sola.
- La app actual de Producción sigue funcionando igual. Volver a ella es usar la dirección de siempre.
