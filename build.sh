#!/bin/sh
poole.py --build . || exit 1
echo "Serving on localhost:8080"
poole.py --serve . 
