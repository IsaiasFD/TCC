const DashboardService = require('../service/dashboard.service')

const getAllTasksAndGroupsWithMembers = async (req, res) => {
	const fromDate = req.params.fromDate
	const toDate = req.params.toDate
	const userId = req.userInfo.userId
	const groups = req.params.groups

	try {
		const data = await DashboardService.getAllTasksAndGroupsWithMembers(userId, fromDate, toDate, groups)
		return res.status(200).send(data)
	} catch (e) {
		let status = e.status || 500
		let message = e.message || 'Erro ao buscar grupos e membros'
		return res.status(status).send(message)
	}
}

const getBitrixGroups = async (req, res) => {
	const userId = req.userInfo.userId

	try {
		const data = await DashboardService.getBitrixGroups(userId)
		return res.status(200).send(data)
	} catch (e) {
		let status = e.status || 500
		let message = e.message || 'Erro ao buscar grupos'
		return res.status(status).send(message)
	}
}

module.exports = {
	getAllTasksAndGroupsWithMembers,
	getBitrixGroups
}
