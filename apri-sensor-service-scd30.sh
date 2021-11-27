#!/bin/sh

cd `dirname $0`
#node apri-sensor-service-bme680.js >>$1 2>>$1
node apri-sensor-service-sensormain.js scd30  >>$1 2>>$1
exit -1
