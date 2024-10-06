const axios = require('axios')
const config = require('../config')
const UserAccountRepository = require('../repository/userAccount.repository')

const { CLIENT_ID, CLIENT_SECRET, URL } = config.BITRIX
const redirectUrl = config.ETC.BASE_FRONT_URL

//1 passo login
const getUrlAuth = async (domainBitrix) =>
	`https://${domainBitrix + '.' + URL}/oauth/authorize/?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUrl}`

//2 passo login
const buildFinalAccessUrl = (authCode, scope, fullDomain) =>
	`https://${fullDomain}/oauth/token/?client_id=${CLIENT_ID}&grant_type=authorization_code&client_secret=${CLIENT_SECRET}&redirect_uri=${redirectUrl}&code=${authCode}&scope=${scope}`

const getFinalAccessUrl = async (authCode, scope, fullDomain) => {
	return axios
		.get(buildFinalAccessUrl(authCode, scope, fullDomain))
		.then((res) => {
			const { access_token, refresh_token, scope, user_id, domain } = res.data
			return { access_token, refresh_token, scope, user_id, domain }
		})
		.catch((e) => console.error(e))
}

//Metricas
const baseAppBitrixRestUrlTask = (fullDomain, accessToken) => `https://${fullDomain}/rest/tasks.task.list.json?auth=${accessToken}`
const baseAppBitrixRestUrlUser = (fullDomain, accessToken) => `https://${fullDomain}/rest/user.get.json?auth=${accessToken}`
const baseAppBitrixUrlRefreshToken = (
	refreshToken
) => `https://oauth.bitrix.info/oauth/token?grant_type=refresh_token&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${refreshToken}
	`

const baseAppBitrixRestUrlTaskHistory = (fullDomain, accessToken, taskId) =>
	`https://${fullDomain}/rest/tasks.task.history.list.json?auth=${accessToken}&taskId=${taskId}`

const getTaskHistory = async (bitrixAccess, taskId) => {
	const restUrl = baseAppBitrixRestUrlTaskHistory(bitrixAccess.fullDomain, bitrixAccess.accessToken, taskId)
	try {
		const res = await axios.get(restUrl)
		return res.data
	} catch (e) {
		if (e.response.status === 401) {
			try {
				const { data } = await axios.get(baseAppBitrixUrlRefreshToken(bitrixAccess.refreshToken))
				bitrixAccess.accessToken = data.access_token
				const res = await axios.get(restUrl)
				return res.data
			} catch (refreshError) {
				console.error('Error refreshing token:', refreshError)
				throw refreshError
			}
		} else {
			console.error('Error fetching task history:', e)
			throw e
		}
	}
}

const getBitrixGroups = async (bitrixAccess) => {
	const restUrl = `https://${bitrixAccess.fullDomain}/rest/sonet_group.user.groups.json?auth=${bitrixAccess.accessToken}`
	try {
		const response = await axios.get(restUrl)
		return response.data
	} catch (error) {
		console.error('Error fetching groups:', error)
		throw error
	}
}

const getFilterGroupId = (groups) => {
	return convertStringToList(groups)
		.map((g) => `&filter[GROUP_ID][]=${g}`)
		.join('')
}

const convertStringToList = (str) => {
	return str.split(',').map(Number)
}

const getTasksWithFilters = async (bitrixAccess, start, fromDate, toDate, groupsSelected) => {
	const restUrl = baseAppBitrixRestUrlTask(bitrixAccess.fullDomain, bitrixAccess.accessToken)
	const res = await axios
		.get(
			restUrl +
				`&start=${start}&filter[>CREATED_DATE]=${fromDate + '00:00:00'}&filter[<CREATED_DATE]=${
					toDate + '23:59:59'
				}&select[]=*&select[]=TAGS&select[]=UF_*` +
				getFilterGroupId(groupsSelected)
		)
		.catch(async (e) => {
			if (e.response.status === 401) {
				const { data } = await axios.get(baseAppBitrixUrlRefreshToken(bitrixAccess.refreshToken)).catch(async (e) => {
					if (e.response.status === 400) {
						throw { status: 401, message: 'Refresh Token do bitrix expirado, é necessário relogar no sistema' }
					}
				})
				const newUserAccount = await UserAccountRepository.refreshAccess(data.access_token, data.refresh_token, data.user_id)
				const newBitrixAccess = {
					fullDomain: newUserAccount.domain_bitrix,
					accessToken: newUserAccount.access_token_bitrix,
					refreshToken: newUserAccount.refresh_token_bitrix
				}
				return { data: { status: 401, newAccess: newBitrixAccess } }
			}
		})

	// const tasks = res?.data?.result?.tasks || []
	// for (const task of tasks) {
	// 	const history = await getTaskHistory(bitrixAccess, task.id)
	// 	task.history = history
	// }

	return res?.data || { total: null, result: { tasks: [] } }
}

const getBitrixUsersByIds = async (bitrixAccess, formattedUserIdsParams) => {
	let res = await axios
		.get(baseAppBitrixRestUrlUser(bitrixAccess.fullDomain, bitrixAccess.accessToken) + formattedUserIdsParams)
		.catch(async (e) => {
			if (e.response.status === 401) {
				const { data } = await axios.get(baseAppBitrixUrlRefreshToken(bitrixAccess.refreshToken)).catch(async (e) => {
					if (e.response.status === 400) {
						throw { status: 401, message: 'Refresh Token do bitrix expirado, é necessário relogar no sistema' }
					}
				})
				const newUserAccount = await UserAccountRepository.refreshAccess(data.access_token, data.refresh_token, data.user_id)
				const newBitrixAccess = {
					fullDomain: newUserAccount.domain_bitrix,
					accessToken: newUserAccount.access_token_bitrix,
					refreshToken: newUserAccount.refresh_token_bitrix
				}
				return { data: { status: 401, newAccess: newBitrixAccess } }
			}
		})
	return res?.data || { total: null, result: { tasks: [] } }
}

module.exports = {
	getUrlAuth,
	getFinalAccessUrl,
	getTasksWithFilters,
	getBitrixUsersByIds,
	getBitrixGroups
}
