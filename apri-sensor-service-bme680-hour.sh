#!/bin/sh

cd `dirname $0`
node apri-sensor-service-sensormain.js bme680_hour  >>$1 2>>$1
exit -1
