# HockeySpare Tournament Public API

A key-authenticated, versioned read API for third-party and AI workflows
(scoreboards, apps, automation) that want live tournament data without
scraping the public tournament page. This is separate from the internal
`/api/tournaments/*` endpoints the HockeySpare frontend itself uses — those
can change shape without notice; this API won't.

## Getting a key

From a tournament's **Manage** page (as the owner or a co-organizer), open
**API access**, give the key a label, and click **Generate key**. The full
key is shown exactly once — copy it somewhere safe. Only a short prefix is
shown afterward for identification. Revoke a key any time from the same
screen; revocation is immediate.

## Authentication

Send the key as a bearer token:

```
Authorization: Bearer hs_<your key>
```

Every endpoint is scoped to one tournament — a key only works for the
tournament it was created under.

## Base URL

```
https://<your-hockeyspare-host>/api/v1/tournaments/:tournamentId
```

## Endpoints

### `GET /api/v1/tournaments/:id`

Full public tournament payload: details, schedule, teams, brackets,
sponsors, announcements, venues, media.

### `GET /api/v1/tournaments/:id/standings`

Query param `division` (optional) filters to one division.

Returns an array of:

```json
{
  "teamName": "Ice Wolves",
  "gamesPlayed": 4,
  "wins": 3,
  "losses": 1,
  "ties": 0,
  "goalsFor": 14,
  "goalsAgainst": 7,
  "goalDifferential": 7,
  "points": 6
}
```

### `GET /api/v1/tournaments/:id/leaders`

Player scoring leaders across the tournament (goals, assists, points, PIM).

## Errors

| Status | Meaning |
| --- | --- |
| `401` | Missing, invalid, or revoked API key |
| `404` | Tournament not found |

## Webhooks

Register a webhook URL from the same **API access** panel. HockeySpare
fires a `POST` to it whenever a game's score/status is updated to `LIVE`
(with a score) or `FINAL`:

```json
{
  "event": "game.updated",
  "tournamentId": "cl...",
  "game": {
    "id": "cl...",
    "homeTeamName": "Ice Wolves",
    "awayTeamName": "River Hawks",
    "homeScore": 3,
    "awayScore": 2,
    "status": "LIVE",
    "startsAt": "2026-08-20T18:00:00.000Z"
  },
  "sentAt": "2026-08-20T19:41:02.113Z"
}
```

`event` is `"game.final"` once the game is marked final.

### Verifying the signature

Every request includes an `X-HockeySpare-Signature` header:

```
X-HockeySpare-Signature: sha256=<hex-encoded HMAC-SHA256 of the raw request body>
```

Compute the HMAC over the **exact raw bytes** of the request body using
your webhook's secret (shown in the manage page when you create the
webhook), and compare it to the header using a constant-time comparison.

Node.js example:

```js
const crypto = require('crypto');

function isValidSignature(rawBody, signatureHeader, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = (signatureHeader || '').replace('sha256=', '');

  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  );
}
```

### Delivery notes

- Delivery is fire-and-forget with no retry queue — a webhook receiver that's
  down will simply miss that update. If you need guaranteed delivery, poll
  `GET /api/v1/tournaments/:id` instead or in addition.
- There is no delivery log in-app yet; check your own receiver's logs to
  confirm delivery.
