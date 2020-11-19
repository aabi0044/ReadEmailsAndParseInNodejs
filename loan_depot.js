console.log("mail.text", mail.subject)
if (mail.subject.startsWith("Fwd: LOAN DEPOT")) {
    let filteredData = []
    textInArray = mail.text.split("\n")
    textInArray.map(item => {
        if (item) {
            filteredData.push(item)
        }
    })
    let mappedData = []
    filteredData.forEach((item, index) => {

        if (item === "Loan #:" && filteredData[index + 1] !== "Borrower:") {
            mappedData.push({ loan_number: filteredData[index + 1] })
        }
        if (item === "Borrower:" && filteredData[index + 1] !== "Best Contact:") {
            mappedData.push({ borrower: filteredData[index + 1] })
        }

        if (item === "Best Contact:" && filteredData[index + 1] !== "Home Phone:") {
            mappedData.push({ best_contract: filteredData[index + 1] })
        }
        if (item === "Home Phone:" && filteredData[index + 1] !== "Work Phone:") {
            mappedData.push({ home_phone: filteredData[index + 1].replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") })
        }

        if (item === "Work Phone:" && filteredData[index + 1] !== "Cell Phone:") {
            mappedData.push({ work_phone: filteredData[index + 1].replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") })
        }

        if (item === "Cell Phone:" && filteredData[index + 1] !== "Email:") {
            mappedData.push({ cell_phone: filteredData[index + 1].replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") })
        }

        if (item === "Email:" && filteredData[index + 1] !== "Signing Date:") {

            mappedData.push({ email: filteredData[index + 1].split("<")[0] })
        }

        if (item === "Signing Date:" && filteredData[index + 1] !== "Signing Time:") {
            mappedData.push({ signing_date: filteredData[index + 1] })
        }

        if (item === "Signing Time:" && filteredData[index + 1] !== "Processor Name:") {
            mappedData.push({ signing_time: filteredData[index + 1] })
        }

        if (item === "Processor Name:" && filteredData[index + 1] !== "Reason:") {
            mappedData.push({ processor_name: filteredData[index + 1] })
        }

        if (item === "Reason:" && filteredData[index + 1] !== "Signing Address") {
            mappedData.push({ reason: filteredData[index + 1] })
        }

        if (item === "Occupancy:" && filteredData[index + 1] !== "Loan Purpose:") {
            mappedData.push({ occupancy: filteredData[index + 1] })
        }
        if (item === "Loan Purpose:" && filteredData[index + 1]) {
            mappedData.push({ loan_purpose: filteredData[index + 1] })
        }

        if (item === "Signing Address") {
            let signing_aadress = {}
            console.log("inedex", index)
            if (filteredData[index + 1] === "Location Name:" && filteredData[index + 3] === "Address:") {
                signing_aadress.location_name = filteredData[index + 2]
            }

            if (filteredData[index + 3] === "Address:" && filteredData[index + 5] === "City:") {
                signing_aadress.address = filteredData[index + 4]
            }

            if (filteredData[index + 5] === "City:" && filteredData[index + 7] === "County:") {
                signing_aadress.city = filteredData[index + 6]
            }

            if (filteredData[index + 7] === "County:" && filteredData[index + 9] === "State:") {
                signing_aadress.country = filteredData[index + 8]
            }

            if (filteredData[index + 9] === "State:" && filteredData[index + 11] === "Zip:") {
                signing_aadress.state = filteredData[index + 10]
            }

            if (filteredData[index + 11] === "Zip:" && filteredData[index + 13] === "Property Address") {
                signing_aadress.zip = filteredData[index + 12]
            }

            mappedData.push({ signing_aadress })


        }

        if (item === "Property Address") {
            let property_aadress = {}
            console.log("inedex", index)
            if (filteredData[index + 1] === "Address:" && filteredData[index + 3] === "City:") {
                property_aadress.address = filteredData[index + 2]
            }

            if (filteredData[index + 3] === "City:" && filteredData[index + 5] === "County:") {
                property_aadress.city = filteredData[index + 4]
            }

            if (filteredData[index + 5] === "County:" && filteredData[index + 7] === "State:") {
                property_aadress.country = filteredData[index + 6]
            }

            if (filteredData[index + 7] === "State:" && filteredData[index + 9] === "Zip:") {
                property_aadress.state = filteredData[index + 8]
            }

            if (filteredData[index + 9] === "Zip:" && filteredData[index + 11] === "Occupancy:") {
                property_aadress.zip = filteredData[index + 10]
            }

            mappedData.push({ property_aadress })
        }
    })
    const finalObject = Object.assign({}, ...mappedData);
    let signingPayload = {...signingOrderPayload};
    signingPayload.parameters.order_id = "13010191";
    signingPayload.parameters.signing_address_data.address_name = finalObject.signing_aadress.location_name;
    signingPayload.parameters.signing_address_data.address = finalObject.signing_aadress.address;
    signingPayload.parameters.signing_address_data.city= finalObject.signing_aadress.city;
    signingPayload.parameters.signing_address_data.state= finalObject.signing_aadress.state;
    signingPayload.parameters.signing_address_data.zip = finalObject.signing_aadress.zip;
    signingPayload.parameters.signing_address_data.county = finalObject.signing_aadress.country;
    signingPayload.parameters.signer_email = finalObject.email;
    signingPayload.parameters.signer_cell_phone = finalObject.cell_phone;
    signingPayload.parameters.signer_home_phone=finalObject.home_phone;

    // console.log("signingPayload",signingPayload)
    //      axios.post('https://crm.pacdocsign.com/api/notaryapi', signingPayload)
    //           .then(function (response) {
    //               console.log("Response",response.data)
    //             res.send(response.data)
    //           })
    //           .catch(function (error) {
    //             console.log(error);
    //           });

}