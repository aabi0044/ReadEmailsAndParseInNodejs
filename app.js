var express = require('express');
var app = express();
var imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');
var GoogleMapsAPI = require('googlemaps');
const axios = require('axios').default;
const payload = require('./create-order-object.js')
const signingObject = require('./signing-order-object.js')
const moment = require('moment-timezone');



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

    imaps.connect(config).then(function (connection) {

        return connection.openBox('INBOX', false).then(function () {
            var searchCriteria = ['UNSEEN'];
            var fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
            };

            return connection.search(searchCriteria, fetchOptions).then(function (messages) {
                let createdOrders = [];

                if (messages.length > 0) {
                    messages.forEach(async function (item) {
                        var all = _.find(item.parts, { "which": "" })
                        var id = item.attributes.uid;
                        var idHeader = "Imap-Id: " + id + "\r\n";
                        let textInArray = []

                        connection.addFlags(id, "\Seen", function (err) {
                            if (!err) {
                                console.log("marked as read");
                            } else {
                                console.log(JSON.stringify(err, null, 2));
                            }
                        });
                        let mail = await simpleParser(idHeader + all.body);


                        if (mail.subject.includes("Closing Service Ordered for")) {
                            console.log("next if")
                            let newArray = []
                            textInArray = mail.text.split("\n")
                            textInArray.forEach(item => {

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

                            var date = new Date(finalObject.schedulingClosingDateAndTime);
                            finalObject.schedulingClosingDateAndTime =
                                date.getFullYear() + "-" +
                                ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
                                ("00" + date.getDate()).slice(-2)
                                + " " +
                                ("00" + date.getHours()).slice(-2) + ":" +
                                ("00" + date.getMinutes()).slice(-2) + ":" +
                                ("00" + date.getSeconds()).slice(-2);

                            //updating borrower1
                            if (finalObject.borrower1) {
                                if (finalObject.borrower1.split(" ").length == 2) {
                                    finalObject.borrower1 = {
                                        firstName: finalObject.borrower1.split(" ")[0],
                                        lastName: finalObject.borrower1.split(" ")[1]
                                    }
                                } else if (finalObject.borrower1.split(" ").length > 2) {
                                    finalObject.borrower1 = {
                                        firstName: finalObject.borrower1.substr(0, finalObject.borrower1.indexOf(' ')),
                                        lastName: finalObject.borrower1.substr(finalObject.borrower1.indexOf(' ') + 1)
                                    }
                                }
                                else if (finalObject.borrower1.split(" ").length === 1) {
                                    finalObject.borrower1 = {
                                        firstName: finalObject.borrower1,
                                        lastName: " "
                                    }
                                }
                            }

                            //updating borrower2

                            if (finalObject.borrower2) {
                                if (finalObject.borrower2.split(" ").length == 2) {
                                    finalObject.borrower2 = {
                                        firstName: finalObject.borrower2.split(" ")[0],
                                        lastName: finalObject.borrower2.split(" ")[1]
                                    }
                                } else if (finalObject.borrower2.split(" ").length > 2) {
                                    finalObject.borrower2 = {
                                        firstName: finalObject.borrower2.substr(0, finalObject.borrower2.indexOf(' ')),
                                        lastName: finalObject.borrower2.substr(finalObject.borrower2.indexOf(' ') + 1)
                                    }
                                }
                                else if (finalObject.borrower2.split(" ").length === 1) {
                                    finalObject.borrower2 = {
                                        firstName: finalObject.borrower2,
                                        lastName: " "
                                    }
                                }
                            }


                            // Google map api geocodingapi integration

                            var publicConfig = {
                                key: 'AIzaSyBUc7jJ_PvS8fORd-6-Lju_YWR-CgX6cis',
                                stagger_time: 1000,
                                encode_polylines: false,
                                secure: false,
                            };

                            // creating instance of api class

                            var gmAPI = new GoogleMapsAPI(publicConfig);

                            var closingLocationParams = { address: finalObject.closingLocation };

                            var propertyAddressParams = {
                                address: finalObject.propertyAddress
                            };

                            gmAPI.geocode(closingLocationParams, (err, result) => {
                                const address = result.results[0].formatted_address.split(",");
                                finalObject.closingLocation = {
                                    address: address[0].trim(),
                                    city: address[1].trim(),
                                    state: address[2].replace(/[0-9]/g, '').trim(),
                                    zip: address[2].replace(/^\D+/g, '').trim(),
                                    country: address[3].trim()
                                }

                                gmAPI.geocode(propertyAddressParams, async (err, resp) => {
                                    const address2 = resp.results[0].formatted_address.split(",");
                                    finalObject.propertyAddress = {
                                        address: address2[0].trim(),
                                        city: address2[1].trim(),
                                        state: address2[2].replace(/[0-9]/g, '').trim(),
                                        zip: address2[2].replace(/^\D+/g, '').trim(),
                                        country: address2[3].trim()
                                    }
                                    let payloadObj = { ...payload };

                                    //GENERATING originator_order_id
                                    const randomId = Math.floor(100000000 + Math.random() * 900000000).toString()


                                    // UPDATING PAYLOAD FOR API CALL

                                    payloadObj.parameters.closing_date = finalObject.schedulingClosingDateAndTime;
                                    payloadObj.parameters.borrower_data.first_name = finalObject.borrower1.firstName;
                                    payloadObj.parameters.borrower_data.last_name = finalObject.borrower1.lastName
                                    payloadObj.parameters.borrower_data.address.address = finalObject.propertyAddress.address;
                                    payloadObj.parameters.borrower_data.address.city = finalObject.propertyAddress.city;
                                    payloadObj.parameters.borrower_data.address.state = finalObject.propertyAddress.state;
                                    payloadObj.parameters.borrower_data.address.zip = finalObject.propertyAddress.zip;
                                    payloadObj.parameters.borrower_data.address.country = finalObject.propertyAddress.country;
                                    payloadObj.parameters.borrower_data.home_phone = finalObject.homeNumber1;

                                    if (finalObject.borrower2) {
                                        payloadObj.parameters.co_borrower_data.first_name = finalObject.borrower2.firstName;
                                        payloadObj.parameters.co_borrower_data.last_name = finalObject.borrower2.lastName;
                                    }

                                    payloadObj.parameters.property_address_data.address = finalObject.propertyAddress.address;
                                    payloadObj.parameters.property_address_data.city = finalObject.propertyAddress.city;
                                    payloadObj.parameters.property_address_data.state = finalObject.propertyAddress.state;
                                    payloadObj.parameters.property_address_data.zip = finalObject.propertyAddress.zip
                                    payloadObj.parameters.property_address_data.county = finalObject.propertyAddress.country;
                                    payloadObj.parameters.originator_order_id = finalObject.orderNumber;
                                    payloadObj.parameters.originator_file_id = finalObject.orderNumber;

                                    const response = await axios.post('https://crm.pacdocsign.com/api/notaryapi', payloadObj)

                                    const orderID = response.data.order_id;

                                    let signingPayload = { ...signingObject };
                                    signingPayload.parameters.order_id = orderID;
                                    signingPayload.parameters.signing_address_data.address_name = "borrowers house";
                                    signingPayload.parameters.signing_address_data.address = finalObject.closingLocation.address;
                                    signingPayload.parameters.signing_address_data.city = finalObject.closingLocation.city;
                                    signingPayload.parameters.signing_address_data.state = finalObject.closingLocation.state;
                                    signingPayload.parameters.signing_address_data.zip = finalObject.closingLocation.zip;
                                    signingPayload.parameters.signing_address_data.county = finalObject.closingLocation.country;

                                    signingPayload.parameters.order_note = finalObject.Instructions;
                                    signingPayload.parameters.closing_date = finalObject.schedulingClosingDateAndTime;
                                    const signingOrder = await axios.post('https://crm.pacdocsign.com/api/notaryapi', signingPayload)
                                    createdOrders.push(signingOrder.data)
                                    return createdOrders
                                })
                            });
                        }
                    })
                }
                else {
                    res.send("No New Email found !")
                }
                //return promise
                return Promise.all(createdOrders);
            }).then(orders => {
                res.json(orders)
            })
        });
    });
});
app.listen(4000, function () {
    console.log(' app listening on port 4000!');
});
