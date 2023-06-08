#!/bin/sh

cd `dirname $0`
node apri-sensor-service-sensormain.js ips7100  >>$1 2>>$1
exit -1
