# Badges para README.md

Copia y pega estos badges al inicio de tu README.md (después del título y descripción):

```markdown
## 📊 Status / Estado

[![CI](https://github.com/sebamar88/bytekit/workflows/CI/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/ci.yml)
[![Coverage](https://github.com/sebamar88/bytekit/workflows/Enhanced%20Coverage%20Report/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/coverage.yml)
[![CodeQL](https://github.com/sebamar88/bytekit/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/sebamar88/bytekit/actions/workflows/codeql.yml)
[![npm version](https://img.shields.io/npm/v/bytekit.svg)](https://www.npmjs.com/package/bytekit)
[![npm downloads](https://img.shields.io/npm/dm/bytekit.svg)](https://www.npmjs.com/package/bytekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/bytekit.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
```

## Explicación de cada badge:

1. **CI** - Muestra si los tests pasan (verde) o fallan (rojo)
2. **Coverage** - Estado del workflow de cobertura
3. **CodeQL** - Estado del análisis de seguridad
4. **npm version** - Versión actual publicada en npm
5. **npm downloads** - Descargas mensuales del paquete
6. **License** - Tipo de licencia (MIT)
7. **Node.js Version** - Versión mínima de Node requerida
8. **TypeScript** - Versión de TypeScript usada

## Dónde colocarlos en README.md:

```markdown
# bytekit

> **Previously known as:** `@sebamar88/utils` (v0.1.9 and earlier)

**EN:** Modern TypeScript utilities...
**ES:** Colección moderna de utilidades TypeScript...

## 📊 Status / Estado

[AQUÍ VAN LOS BADGES]

---

## ✨ Highlights / Características
...
```

## Vista previa:

Los badges se verán así en tu README:

![CI](https://img.shields.io/badge/CI-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)
![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)
![npm](https://img.shields.io/badge/npm-v1.0.0-blue)
![downloads](https://img.shields.io/badge/downloads-1k%2Fmonth-blue)
![license](https://img.shields.io/badge/license-MIT-yellow)
![node](https://img.shields.io/badge/node-%3E%3D18-green)
![typescript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)

## Actualización automática:

Los badges se actualizarán automáticamente cuando:
- ✅ Hagas push a main/develop (CI badge)
- ✅ Se complete el workflow de coverage (Coverage badge)
- ✅ Se ejecute CodeQL (CodeQL badge)
- ✅ Publiques una nueva versión (npm version badge)
- ✅ Aumenten las descargas (npm downloads badge)
