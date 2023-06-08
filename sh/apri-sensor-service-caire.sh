#!/bin/sh

cd `dirname $0`
#node apri-sensor-service-caire.js >>$1 2>>$1
node apri-sensor-service-sensormain.js caire  >>$1 2>>$1
exit -1
