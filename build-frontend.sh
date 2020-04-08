#!/bin/bash

# change this to specify where this application will be served from
# it not in a parameter yet for risk management
INSTALL_DIR="/srv/com.mlvox.www/static/"
LOCAL_FRONTEND_OUTPUT="out_frontend"

# == Frontend ==

# build the image (which builds the site, to the /app/build folder)
docker build . -f Dockerfile.frontend --tag=mlvox-frontend

# instantiate the image (into a container), copy the files out, and kill the container
echo "> Instantiating the built Frontend container"
FRONTEND_CONTAINER=$(docker run --rm -d -t mlvox-frontend:latest /bin/bash)
echo "> Copying Frontend output (/app/build) to $LOCAL_FRONTEND_OUTPUT..."
rm -fr "$LOCAL_FRONTEND_OUTPUT"
docker cp "$FRONTEND_CONTAINER":/app/build/. "$LOCAL_FRONTEND_OUTPUT"
echo -n "> Removing instantiated container... "
docker kill "$FRONTEND_CONTAINER" > /dev/null
echo "done."

# install (copy over) the new Frontend to the installation folder
rm -fr "$INSTALL_DIR"/precache* "$INSTALL_DIR"/static/
cp -a "$LOCAL_FRONTEND_OUTPUT"/* "$INSTALL_DIR"
rm -f "$INSTALL_DIR"/service-worker.js
rm -fr "$LOCAL_FRONTEND_OUTPUT"

# == Cleanup ==
echo -n "> Cleaning up docker images... "
docker rmi $(docker image ls -f dangling=true -q) 2> /dev/null
echo "done."
echo
