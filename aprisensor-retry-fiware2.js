/**
 *  retry messages stored in folder
 */

// add module specific requires
const fs = require('node:fs');
var axios = require('axios');
const path = require('node:path');


const folderPath = "/opt/SCAPE604/apri-sensor-service-messages/fiware2"

const isFile = fileName => {
  return fs.lstatSync(fileName).isFile();
};

let files = fs.readdirSync(folderPath)
  .map(fileName => {
    return path.join(folderPath, fileName);
  })
  .filter(isFile);

var sendFiwareData2 = async function (data) {
        var url = data.url
        var headers = data.headers

        await axios.post(url, data.data, { 'headers': data.headers })
                .then(function (response) {

                        if (response.status != 201) {
                        console.log("axios then: ",response.status)
                        }
                })
                .catch(function (error) {
                        if (error.response) {
                                // console.log(error.response);
//                              console.log(error.response.status)
//                              console.log(error.response.statusTekst)
//                              console.log(error.response.data)
                        } else if (error.request) {
                                console.log('Error request: ' + error.request);
                        } else {
                                // Something happened in setting up the request that triggered an Error
                                console.log('Error message', error.message);
                        }
                        //    console.log(error.config);

                        if (error.response?.status == 422 && error.response?.data?.description == "Already Exists") {
                                // console.log('422 no problem')
                        } else {
                                console.log('fiware catch')
                                console.log(error)
                        }

                });
};

console.log(files.length)
for (let i=0;i<files.length;i++) {
  try {
    let dataIn = fs.readFileSync(files[i], 'utf8').split('\n')
    for (let j=0;j<dataIn.length;j++) {
      if (dataIn[j] !='') {
        console.log((i+1)+'/'+(j+1));
        let data = JSON.parse(dataIn[j])
        console.log(data.data.sensorId);
        sendFiwareData2(data);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
