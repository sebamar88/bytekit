#!/usr/bin/env node

/**
 * GitHub Wiki Generator - Versión Simplificada
 *
 * Extrae módulos específicos del README y genera páginas wiki
 * manteniendo el contenido bilingüe (EN/ES).
 */

import fs from "fs";
import path from "path";

class GitHubWikiGenerator {
    constructor() {
        this.readmePath = "README-back.md";
        this.wikiDir = "wiki-pages";
        this.modules = [];

        // Lista explícita de módulos válidos
        this.validModules = [
            "ApiClient",
            "Logger",
            "Profiler",
            "RetryPolicy",
            "ResponseValidator",
            "RequestCache",
            "RateLimiter",
            "RequestDeduplicator",
            "ErrorBoundary",
            "DateUtils",
            "StringUtils",
            "Validator",
            "EnvManager",
            "StorageUtils",
            "FileUploadHelper",
            "StreamingHelper",
            "WebSocketHelper",
            "ArrayUtils",
            "ObjectUtils",
            "FormUtils",
            "TimeUtils",
            "EventEmitter",
            "DiffUtils",
            "PollingHelper",
            "CryptoUtils",
            "PaginationHelper",
            "CacheManager",
            "CompressionUtils",
        ];
    }

    /**
     * Ejecuta el proceso completo de generación
     */
    async generate() {
        console.log("🚀 Generando páginas wiki desde README...");

        // Crear directorio para páginas wiki
        if (!fs.existsSync(this.wikiDir)) {
            fs.mkdirSync(this.wikiDir, { recursive: true });
        }

        // Leer README
        const readmeContent = fs.readFileSync(this.readmePath, "utf-8");

        // Extraer módulos
        this.extractModules(readmeContent);

        // Generar páginas wiki
        this.generateWikiPages();

        // Generar README optimizado
        this.generateOptimizedReadme(readmeContent);

        // Generar índice de wiki
        this.generateWikiIndex();

        console.log(
            `✅ Generadas ${this.modules.length} páginas wiki en ./${this.wikiDir}/`
        );
        console.log("📝 README optimizado generado como README-optimized.md");
        console.log("📚 Índice de wiki generado como wiki-pages/Home.md");
        console.log("\n📋 Próximos pasos:");
        console.log("1. Revisa las páginas generadas en ./wiki-pages/");
        console.log("2. Copia el contenido a tu GitHub Wiki");
        console.log("3. Reemplaza tu README.md con README-optimized.md");
    }

    /**
     * Extrae módulos específicos del README
     */
    extractModules(content) {
        this.validModules.forEach((moduleName) => {
            const moduleContent = this.extractSingleModule(content, moduleName);
            if (moduleContent) {
                this.modules.push({
                    name: moduleName,
                    content: moduleContent,
                    category: this.determineCategory(moduleName),
                });
            }
        });

        console.log(`📦 Extraídos ${this.modules.length} módulos:`);
        this.modules.forEach((m) =>
            console.log(`   - ${m.name} (${m.category})`)
        );
    }

    /**
     * Extrae un módulo específico del contenido
     */
    extractSingleModule(content, moduleName) {
        const lines = content.split("\n");
        let startIndex = -1;
        let endIndex = -1;

        // Buscar el inicio del módulo
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(new RegExp(`^####\\s+${moduleName}\\s*$`))) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) return null;

        // Buscar el final del módulo
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].match(/^####\s+/) || lines[i].match(/^###\s+/)) {
                endIndex = i;
                break;
            }
        }

        if (endIndex === -1) endIndex = lines.length;

        return lines.slice(startIndex, endIndex).join("\n").trim();
    }

    /**
     * Determina la categoría de un módulo
     */
    determineCategory(moduleName) {
        const coreModules = [
            "ApiClient",
            "Logger",
            "Profiler",
            "RetryPolicy",
            "ResponseValidator",
            "RequestCache",
            "RateLimiter",
            "RequestDeduplicator",
            "ErrorBoundary",
        ];

        const helperModules = [
            "DateUtils",
            "StringUtils",
            "Validator",
            "EnvManager",
            "StorageUtils",
            "FileUploadHelper",
            "StreamingHelper",
            "WebSocketHelper",
            "ArrayUtils",
            "ObjectUtils",
            "FormUtils",
            "TimeUtils",
        ];

        if (coreModules.includes(moduleName)) {
            return "Core";
        } else if (helperModules.includes(moduleName)) {
            return "Helpers";
        } else {
            return "Utilities";
        }
    }

    /**
     * Genera páginas wiki individuales
     */
    generateWikiPages() {
        this.modules.forEach((module) => {
            const wikiContent = this.generateModuleWikiPage(module);
            const filename = `${module.name}.md`;
            const filepath = path.join(this.wikiDir, filename);

            fs.writeFileSync(filepath, wikiContent, "utf-8");
            console.log(`📄 Generada página wiki: ${filename}`);
        });
    }

    /**
     * Genera el contenido de una página wiki para un módulo
     */
    generateModuleWikiPage(module) {
        return `# ${module.name}

> **Categoría:** ${module.category} | **[⬅️ Volver al índice](Home)**

${module.content}

---

## Enlaces Relacionados

- **[📚 Documentación Principal](https://github.com/sebamar88/bytekit#readme)**
- **[🏠 Índice de Wiki](Home)**
- **[📦 Módulos ${module.category}](${module.category})**

## Instalación

\`\`\`bash
npm install bytekit
\`\`\`

## Importación

\`\`\`typescript
// Importación específica (recomendado)
import { ${module.name} } from "bytekit/${this.getImportPath(module.name)}";

// Importación desde el índice principal
import { ${module.name} } from "bytekit";
\`\`\`

---

**💡 ¿Encontraste un error o tienes una sugerencia?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o contribuye al proyecto.
`;
    }

    /**
     * Obtiene la ruta de importación para un módulo
     */
    getImportPath(moduleName) {
        return moduleName
            .toLowerCase()
            .replace(/([A-Z])/g, "-$1")
            .replace(/^-/, "");
    }

    /**
     * Genera un README minimalista con enlaces a wiki
     */
    generateOptimizedReadme(originalContent) {
        // Crear un README balanceado con más información útil
        const balancedReadme = `# bytekit

> **Previously known as:** \`@sebamar88/utils\` (v0.1.9 and earlier)

**EN:** Modern TypeScript utilities: an isomorphic **ApiClient**, structured logging/profiling helpers, and ready-to-use modules (\`DateUtils\`, \`StringUtils\`, \`StorageManager\`, etc.).  
**ES:** Colección moderna de utilidades TypeScript: **ApiClient** isomórfico, logging/profiling estructurado y helpers listos (\`DateUtils\`, \`StringUtils\`, \`StorageManager\`, etc.).

---

## ✨ Highlights / Características

- ✅ **EN:** Fully ESM with \`.d.ts\` definitions. **ES:** Build 100% ESM con tipos listos.
- 🌐 **EN:** Works on Node.js 18+ and modern browsers (native fetch). **ES:** Compatible con Node.js 18+ y navegadores modernos (fetch nativo).
- 🔁 **EN:** ApiClient with retries, localized errors, flexible options. **ES:** ApiClient con reintentos, errores localizados y configuración flexible.
- 🧩 **EN:** Helper modules (strings, dates, validators, env, storage). **ES:** Helpers para strings, fechas, validadores, env y storage.
- 🪵 **EN:** Structured logging/profiling: \`createLogger\`, \`Profiler\`, \`withTiming\`. **ES:** Logging/profiling estructurado: \`createLogger\`, \`Profiler\`, \`withTiming\`.

## 🚀 Quick Start / Inicio Rápido

### Installation / Instalación

\`\`\`bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o
yarn add bytekit
\`\`\`

### Global CLI Installation / Instalación CLI Global

\`\`\`bash
npm install -g bytekit
# Then use / Luego usa:
sutils create users
sutils types https://api.example.com/users
\`\`\`

### Basic Usage / Uso Básico

\`\`\`ts
import { ApiClient, createLogger, DateUtils, StringUtils } from "bytekit";

const http = new ApiClient({
    baseUrl: "https://api.my-service.com",
    defaultHeaders: { "X-Team": "@sebamar88" },
    locale: "es",
    errorMessages: {
        es: { 418: "Soy una tetera ☕" },
    },
});

const users = await http.get<{ id: string; name: string }[]>("/users");

const logger = createLogger({ namespace: "users-service", level: "info" });
logger.info("Users synced", { count: users.length });

const slug = StringUtils.slugify("New Users – October 2024");
\`\`\`

### Modular Imports / Importaciones Modulares

\`\`\`ts
// Import specific modules to reduce bundle size
// Importa módulos específicos para reducir el tamaño del bundle

// Core modules / Módulos core
import { ApiClient } from "bytekit/api-client";
import { Logger } from "bytekit/logger";
import { RetryPolicy } from "bytekit/retry-policy";

// Helper modules / Módulos helpers
import { DateUtils } from "bytekit/date-utils";
import { StringUtils } from "bytekit/string-utils";
import { ArrayUtils } from "bytekit/array-utils";
\`\`\`

## 🎯 Framework Support / Soporte de Frameworks

**EN:** Works seamlessly with React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit, and more.  
**ES:** Funciona perfectamente con React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit y más.

### React Example / Ejemplo React

\`\`\`jsx
import { createApiClient } from "bytekit";
import { useState, useEffect } from "react";

function Users() {
    const client = createApiClient({ baseURL: "https://api.example.com" });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        client.get("/users").then(setUsers);
    }, [client]);

    return (
        <div>
            {users.map((u) => (
                <div key={u.id}>{u.name}</div>
            ))}
        </div>
    );
}
\`\`\`

**[📖 View More Framework Examples →](https://github.com/sebamar88/bytekit/wiki/Framework-Examples)**

## 📚 Complete Documentation / Documentación Completa

**EN:** For detailed documentation of all ${
            this.modules.length
        } modules, visit our comprehensive GitHub Wiki.  
**ES:** Para documentación detallada de todos los ${
            this.modules.length
        } módulos, visita nuestra GitHub Wiki completa.

### 🔗 Quick Links by Category / Enlaces Rápidos por Categoría

#### 🔧 Core Modules (${
            this.getModulesByCategory("Core").length
        }) - Essential functionality / Funcionalidad esencial
${this.getModulesByCategory("Core")
    .map(
        (m) =>
            `- **[${m.name}](https://github.com/sebamar88/bytekit/wiki/${
                m.name
            })** - ${this.getModuleDescription(m.name, "en")}`
    )
    .join("\n")}

#### 🛠️ Helper Modules (${
            this.getModulesByCategory("Helpers").length
        }) - Common utilities / Utilidades comunes
${this.getModulesByCategory("Helpers")
    .map(
        (m) =>
            `- **[${m.name}](https://github.com/sebamar88/bytekit/wiki/${
                m.name
            })** - ${this.getModuleDescription(m.name, "en")}`
    )
    .join("\n")}

#### ⚡ Utility Modules (${
            this.getModulesByCategory("Utilities").length
        }) - Advanced features / Características avanzadas
${this.getModulesByCategory("Utilities")
    .map(
        (m) =>
            `- **[${m.name}](https://github.com/sebamar88/bytekit/wiki/${
                m.name
            })** - ${this.getModuleDescription(m.name, "en")}`
    )
    .join("\n")}

**[🏠 Browse Full Wiki Index →](https://github.com/sebamar88/bytekit/wiki)**

## 🌟 Popular Use Cases / Casos de Uso Populares

### HTTP Client with Retries / Cliente HTTP con Reintentos
\`\`\`ts
const api = new ApiClient({
    baseUrl: "https://api.example.com",
    retryPolicy: { maxAttempts: 3, initialDelayMs: 100 },
    circuitBreaker: { failureThreshold: 5 }
});

const users = await api.get("/users");
\`\`\`

### Structured Logging / Logging Estructurado
\`\`\`ts
const logger = createLogger({ namespace: "app", level: "info" });
logger.info("User created", { userId: 123, email: "user@example.com" });
\`\`\`

### Date & String Utilities / Utilidades de Fecha y String
\`\`\`ts
const formatted = DateUtils.format(new Date(), "es-AR");
const slug = StringUtils.slugify("Hello World! 🌍");
const masked = StringUtils.mask("1234567890", { start: 4, end: 2 });
\`\`\`

### Array & Object Manipulation / Manipulación de Arrays y Objetos
\`\`\`ts
const chunks = ArrayUtils.chunk([1, 2, 3, 4, 5], 2); // [[1,2], [3,4], [5]]
const picked = ObjectUtils.pick(user, ["id", "name", "email"]);
const grouped = ObjectUtils.groupBy(users, "department");
\`\`\`

## 🚀 Live Examples / Ejemplos en Vivo

**EN:** Try bytekit in your browser with these interactive examples:  
**ES:** Prueba bytekit en tu navegador con estos ejemplos interactivos:

- **[React Example](https://codesandbox.io/p/devbox/bytekit-react-example-gr2k2j)** - Complete React app with ApiClient
- **[Vue Example](https://codesandbox.io/p/devbox/df26fs)** - Vue 3 composition API usage
- **[Svelte Example](https://codesandbox.io/p/devbox/lxvghg)** - Svelte integration example

**[📁 View Local Examples →](https://github.com/sebamar88/bytekit/tree/main/examples)**

## 🔗 Links / Enlaces

- **[📦 NPM Package](https://www.npmjs.com/package/bytekit)** - Install and version info
- **[📚 Full Documentation Wiki](https://github.com/sebamar88/bytekit/wiki)** - Complete API reference
- **[🚀 Live Examples](https://github.com/sebamar88/bytekit/tree/main/examples)** - Working code samples
- **[📋 Issues & Support](https://github.com/sebamar88/bytekit/issues)** - Bug reports and feature requests
- **[🔄 Changelog](https://github.com/sebamar88/bytekit/blob/main/CHANGELOG.md)** - Version history

## 🤝 Contributing / Contribuir

**EN:** Contributions are welcome! Please read our contributing guidelines and feel free to submit issues and pull requests.  
**ES:** ¡Las contribuciones son bienvenidas! Lee nuestras guías de contribución y no dudes en enviar issues y pull requests.

## 📄 License / Licencia

MIT © [Sebastián Martinez](https://github.com/sebamar88)

---

**💡 Need help?** Check the **[Wiki](https://github.com/sebamar88/bytekit/wiki)** or **[open an issue](https://github.com/sebamar88/bytekit/issues)**.
`;

        fs.writeFileSync("README-optimized.md", balancedReadme, "utf-8");
    }

    /**
     * Obtiene módulos por categoría
     */
    getModulesByCategory(category) {
        return this.modules.filter((m) => m.category === category);
    }

    /**
     * Obtiene descripción breve de un módulo
     */
    getModuleDescription(moduleName, lang) {
        const descriptions = {
            ApiClient: {
                en: "Typed HTTP client with retries, localized errors, and custom fetch support",
                es: "Cliente HTTP tipado con reintentos, errores localizados y soporte fetch personalizado",
            },
            Logger: {
                en: "Structured logger with levels, namespaces, and transports for Node/browser",
                es: "Logger estructurado con niveles, namespaces y transports para Node/browser",
            },
            DateUtils: {
                en: "Safe date parsing, manipulation, and formatting utilities",
                es: "Utilidades seguras para parseo, manipulación y formato de fechas",
            },
            StringUtils: {
                en: "Text processing utilities: slugify, capitalize, mask, interpolate",
                es: "Utilidades de procesamiento de texto: slugify, capitalizar, máscaras, interpolación",
            },
            ArrayUtils: {
                en: "Array manipulation utilities: chunk, flatten, unique, shuffle, zip",
                es: "Utilidades de manipulación de arrays: chunk, flatten, unique, shuffle, zip",
            },
            ObjectUtils: {
                en: "Object manipulation utilities: merge, pick, omit, flatten, groupBy",
                es: "Utilidades de manipulación de objetos: merge, pick, omit, flatten, groupBy",
            },
            Validator: {
                en: "Validation utilities for emails, phones, passwords, and more",
                es: "Utilidades de validación para emails, teléfonos, contraseñas y más",
            },
            CacheManager: {
                en: "Multi-tier cache with TTL, LRU eviction, and statistics",
                es: "Cache multi-nivel con TTL, evicción LRU y estadísticas",
            },
            CryptoUtils: {
                en: "Token/UUID generation, base64 encoding, hashing, and HMAC",
                es: "Generación de tokens/UUIDs, codificación base64, hashing y HMAC",
            },
        };

        return (
            descriptions[moduleName]?.[lang] ||
            (lang === "en"
                ? `${moduleName} utilities and helpers`
                : `Utilidades y helpers de ${moduleName}`)
        );
    }

    /**
     * Genera página de índice principal de la wiki
     */
    generateWikiIndex() {
        const indexContent = `# 📚 Bytekit Wiki

**EN:** Welcome to the comprehensive documentation for Bytekit utilities.  
**ES:** Bienvenido a la documentación completa de las utilidades de Bytekit.

## 🚀 Quick Navigation / Navegación Rápida

### Core Modules / Módulos Core
**EN:** Essential modules for HTTP clients, logging, and core functionality.  
**ES:** Módulos esenciales para clientes HTTP, logging y funcionalidad core.

${this.getModulesByCategory("Core")
    .map(
        (m) =>
            `- **[${m.name}](${m.name})** - ${this.getModuleDescription(
                m.name,
                "en"
            )}`
    )
    .join("\n")}

### Helper Modules / Módulos Helpers
**EN:** Utility modules for common tasks like date manipulation, string processing, and validation.  
**ES:** Módulos de utilidad para tareas comunes como manipulación de fechas, procesamiento de strings y validación.

${this.getModulesByCategory("Helpers")
    .map(
        (m) =>
            `- **[${m.name}](${m.name})** - ${this.getModuleDescription(
                m.name,
                "en"
            )}`
    )
    .join("\n")}

### Utility Modules / Módulos Utilities  
**EN:** Advanced utilities for events, caching, compression, and specialized tasks.  
**ES:** Utilidades avanzadas para eventos, caching, compresión y tareas especializadas.

${this.getModulesByCategory("Utilities")
    .map(
        (m) =>
            `- **[${m.name}](${m.name})** - ${this.getModuleDescription(
                m.name,
                "en"
            )}`
    )
    .join("\n")}

## 📖 Getting Started / Comenzando

### Installation / Instalación

\`\`\`bash
npm install bytekit
# or / o
pnpm add bytekit
# or / o  
yarn add bytekit
\`\`\`

### Basic Usage / Uso Básico

\`\`\`typescript
import { ApiClient, DateUtils, StringUtils } from "bytekit";

const client = new ApiClient({ baseUrl: "https://api.example.com" });
const formattedDate = DateUtils.format(new Date(), "es-AR");
const slug = StringUtils.slugify("Hello World");
\`\`\`

## 🔗 External Links / Enlaces Externos

- **[📦 NPM Package](https://www.npmjs.com/package/bytekit)**
- **[🐙 GitHub Repository](https://github.com/sebamar88/bytekit)**
- **[📋 Issues & Support](https://github.com/sebamar88/bytekit/issues)**
- **[🚀 Examples](https://github.com/sebamar88/bytekit/tree/main/examples)**

---

**💡 ¿Necesitas ayuda?** [Abre un issue](https://github.com/sebamar88/bytekit/issues) o consulta los [ejemplos](https://github.com/sebamar88/bytekit/tree/main/examples).
`;

        fs.writeFileSync(
            path.join(this.wikiDir, "Home.md"),
            indexContent,
            "utf-8"
        );
        console.log("🏠 Generada página de índice: Home.md");
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new GitHubWikiGenerator();
    generator.generate().catch(console.error);
}

export default GitHubWikiGenerator;
