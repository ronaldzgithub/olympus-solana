
const {
    establishConnection,
    establishPayer,
    checkProgram,
    sayHello,
    reportGreetings,
} = require('./hello_world');
const express = require('express')
const router = express.Router()

async function main() {
    console.log("Let's say hello to a Solana account...");

    // Establish connection to the cluster
    await establishConnection();

    // Determine who pays for the fees
    await establishPayer();

    // Check if the program has been deployed
    await checkProgram();

    // Say hello to an account
    await sayHello();

    // Find out how many times that account has been greeted
    await reportGreetings();
}

router.post('/doGetWholeProcedure', (req, res) => {
    main().then(
        () => console.log('Success'),
        err => {
            console.error(err);
        },
    );
})

module.exports = router