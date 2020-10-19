var express = require('express');
var app = express();
var imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');
var fs = require('fs');
var GoogleMapsAPI = require('googlemaps');


app.get('/', async (req, res) => {



    var config = {
        imap: {
            user: 'abdullah.imation@outlook.com',
            password: 'Imation@123',
            host: 'outlook.office365.com',
            port: 993,
            tls: true,
            tlsOptions: {
                rejectUnauthorized: false
            },
            authTimeout: 3000,
            debug: console.log
        }
    };

    console.log("imaps", imaps.connect(config))

    imaps.connect(config).then(function (connection) {
        return connection.openBox('INBOX').then(function () {
            var searchCriteria = ['SEEN'];
            var fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
            };

            return connection.search(searchCriteria, fetchOptions).then(function (messages) {
                messages.forEach(function (item) {

                    var all = _.find(item.parts, { "which": "" })
                    var id = item.attributes.uid;
                    var idHeader = "Imap-Id: " + id + "\r\n";
                    let textInArray = []
                    simpleParser(idHeader + all.body, async (err, mail) => {
                        if (mail.subject.startsWith("Fw: Closing Service Ordered for Primary Loan")) {
                            let newArray = []
                            textInArray = mail.text.split("\n")
                            await textInArray.forEach(item => {

                                if (item.startsWith("Scheduled Closing Date and Time:")) {
                                    newArray.push({ ['schedulingClosingDateAndTime']: item.replace('Scheduled Closing Date and Time:', '').trim() })
                                }

                                if (item.startsWith("Closing Location:")) {
                                    newArray.push({ ['closingLocation']: item.replace('Closing Location:', '').trim() })
                                }

                                if (item.startsWith("Closing Loan #:")) {
                                    newArray.push({ ['closingLoanNumber']: item.replace('Closing Loan #:', '').trim() })
                                }

                                if (item.startsWith("Instructions:")) {
                                    newArray.push({ ['Instructions']: item.replace('Instructions:', '').trim() })
                                }

                                if (item.startsWith("Order #:")) {
                                    newArray.push({ ['orderNumber']: item.replace('Order #:', '').trim() })
                                }

                                if (item.startsWith("Primary Loan #:")) {
                                    newArray.push({ ['primaryLoanNumber']: item.replace('Primary Loan #:', '').trim() })
                                }

                                if (item.startsWith("Primary Loan Type:")) {
                                    newArray.push({ ['primaryLoanType']: item.replace('Primary Loan Type:', '').trim() })
                                }

                                if (item.startsWith("Property Address:")) {
                                    newArray.push({ ['propertyAddress']: item.replace('Property Address:', '').trim() })
                                }

                                if (item.startsWith("Borrower -")) {
                                    newArray.push({ ['borrower']: item.replace('Borrower -', '').trim() })
                                }

                                if (item.startsWith("Home:")) {
                                    newArray.push({ ['homeNumber']: item.replace('Home:', '').trim() })
                                }

                            })

                            newArray.forEach((item, index) => {
                                if (item.borrower) {
                                    if (index == 8) {
                                        Object.defineProperty(item, 'borrower1',
                                            Object.getOwnPropertyDescriptor(item, "borrower"));
                                        delete item['borrower']
                                    }
                                    if (index == 10) {
                                        Object.defineProperty(item, 'borrower2',
                                            Object.getOwnPropertyDescriptor(item, "borrower"));
                                        delete item['borrower']
                                    }
                                }

                                if (item.homeNumber) {
                                    if (index == 9) {
                                        Object.defineProperty(item, 'homeNumber1',
                                            Object.getOwnPropertyDescriptor(item, "homeNumber"));
                                        delete item['homeNumber']
                                    }
                                    if (index == 11) {
                                        Object.defineProperty(item, 'homeNumber2',
                                            Object.getOwnPropertyDescriptor(item, "homeNumber"));
                                        delete item['homeNumber']
                                    }
                                }
                            })

                            const finalObject = Object.assign({}, ...newArray);

                            let data = finalObject.schedulingClosingDateAndTime.split(' ');
                            const date = data[0] + ' ' + data[1] + ' ' + data[2];
                            const time = data[3] + ' ' + data[4];
                         
                            finalObject.schedulingClosingDateAndTime={
                                date,time
                            }

                            finalObject.borrower1={
                                firstName:finalObject.borrower1.split(" ")[0],
                                lastName:finalObject.borrower1.split(" ")[1]
                            }

                            finalObject.borrower2={
                                firstName:finalObject.borrower2.split(" ")[0],
                                lastName:finalObject.borrower2.split(" ")[1]
                            }

                            // Google map api geocodingapi integration

                            var publicConfig = {
                                key: '***********************',
                                stagger_time:       1000, 
                                encode_polylines:   false,
                                secure:             false, 
                               
                              };

                              // creating instance of api class

                              var gmAPI = new GoogleMapsAPI(publicConfig);

                            var closingLocationParams = {
                                "address":    finalObject.closingLocation,
                              };

                              var propertyAddressParams = {
                                  address: finalObject.propertyAddress
                              };
                              
                              gmAPI.geocode(closingLocationParams, (err, result)=>{
                              
                                const address = result.results[0].formatted_address.split(",");
                            
                                finalObject.closingLocation={
                                    address:address[0].trim(),
                                    city:address[1].trim(),
                                    state:address[2].replace(/[0-9]/g, '').trim(),
                                    zip:address[2].replace( /^\D+/g, '').trim(),
                                    country:address[3].trim()
                                }

                                gmAPI.geocode(propertyAddressParams, (err, resp)=>{

                                    const address2 = resp.results[0].formatted_address.split(",");
                                    finalObject.propertyAddress={
                                        address:address2[0].trim(),
                                        city:address2[1].trim(),
                                        state:address2[2].replace(/[0-9]/g, '').trim(),
                                        zip:address2[2].replace( /^\D+/g, '').trim(),
                                        country:address2[3].trim()
                                    }

                             
                                    fs.writeFileSync(`${mail.subject.split(" ")[0].replace(/[^a-z\d\s]+/gi, "")}.txt`, JSON.stringify(finalObject))
                                    console.log("Mail Subject======================================", finalObject)
                                    res.send("Process finished")
                                })
                              });
                        }
                    });
                });
            });
        });
    });
});
app.listen(4000, function () {
    console.log(' app listening on port 4000!');
});