const BitrixIntegration = require('../integration/bitrix.integration')

const getAllTasksWithFilters = async (bitrixAccess, fromDate, toDate, groupsSelected, userId) => {
	let totalTickets = []
	const limit = 50
	let start = 0
	let iterations = null
	do {
		let data = await BitrixIntegration.getTasksWithFilters(bitrixAccess, start, fromDate, toDate, groupsSelected, userId)
		if (data.status === 401 && data.newAccess) {
			return data
		} else {
			if (!iterations) {
				iterations = data.total === 0 ? 0 : Math.ceil(data.total / limit)
			}
			start += limit
			iterations--
			totalTickets.push(...data?.result?.tasks)
		}
	} while (iterations > 0)

	return totalTickets
}

const getBitrixUsersByIds = async (userIds, bitrixAccess) => {
	let formattedUserIdsParams = ''
	if (userIds) {
		formattedUserIdsParams = userIds
			.map((uId) => '&ID[]=' + uId)
			.toString()
			.replaceAll(',', '')
	}
	let bitrixUsers = await BitrixIntegration.getBitrixUsersByIds(bitrixAccess, formattedUserIdsParams)
	if (bitrixUsers.status === 401 && bitrixUsers.newAccess) {
		bitrixAccess = bitrixUsers.newAccess
		bitrixUsers = await BitrixIntegration.getBitrixUsersByIds(bitrixAccess, formattedUserIdsParams)
	}
	return bitrixUsers?.result
}

const getFinalAccessUrl = async (authCode, scope, domain) => {
	return await BitrixIntegration.getFinalAccessUrl(authCode, scope, domain)
}

const getUrlAuth = async (domainBitrix) => {
	return await BitrixIntegration.getUrlAuth(domainBitrix)
}

const getBitrixGroups = async (bitrixAccess) => {
	const res = await BitrixIntegration.getBitrixGroups(bitrixAccess)
	if (res.status === 401) {
		return res
	}
	return res.result
}

const getTaskHistory = async (bitrixAccess, taskId) => {
	return await BitrixIntegration.getTaskHistory(bitrixAccess, taskId)
}

module.exports = {
	getAllTasksWithFilters,
	getBitrixUsersByIds,
	getFinalAccessUrl,
	getUrlAuth,
	getBitrixGroups,
	getTaskHistory
}
