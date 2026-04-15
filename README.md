# HockeySpare

App	                  Where to run	  Command
Backend (NestJS)	    apps/api	      npm run start:dev
Frontend (Angular)	  apps/web	      ng serve -o

✔ Backend running? http://localhost:3000/requests

✔ Frontend running? http://localhost:4200

✔ CORS enabled? <br> <br>

# What each role should do 
<br>

# Player <br>

A normal logged-in player can: <br>

- view their stats <br>
- view team schedule <br>
- see upcoming games <br>
- message the team <br>
- mark themselves unavailable for a game <br>
- send a message to the captain/GM saying they need a spare <br>

# Captain <br>

# Captain can do everything a player can, plus: <br>

- receive player absence messages <br>
- manage roster for their team <br>
- confirm lineups <br>
- request a spare <br>
- communicate with players <br>

# General Manager <br>

# GM can do everything a captain can, plus: <br>

- create and edit schedules <br>
- manage teams and rosters <br>
- assign captains <br>
- update team stats <br>
- oversee team bookings/spares <br>

# League Manager <br> <br>

This is the better role for “manage a league”: <br> <br>

- create season schedules <br>
- manage standings <br>
- update league-wide statistics <br>
- manage teams inside the league <br>

----------------
# Work Flow

# That gives you this exact workflow:

1 - Player opens upcoming game <br>
2 - Clicks Can’t make it <br>
3 - Optionally writes a note <br>
4 - Chooses Need spare <br>
5 - Captain/GM gets notified <br>
6 - System can auto-create a spare request <br>

Backend permission approach <br> <br>

In NestJS, you can protect endpoints by membership role, not just logged-in status. <br> <br>

# Examples: <br> <br>

POST /teams/:id/schedule → captain or GM <br>
POST /leagues/:id/games → league manager <br>
PATCH /games/:id/stats → captain, GM, or league manager <br>
POST /games/:id/availability → any team player in that game <br>
POST /games/:id/request-spare → captain or GM <br> <br>

# Frontend behavior

When logged in, show different dashboard sections based on the user’s memberships. <br> <br>

<b>Player dashboard</b> <br>
- My schedule <br>
- My statsMy schedule <br>
- My schedule <br>
- Team chat/messages <br>
- Upcoming games <br>
- My schedule <br> <br>

<b>Captain dashboard</b> <br>
- Team lineup <br>
- Missing players <br>
- Spare requests <br>
- Messages from players <br>

<b>GM dashboard</b> <br>
- Team management <br>
- Schedule editor <br>
- Stats updates <br>
- League/team overview <br> <br>

<b>League manager dashboard</b> <br>
- League schedule <br>
- Standings <br>
- Team registration <br>
- Stat administration <br> <br>

For HockeySpare, I would implement these first: <br>

PLAYER <br>
CAPTAIN <br>
GENERAL_MANAGER <br>
LEAGUE_MANAGER <br>

Stored in membership tables, not directly as one role on User. <br>

-----------------
In order to view the database: <br>

cd apps\api <br> <br>

npx prisma studio <br> <br>

GET DOCKER DESKTOP RUNNING:
Start-Process "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"

192.168.2.11
# How to deploy on rasberry Pi:3
1 - ssh pi@raspberrypi.local <br>
2 - cd /opt/hockeyspare <br>
3 - git pull  <br>
4 - pi@raspberrypi:/opt/hockeyspare $ npm --prefix apps/web run build -- --configuration production  <br>
5 - sudo rsync -av --delete /opt/hockeyspare/apps/web/dist/hockeyspare-web/browser/ /var/www/hockeyspare/browser/ <br>



# Reset Data in PostGres:

<b>1 - Enter PostGres:</b>
<br>
sudo -u postgres psql<br>

<b>2 - Then inside psql:</b>
<br>
DROP DATABASE hockeyspare;<br>
CREATE DATABASE hockeyspare OWNER hockeyspare;<br>
\q

<b>3 - Then recreate your Prisma schema:</b>
<br>
cd /opt/hockeyspare/apps/api<br>
npx prisma migrate deploy<br>
<br>
<b>4 - If you are using dev migrations:</b><br>
npx prisma migrate dev<br>
