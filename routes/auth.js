const express = require('express')
const { register, login, getMe } = require('../controllers/auth')

const router = express.Router()

router
    .post('/register', register)
    .post('/login', login)
    .post('/me', getMe)

module.exports = router