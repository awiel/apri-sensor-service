#!/bin/sh

cd `dirname $0`
#node apri-sensor-service-ds18b20.js >>$1 2>>$1
node apri-sensor-service-sensormain.js ds18b20  >>$1 2>>$1
exit -1
