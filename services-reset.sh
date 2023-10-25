
systemctl stop SCAPE604-apri-sensor-service-ds18b20
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ds18b20-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-ds18b20

systemctl stop SCAPE604-apri-sensor-service-pmsa003
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-hour-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-wsaqi.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003-wsaqi-log2.log
systemctl start SCAPE604-apri-sensor-service-pmsa003

systemctl stop SCAPE604-apri-sensor-service-pms7003
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003-hour-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003-wsaqi.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pms7003-wsaqi-log2.log
systemctl start SCAPE604-apri-sensor-service-pms7003

systemctl stop SCAPE604-apri-sensor-service-tsi3007
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tsi3007-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-tsi3007

systemctl stop SCAPE604-apri-sensor-service-bme280
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme280-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-bme280

systemctl stop SCAPE604-apri-sensor-service-dylos
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-dylos-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-dylos

#systemctl stop SCAPE604-apri-sensor-service-tgs5042
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-tgs5042-hour-log2.log
#systemctl start SCAPE604-apri-sensor-service-tgs5042

systemctl stop SCAPE604-apri-sensor-service-bme680
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bme680-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-bme680

systemctl stop SCAPE604-apri-sensor-service-ips7100
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-ips7100-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-ips7100

systemctl stop SCAPE604-apri-sensor-service-sps30
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sps30-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-sps30

systemctl stop SCAPE604-apri-sensor-service-scd30
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-scd30-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-scd30

#systemctl stop SCAPE604-apri-sensor-service-caire
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-caire-hour-log2.log
#systemctl start SCAPE604-apri-sensor-service-caire

systemctl stop SCAPE604-apri-sensor-service-solar
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-solar.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-solar-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-solar-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-solar-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-solar

systemctl stop SCAPE604-apri-sensor-service-bam1020
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bam1020.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bam1020-log2.log
#mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bam1020-hour.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-bam1020-hour-log2.log
systemctl start SCAPE604-apri-sensor-service-bam1020

systemctl stop SCAPE604-apri-sensor-service-pmsa003nm
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003nm.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-pmsa003nm-log2.log
systemctl start SCAPE604-apri-sensor-service-pmsa003nm

systemctl stop SCAPE604-apri-sensor-service-sensorselect
mv /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sensorselect.log /opt/SCAPE604/log/SCAPE604-apri-sensor-service-sensorselect-log2.log
mv /opt/SCAPE604/log/apri-sensor-service-sensorselect_5050.log /opt/SCAPE604/log/apri-sensor-service-sensorselect_5050-log2.log
systemctl start SCAPE604-apri-sensor-service-sensorselect

