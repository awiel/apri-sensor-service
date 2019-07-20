#!/bin/sh

cd `dirname $0`
#node apri-sensor-service-bme280.js >>$1 2>>$1
node apri-sensor-service-sensormain.js bme280  >>$1 2>>$1
exit -1
