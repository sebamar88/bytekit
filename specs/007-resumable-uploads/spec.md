# Feature Specification: Resumable File Uploads con Chunking

**Feature Branch**: `007-resumable-uploads`  
**Created**: 28 de marzo de 2026  
**Status**: Draft  
**Input**: Mejorar FileUploadHelper con uploads en chunks y resume.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload en Chunks (Priority: P1)

Como desarrollador, quiero dividir archivos grandes en chunks para uploads.

**Why this priority**: Maneja archivos grandes.

**Independent Test**: Puede probarse subiendo archivo en chunks.

**Acceptance Scenarios**:

1. **Given** archivo de 10MB, **When** chunkSize=1MB, **Then** se sube en 10 chunks.

---

### User Story 2 - Resume desde Fallo (Priority: P2)

Como desarrollador, quiero reanudar upload desde último chunk exitoso.

**Why this priority**: Robustez en conexiones lentas.

**Independent Test**: Puede probarse simulando fallo y resume.

**Acceptance Scenarios**:

1. **Given** 5 chunks successfully uploaded (indices 0–4, i.e. `uploadedChunks=5`), **When** `resumeFrom=5`, **Then** only chunks at indices 5..N−1 are sent and no previously uploaded chunk is duplicated.

---

### User Story 3 - Progress y Concurrency (Priority: P3)

Como usuario, quiero ver progreso y controlar concurrencia de chunks.

**Why this priority**: Mejor UX.

**Independent Test**: Puede probarse con callback de progress.

**Acceptance Scenarios**:

1. **Given** concurrency=3, **When** subo, **Then** máximo 3 chunks simultáneos.

---

## Technical Requirements

### API Design

- Extender `FileUploadHelper` con opciones: `chunkSize`, `concurrency`, `resumeFrom`.
- Callback `onProgress(progress)`.

### Constraints

- Zero dependencies: Usar File API.
- Isomórfico: Funciona en browser.

### Implementation Notes

- Estado de chunks enviados.
- Retry en fallos.

## Testing Strategy

- Unit tests: Chunking, resume.
- Integration: Con servidor mock.

## Success Metrics

- Resume funciona en >90% de casos.
- Tests passing.
