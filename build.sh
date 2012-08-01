#!/bin/sh
poole.py --build . --base-url http://zserge.com || exit 1
echo "Serving on localhost:8080"
poole.py --serve . 
