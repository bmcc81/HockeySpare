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


# How to deploy on rasberry Pi:
1 - cd /opt/hockeyspare <br>
2 - git pull  <br>
3 - pi@raspberrypi:/opt/hockeyspare $ npm --prefix apps/web run build -- --configuration production  <br>
4 - sudo rsync -av --delete /opt/hockeyspare/apps/web/dist/hockeyspare-web/browser/ /var/www/hockeyspare/browser/ <br>



# Reset Data in PostGres:
npx prisma migrate reset
