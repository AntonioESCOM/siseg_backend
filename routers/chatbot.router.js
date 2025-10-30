const router = require("express").Router();
const actionsUser = require('../controllers/chatbot.controllers');

router.post('/chatbotQuery', actionsUser.chatbotQuery);

module.exports = router