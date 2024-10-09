require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const config = require('./config')
const rabbitmqService = require('./service/rabbitmq.service')
const bitrixService = require('./service/bitrix.service')
const taskHistoryService = require('./service/taskHistory.service')
const UserAccountService = require('./service/userAccount.service')

const app = express()
const LoginResource = require('./resource/login.resource')
const DashboardResource = require('./resource/dashboard.resource')

const port = 4000

const PREFIX = '/api'

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const interceptor = (req, res, next) => {
	const token = req.headers.authorization
	if (!req.originalUrl.includes('/login')) {
		if (token) {
			try {
				const tokenData = jwt.verify(token.split(' ')[1], config.JWT_SECRET_KEY)
				req.userInfo = tokenData
			} catch (e) {
				console.error(e)
				res.status(403).json({ error: 'Favor autenticar novamente no sistema' })
				return
			}
		} else {
			res.status(403).json({ error: 'É necessário ter autenticação no sistema' })
		}
	}
	next()
}
app.use(interceptor)

const getBitrixAccess = async (userId) => {
	const [bitrixAccessInfo] = await UserAccountService.getUsersByIds(userId)
	let bitrixAccess = {
		fullDomain: bitrixAccessInfo.domain_bitrix,
		accessToken: bitrixAccessInfo.access_token_bitrix,
		refreshToken: bitrixAccessInfo.refresh_token_bitrix
	}
	return bitrixAccess
}

const processMessage = async (message) => {
	const body = JSON.parse(message)
	const taskId = body.taskId
	const userId = body.userId
	console.debug(`Processing task with ID: ${taskId}`)

	const bitrixAccess = await getBitrixAccess(userId)
	const taskHistory = await bitrixService.getTaskHistory(bitrixAccess, taskId)
	try {
		await taskHistoryService.createTaskHistory(taskId, taskHistory)
	} catch (e) {
		console.error(e)
	}
}

rabbitmqService.consumeQueue('task_queue', processMessage)

//Login
app.get(PREFIX + '/login/get-url-auth/:domainBitrix', LoginResource.getUrlAuth)
app.get(PREFIX + '/login', LoginResource.loginOrCreateAccount)
app.get(PREFIX + '/account/get-info', LoginResource.getInfoAccount)

//dashboard
app.get(PREFIX + '/dashboard/get-all-tasks-and-groups-with-members/:fromDate/:toDate/:groups', DashboardResource.getAllTasksAndGroupsWithMembers)
app.get(PREFIX + '/dashboard/get-groups', DashboardResource.getBitrixGroups)

app.listen(port, () => {
	console.info(`---- API funcionando na porta ${port} -----`)
})
