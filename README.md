<div align="center">


# notify-sdk

**A typed client for notify-service, generated from the service's TypeSpec REST contract and AsyncAPI event contract, so any consumer imports a typed REST client + event wire-types with zero hand-written transport code. The generation recipe is the reusable mold for the M10 SDK package class (#278-284).**

Part of the CuraOS (Care Oriented Stack) platform. A typed client for notify-service, generated from the service's TypeSpec REST contract and AsyncAPI event contract, so any consumer imports a typed REST client + event wire-types with zero hand-written transport code. The generation recipe is the reusable mold for the M10 SDK package class (#278-284). Domain: neutral.

[![Status](https://img.shields.io/badge/status-public--alpha-informational)](#status)
[![License: BSL-1.1](https://img.shields.io/badge/license-BSL--1.1-yellow)](./LICENSE)
[![Exposure: Source available](https://img.shields.io/badge/exposure-Source--available-yellow)](#license)
[![Module: Sdk](https://img.shields.io/badge/module-Sdk-informational)](#how-it-works)

[Why](#why) · [Quick Start](#quick-start) · [Capabilities](#capabilities) · [How it Works](#how-it-works) · [Status](#status) · [Security](#security)

</div>

---

## At a Glance

| Field | Detail |
|---|---|
| Audience | Integrators and platform developers. |
| Homepage | [https://docs.curaos.abualruz.com](https://docs.curaos.abualruz.com) |
| Exposure | Source available |
| License | LicenseRef-CuraOS-BSL |
| Topics | `curaos` `sdk` `source-available` `integration` `self-hosted` `package`  |

---

## Why

A typed client for notify-service, generated from the service's TypeSpec REST contract and AsyncAPI event contract, so any consumer imports a typed REST client + event wire-types with zero hand-written transport code. The generation recipe is the reusable mold for the M10 SDK package class (#278-284).

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Quick Start

```bash
bun add @curaos/notify-sdk
```

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Capabilities

- Generate REST operations + request/response types from notify.tsp
- Generate event payload + header wire-types from notify.asyncapi.yaml.
- Expose a configurable client (client.setConfig / createClient).
- One-command regeneration from the contracts (bun run generate).

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Surfaces

- Typed client package
- Generated contract types
- Integration boundary

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Media

- No media slot approved yet.

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## How it Works

| Area | Detail |
|---|---|
| Package | `@curaos/notify-sdk` |
| Source | `backend/packages/notify-sdk` |
| Domain | `neutral` |
| Layer | `package` |
| Exposure | Source available |

- Source path: `backend/packages/notify-sdk`
- Generated documentation owner: `tools/codegen/src/repo-docs-emit.ts`



---

## API and Usage

See [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com) (interim).

See [API reference](./src/index.ts) or generated TypeDoc.



---

## Status

public alpha

- Docs generated from `tools/codegen/src/repo-docs-emit.ts`.
- Public documentation: [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com).

---

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting policy.

Public source is limited to integration edges and generated contract/client surfaces.

Private material stays out of this README:

- Generator templates
- Internal deployment automation
- Tenant operations data
- Roadmap and pricing internals

---

## Maintainers

- CuraOS Team - [GitHub](https://github.com/Cura-OS)

---

## Contributing

Contributions are handled through the repository maintainers. Public contribution guidelines are emitted for open and source-available repositories.

By contributing, you agree that your contributions will be licensed under the same license as this project.

---

## License

LicenseRef-CuraOS-BSL - CuraOS (Care Oriented Stack). See [LICENSE](./LICENSE) for details.
