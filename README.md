# HockeySpare

App	                  Where to run	  Command
Backend (NestJS)	    apps/api	      npm run start:dev
Frontend (Angular)	  apps/web	      ng serve -o

✔ Backend running? http://localhost:3000/requests

✔ Frontend running? http://localhost:4200

✔ CORS enabled?



-----------------
In order to view the database:

cd apps\api

npx prisma studio

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
