# Guía de Commits y Pull Requests

Este documento define estándares de control de versiones e integración de código en el proyecto.

---

## 1. Guía de commits

Adoptamos el estándar de **Conventional Commits**.

### Formato

`tipo: descripción en minúsculas`

Si quieren especificar **dónde** ocurrió el cambio (módulo, carpeta, área del producto), pueden usar **scope** entre paréntesis:

`tipo(scope): descripción en minúsculas`

El **scope es opcional**: úsenlo cuando aporte contexto real; si con el tipo y la descripción ya se entiende, no hace falta.

### Tipos principales

- **feat**: Una nueva funcionalidad (ej. `feat(alertas): avisar cuando una planta deja de reportar datos`).
- **fix**: Corrección de un error (ej. `fix(huawei): corregir parseo de potencia en respuesta de la api`).
- **refactor**: Cambios en el código que no añaden funciones ni corrigen errores (ej. `refactor(middleware): unificar reintentos del cliente http`).
- **chore**: Mantenimiento que no cambia el comportamiento del producto: dependencias, tooling, configs, tareas repetitivas (ej. `chore(ci): ajustar workflow de pruebas`).
- **docs**: Cambios solo en la documentación (ej. `docs: actualizar variables de entorno en readme`).
- **style**: Cambios de formato (espacios, comas, etc.) que no afectan la lógica.

### Cuerpo del mensaje (opcional)

Si el cambio tiene varias partes, dejen una **línea en blanco** después del título y usen **viñetas** para detallar. Ayuda en el historial y en las descripciones de PR.

Ejemplo:

```
feat(dashboard): vista de kpis por planta con filtro por proveedor

- Tabla resumida con estado online y última telemetría
- Filtro growatt / huawei / deye reutilizando slugs del middleware
- Gráfico de potencia instantánea con rango de 24 h
```

### Reglas de oro

- La primera línea no debe exceder los **72 caracteres**.
- En el cuerpo: motivación o contexto cuando importe; viñetas cuando un commit agrupa varios cambios y conviene leerlos por separado.

---

## 2. Guía de Pull Requests (PRs)

El objetivo de una PR no es solo integrar código, sino facilitar la revisión y cuidar la calidad del producto.

### Principios fundamentales

- **Atomicidad (PRs pequeñas):** una tarea, una PR. Eviten mezclar correcciones con funcionalidades nuevas. Si el cambio es muy grande, divídanlo: revisar varias PRs acotadas suele ser más rápido que una sola enorme.
- **Títulos estándar:** usen el mismo criterio que **Conventional Commits** en el título de la PR para mantener el historial y los changelogs legibles.
  - *Ejemplo:* `feat(api): implementar rotación de tokens de refresco`

### Contenido de la descripción

1. **Contexto:** qué hace el cambio y por qué hace falta.
2. **Checklist de pruebas:** pasos concretos para reproducir o validar el cambio.
3. **Evidencia visual:** si hay UI/UX, adjunten captura, GIF o video corto (por ejemplo Loom).

### Proceso de revisión

- **Autorrevisión:** antes de pedir revisores, revisen el diff en la plataforma y quiten `console.log`, código comentado temporal o ruido.
- **CI en verde:** asegúrense de que tests y build pasen antes de pedir revisión (cuando existan en el repo).
- **Feedback constructivo:** la crítica va al código, no a la persona. Cuando un comentario quede resuelto, marquen la conversación como resuelta.
- **Draft:** si quieren feedback temprano sin mergear todavía, abran la PR en estado **Draft**.
