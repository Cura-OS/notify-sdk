// @curaos/notify-sdk - public surface.
//
// Generated from notify-service's TypeSpec REST contract (specs/notify.tsp ->
// OpenAPI 3.1 -> @hey-api/openapi-ts) and its AsyncAPI event contract
// (specs/notify.asyncapi.yaml -> json-schema-to-typescript). Run
// `bun run generate` to refresh from the contracts; drift is enforced by
// test/drift.test.ts.
//
// REST: typed operation functions (`notifysHealth`, `notifysProtectedProbe`,
// `notifysProtectedWrite`, `notifysRead`) + request/response types + the
// `client` instance. Configure the base URL via `client.setConfig({ baseUrl })`
// or `createClient()` from `@hey-api/client-fetch`.
//
// Events: `NotifyEventPayload` + `EventHeaders` wire-types (snake_case - the
// canonical envelope; do NOT camelCase) for the event-consumer surface, plus
// the clinical alert-type catalog types (`ClinicalAlertPayload`,
// `EscalationRung`, XSRC-E4-10).

export * from './rest';
export { client } from './rest/client.gen';
export type {
  NotifyEventPayload,
  EventHeaders,
  ClinicalAlertPayload,
  EscalationRung,
} from './events.gen';
