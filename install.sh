#!/bin/bash
cd /home/bradf/Dev/Websites/bc-quote-estimator
npm install 2>&1
echo "---INSTALL COMPLETE---"
npx next build 2>&1
echo "---BUILD COMPLETE---"
