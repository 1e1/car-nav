#!/bin/bash

export EXTERNAL_IP=$(docker-machine ip)
docker-compose $@
