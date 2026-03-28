# Parallel Queue

> **⚠️ Merged**: Esta spec fue fusionada con el Batching System.  
> Ver especificación completa en [004-request-queue-batching](../004-batching-system/spec.md).

## Razón de la Fusión

La cola paralela de requests y el batching system comparten el mismo dominio (gestión de requests HTTP), infraestructura (concurrencia, priorización) y punto de integración (ApiClient). Mantenerlos separados habría generado duplicación de lógica y APIs inconsistentes.

La spec fusionada cubre:

- ✅ Cola con concurrencia controlada (Parallel Queue)
- ✅ Priorización y cancelación de requests
- ✅ Agrupación inteligente por URL (Batching)
- ✅ Integración unificada con ApiClient
