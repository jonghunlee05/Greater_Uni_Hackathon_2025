#! /bin/bash

docker build -t server .
docker run -d -p 8443:443 server
