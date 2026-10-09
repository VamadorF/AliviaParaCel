# PRODUCT.md — AlivIA móvil (paciente)

## Users

Personas con dolor crónico en Chile y sus cuidadores. Muchas usan el teléfono con una mano, baja visión o poca confianza digital.

## Product purpose

Registrar bienestar diario (dolor, síntomas, medicación), ver orientación del equipo y comunicarse con AlivIA/médico cuando el canal está habilitado.

## Platform

Expo (iOS, Android, web ligera). Beta con mocks.

## Principles

- **Calm by default**: una acción principal por pantalla.
- **Clínico, no wellness genérico**: sin copy motivacional vacío.
- **Accesible = seguro**: WCAG 2.2 AA en móvil; targets 44/48; labels visibles.
- **Usuario nuevo limpio**: estados vacíos honestos.

## Register (beta)

- Login por RUT o “Entrar en modo demo” (Constanza, `9.876.543-3`).
- RUT `15.234.678-6` = paciente nuevo sin historial (mock).

## Out of scope (ahora)

Médico, clínica, admin, API real, FHIR/PDF, OpenAI.
