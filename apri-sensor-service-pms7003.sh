#!/bin/sh

cd `dirname $0`
#node apri-sensor-service-pmsa003.js >>$1 2>>$1
node apri-sensor-service-sensormain.js pms7003  >>$1 2>>$1
exit -1
