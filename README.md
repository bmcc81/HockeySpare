# HockeySpare

HockeySpare is a hockey team and league management app built with:

- **Backend:** NestJS
- **Frontend:** Angular
- **Database:** PostgreSQL with Prisma

---

## Run the app locally

| App | Folder | Command |
|---|---|---|
| Backend (NestJS) | `apps/api` | `npm run start:dev` |
| Frontend (Angular) | `apps/web` | `ng serve -o` |

## Local URLs

- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:4200`

## Checks

- Backend running: `http://localhost:3000/requests`
- Frontend running: `http://localhost:4200`
- CORS enabled: make sure the frontend origin is allowed in the backend config

---

## Roles and permissions

### Player

A normal logged-in player can:

- View their stats
- View team schedule
- See upcoming games
- Message the team
- Mark themselves unavailable for a game
- Send a message to the captain or GM saying they need a spare

### Captain

A captain can do everything a player can, plus:

- Receive player absence messages
- Manage roster for their team
- Confirm lineups
- Request a spare
- Communicate with players

### General Manager

A GM can do everything a captain can, plus:

- Create and edit schedules
- Manage teams and rosters
- Assign captains
- Update team stats
- Oversee team bookings and spares

### League Manager

This is the better role for managing a league.

A league manager can:

- Create season schedules
- Manage standings
- Update league-wide statistics
- Manage teams inside the league

---

## Workflow

This gives you the following workflow:

1. Player opens an upcoming game
2. Clicks **Can’t make it**
3. Optionally writes a note
4. Chooses **Need spare**
5. Captain or GM gets notified
6. System can auto-create a spare request

---

## Backend permission approach

In NestJS, you can protect endpoints by **membership role**, not just logged-in status.

### Examples

- `POST /teams/:id/schedule` → captain or GM
- `POST /leagues/:id/games` → league manager
- `PATCH /games/:id/stats` → captain, GM, or league manager
- `POST /games/:id/availability` → any team player in that game
- `POST /games/:id/request-spare` → captain or GM

---

## Frontend behavior

When logged in, show different dashboard sections based on the user’s memberships.

### Player dashboard

- My schedule
- My stats
- Team chat / messages
- Upcoming games

### Captain dashboard

- Team lineup
- Missing players
- Spare requests
- Messages from players

### GM dashboard

- Team management
- Schedule editor
- Stats updates
- League / team overview

### League manager dashboard

- League schedule
- Standings
- Team registration
- Stat administration

---

## Recommended first roles to implement

For HockeySpare, implement these first:

- `PLAYER`
- `CAPTAIN`
- `GENERAL_MANAGER`
- `LEAGUE_MANAGER`

Store these in **membership tables**, not directly as a single role on `User`.

---

## View the database

To open Prisma Studio:

```bash
cd apps/api
npx prisma studio


## Raspberry Pi deployment

Pi IP:
`192.168.2.11`

### Quick deploy

1. SSH into the Pi

```bash
ssh pi@raspberrypi.local


Go to the project folder


cd /opt/hockeyspare


Pull the latest code


git checkout main git pull origin main npm install


Build the frontend


npm --prefix apps/web run build -- --configuration production


Deploy the frontend to Nginx


sudo rsync -av --delete /opt/hockeyspare/apps/web/dist/hockeyspare-web/browser/ /var/www/hockeyspare/browser/sudo nginx -t sudo systemctl reload nginx

If you also changed the backend
cd /opt/hockeyspare/apps/api npm install npm run buildsudo systemctl restart hockeyspare-api sudo systemctl status hockeyspare-api --no-pager

If Prisma schema changed
cd /opt/hockeyspare/apps/api npx prisma migrate deploy
If you are using dev migrations instead:
npx prisma migrate dev

Test the deployment
curl -I http://127.0.0.1curl -I https://hockeyspare.webinkgraphics.com

If the site does not update right away
Hard refresh in the browser:
Ctrl + F5

If something fails on the Pi
Run these commands and check the output:
cd /opt/hockeyspare/apps/web && npm run buildsudo systemctl status hockeyspare-api --no-pagersudo nginx -t

