## Eksborder Shipping API
> Eksborder Shipping API is a public API that provides Shipping Label Gneration and Manifest Creation services to all Eksborder customers.

### How to run
> Please follow the steps to build and run the application

Create a .env file at the root level based on .env_sample file. Update the .env file with valid information. Then run the commands below.

``` bash
# install dependencies
$ npm install

# build the project
$ npm run build

# start the application on local machine
$ npm start
```

For development can also start the server with command:

``` bash
# this command will use  nodemon to auto restart application with every change
$ npm run dev
```

### Deployment steps
> Below are the steps about how to deploy the application on a Linux server

1. install nodejs 12.* version  mongoDB 4.2
1. install pm2 - node server
1. install git and clone project in to /home folder
1. run the following commands
``` bash
# install dependencies
$ npm install

# build the project
$ npm run build

# start the application on with pm2
$ pm2 start npm --name "Eksborder" -- run "start"
```
5. use this article for config pm2 service - https://futurestud.io/tutorials/pm2-restart-processes-after-system-reboot

### Deployment Environment

#### Nginx Configuration
conf file location: "/usr/local/nginx/conf/vhosts/sandbox-api-eksborder.conf"

#### MongoDB Commands
``` bash
# Check MongoDB Status
$ sudo systemctl status mongod

# Start MongoDB Service
$ sudo systemctl start mongod

# Restart MongoDB Service
$ sudo systemctl restart mongod
```