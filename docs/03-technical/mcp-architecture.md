# Mcp Architecture

Status: Deferred

MVP runtime: Deferred. Saving GitHub repository URLs does not require MCP.

Future application acts as MCP client to approved external servers; exposing CosmicCore as an MCP server is a separate feature. Evaluate Streamable HTTP for remote servers and stdio only for local development processes. Verify current protocol/SDK/auth requirements when this milestone begins; transport compatibility has not been validated in this pass.

Require allowlisted endpoints/tools, scoped credentials, per-user authorization, validated arguments/results, timeouts, audit metadata, and explicit confirmation for consequential actions. Tool discovery is not authorization. Treat tool outputs as untrusted. A serverless request must not rely on a persistent child process; remote always-on hosting requires a concrete need and quota review.
