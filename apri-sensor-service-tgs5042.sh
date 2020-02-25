#!/bin/sh

cd `dirname $0`
node apri-sensor-service-tgs5042.js >>$1 2>>$1
exit -1
