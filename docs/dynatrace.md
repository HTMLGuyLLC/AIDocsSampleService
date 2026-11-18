# Dynatrace

How Crumb & Co. watches its services. Agents use it to find out what is happening in production. Agents only read.

## How it is set up

- **Two environments are monitored:** `dev` and `prod`. Each service runs an agent in both, and every service reports to the same Dynatrace environment.
- **Every service carries two standard tags.** Dashboards, alerts and queries all rely on them, so don't rename them.

| Tag | Values | Example |
|---|---|---|
| `service` | The project folder name | `orders-api` |
| `env` | `dev` or `prod` | `prod` |

- These match the `service` and `env` fields in our log lines ([logging.md](logging.md)), so a log line and a metric can be matched.

## Dashboards

- **One dashboard per service**, named `<service> (<env>)`, such as `orders-api (prod)`.
- Each one has the same top row: request rate, failure rate, response time (median and 95th percentile), and a list of recent errors.
- Below that, a row per feature. For AI features: model calls, spend and fallback rate.
- One company dashboard, `Crumb & Co. overview`, shows failure rate for every service side by side.
- A service's own specifics (hostnames, its metrics, example queries) are in that project's `docs/dynatrace.md`, for example [orders-api](../orders-api/docs/dynatrace.md).

## Which connector

Use the **Dynatrace MCP connector** set up in `.mcp.json` (see [connectors.md](connectors.md)). Ask it in plain words
("failure rate for orders-api in prod since 08:00") or have it run a query. Prefer the connector over opening the website and clicking.

## What agents may and may not do

| May | May not |
|---|---|
| Read metrics, logs, problems and traces | Change dashboards, alerts, tags or settings |
| Run read-only queries | Create or delete anything in Dynatrace |
| Summarize what they found, with numbers | Act on production because of what they found |
| Suggest a new alert or dashboard | Paste a token or environment URL into a doc or chat |

The connector uses a **read-only token** that belongs to the agent, not to a person ([secrets.md](secrets.md)).
If a task needs more than reading, ask a person.

## When something is wrong in production

Follow the `debug-with-evidence` skill. Gather Dynatrace and logs first, then form ideas.
