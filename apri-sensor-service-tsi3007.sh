#!/bin/sh

cd `dirname $0`
node apri-sensor-service-tsi3007.js >>$1 2>>$1
exit -1
