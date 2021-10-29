const express = require('express')
var cors = require('cors')
const bodyParser = require('body-parser')
const API_PORT = 3001
const app = express()

const ContractController = require('./controllers/ContractController')

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/contractController', ContractController);

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));