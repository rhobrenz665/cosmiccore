# Offline Sync

Status: Deferred

Deferred. MVP requires a connection for durable saves and clearly reports unsaved edits. It must not advertise offline support.

Future design must resolve operation identity, conflict resolution, tombstones, local sensitive data, account switching and revocation, sync cursors, migration and storage limits. Autosave revision fields are a useful current requirement; a CRDT, service worker or synchronization engine is not justified yet.
