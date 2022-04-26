
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-hour-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-wsaqi.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-wsaqi-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-hour-log2.log

mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-log2.log
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-hour-log2.log


#systemctl start SCAPE604-apri-sensor-service-arduinobin.service
systemctl start SCAPE604-apri-sensor-service-ds18b20.service
systemctl start SCAPE604-apri-sensor-service-ds18b20-hour.service
systemctl start SCAPE604-apri-sensor-service-pmsa003.service
systemctl start SCAPE604-apri-sensor-service-pmsa003-hour.service
systemctl start SCAPE604-apri-sensor-service-pmsa003-wsaqi.service

systemctl start SCAPE604-apri-sensor-service-tsi3007-hour.service
systemctl start SCAPE604-apri-sensor-service-tsi3007.service
systemctl start SCAPE604-apri-sensor-service-bme280.service
systemctl start SCAPE604-apri-sensor-service-bme280-hour.service
systemctl start SCAPE604-apri-sensor-service-dylos.service
systemctl start SCAPE604-apri-sensor-service-dylos-hour.service

systemctl start SCAPE604-apri-sensor-service-tgs5042.service
systemctl start SCAPE604-apri-sensor-service-tgs5042-hour.service       

#systemctl start SCAPE604-apri-sensor-service-sensorcontrol.service
#systemctl start SCAPE604-apri-server-images.service

systemctl start SCAPE604-apri-sensor-service-bme680.service
systemctl start SCAPE604-apri-sensor-service-bme680-hour.service
#systemctl start SCAPE604-apri-sensor-service-sensorselect.service
#systemctl start SCAPE604-apri-server-sensorcontrol.service

systemctl start SCAPE604-apri-sensor-service-ips7100.service
systemctl start SCAPE604-apri-sensor-service-ips7100-hour.service
systemctl start SCAPE604-apri-sensor-service-sps30.service
systemctl start SCAPE604-apri-sensor-service-sps30-hour.service
systemctl start SCAPE604-apri-sensor-service-scd30.service
systemctl start SCAPE604-apri-sensor-service-scd30-hour.service
#systemctl start SCAPE604-openiod-fiware-connect-josene.service

systemctl start SCAPE604-apri-sensor-service-caire.service
systemctl start SCAPE604-apri-sensor-service-caire-hour.service
#systemctl start SCAPE604-openiod-fiware-connect-server-knmi.service

#systemctl start SCAPE604-openiod-fiware-connect-ttn-arbaminch.service
