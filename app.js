var express = require('express');
var app = express();
var imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');
var fs = require('fs');
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
            var searchCriteria = ['UNSEEN'];
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
                        fs.writeFileSync(`${mail.subject.split(" ")[0].replace(/[^a-z\d\s]+/gi, "")}.txt`,JSON.stringify(finalObject))
                        console.log("Mail Subject======================================", finalObject)
res.send("finished")
                    });
                });
            });
        });
    });
});
app.listen(4000, function () {
    console.log(' app listening on port 4000!');
});