# DateUtils

> **Categoría:** Helpers | **[⬅️ Volver al índice](Home)**

#### DateUtils

```ts
class DateUtils {
    static parse(value: DateInput): Date | null;
    static isValid(value: DateInput): boolean;
    static toISODate(value: DateInput): string;
    static startOfDay(value: DateInput): Date;
    static endOfDay(value: DateInput): Date;
    static add(value: DateInput, duration: AddDurationOptions): Date;
    static diff(a: DateInput, b: DateInput, options?: DiffOptions): number;
    static isSameDay(a: DateInput, b: DateInput): boolean;
    static isBefore(a: DateInput, b: DateInput): boolean;
    static isAfter(a: DateInput, b: DateInput): boolean;
    static format(date: DateInput, formatOrLocale?: string): string;
}
```

---

### Formateo Personalizado de Fechas

`DateUtils.format` soporta tanto locales como tokens de formato personalizados.

```typescript
import { DateUtils } from "bytekit";

const date = new Date(2024, 0, 15, 14, 30); // 15 de Enero 2024, 14:30

// Formateo con Tokens (Recomendado para consistencia)
DateUtils.format(date, "YYYY-MM-DD"); // "2024-01-15"
DateUtils.format(date, "YYYY-MM-DD HH:mm:ss"); // "2024-01-15 14:30:00"

// Formateo por Locale (Basado en Intl.DateTimeFormat)
DateUtils.format(date, "es-AR"); // "15 ene 2024"
DateUtils.format(date, "en-US"); // "Jan 15, 2024"
```

---

## Enlaces Relacionados

- **[📚 Documentación Principal](https://github.com/sebamar88/bytekit#readme)**
- **[🏠 Índice de Wiki](Home)**
- **[📦 Módulos Helpers](Helpers)**

## Instalación

```bash
npm install bytekit
```

## Importación

```typescript
// Importación específica (recomendado)
import { DateUtils } from "bytekit";
```

---

**💡 ¿Encontraste un error o tienes una sugerencia?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o contribuye al proyecto.
