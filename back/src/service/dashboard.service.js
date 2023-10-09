const BitrixService = require('./bitrix.service')
const UserAccountService = require('./userAccount.service')
const { formatSimpleUser, getNameAndIdFromUser, formatTask } = require('../utils/utils')

const extractMembersFromGroups = (data) => {
	const uniqueMembers = []
	data.groups.forEach((it) =>
		it.members.forEach((m) => {
			const memberFoundIndex = uniqueMembers.findIndex((um) => um.id === m.id)
			if (memberFoundIndex === -1) {
				uniqueMembers.push(m)
			} else {
				uniqueMembers[memberFoundIndex].accomplice.push(m.accomplice)
				uniqueMembers[memberFoundIndex].auditor.push(m.auditor)
				uniqueMembers[memberFoundIndex].closer.push(m.closer)
				uniqueMembers[memberFoundIndex].creator.push(m.creator)
				uniqueMembers[memberFoundIndex].responsible.push(m.responsible)
			}
		})
	)

	return uniqueMembers
}

const getAllTasksAndGroupsWithMembers = async (userId, fromDate, toDate) => {
	const [bitrixAccessInfo] = await UserAccountService.getUsersByIds(userId)
	let bitrixAccess = {
		fullDomain: bitrixAccessInfo.domain_bitrix,
		accessToken: bitrixAccessInfo.access_token_bitrix,
		refreshToken: bitrixAccessInfo.refresh_token_bitrix
	}
	let allTasks = await BitrixService.getAllTasksWithFilters(bitrixAccess, fromDate, toDate)
	if (allTasks.status === 401) {
		bitrixAccess = allTasks.newAccess
		allTasks = await BitrixService.getAllTasksWithFilters(bitrixAccess, fromDate, toDate)
	}

	let groups = []
	let members = []
	let tags = []
	allTasks.forEach((task) => {
		//Grupo (projeto)
		const groupFoundIndex = groups.findIndex((g) => g.id === task.group.id)
		let groupIndex = groupFoundIndex
		if (groupFoundIndex === -1) {
			groups.push({ ...task.group, members: [] })
			groupIndex = groups.length - 1
		}
		//Usuários da tarefa
		const taskAuditors = task.auditors.map((it) => ({ id: it, auditor: [{ taskId: task.id, groupId: task.group.id }] }))
		const taskCreator = { id: task.createdBy, creator: [{ taskId: task.id, groupId: task.group.id }] }
		const taskResponsible = { id: task.responsibleId, responsible: [{ taskId: task.id, groupId: task.group.id }] }
		const taskClosedBy = { id: task.createdBy, closer: [{ taskId: task.id, groupId: task.group.id }] }
		const taskAccomplices = task.accomplices.map((it) => ({ id: it, accomplice: [{ taskId: task.id, groupId: task.group.id }] }))
		const allTaskUsers = [...taskAuditors, taskCreator, taskResponsible, taskClosedBy, ...taskAccomplices]
		task.allUsers = allTaskUsers.map((it) => it.id)
		let formattedAllTaskUsers = []
		allTaskUsers.forEach((atu) => {
			const foundIndex = formattedAllTaskUsers.findIndex((fatu) => fatu.id === atu.id)
			if (foundIndex === -1) {
				formattedAllTaskUsers.push({ auditor: [], creator: [], responsible: [], closer: [], accomplice: [], groups: [task.group.id], ...atu })
			} else {
				atu.auditor && formattedAllTaskUsers[foundIndex].auditor.push(...atu.auditor)
				atu.creator && formattedAllTaskUsers[foundIndex].creator.push(...atu.creator)
				atu.responsible && formattedAllTaskUsers[foundIndex].responsible.push(...atu.responsible)
				atu.closer && formattedAllTaskUsers[foundIndex].closer.push(...atu.closer)
				atu.accomplice && formattedAllTaskUsers[foundIndex].accomplice.push(...atu.accomplice)
			}
		})
		formattedAllTaskUsers.forEach((ftuser) => {
			const memberIndexFound = members.findIndex((member) => member.id === ftuser.id)
			!groups[groupIndex].members.find((gmim) => gmim == ftuser.id) && groups[groupIndex].members.push(ftuser.id)
			if (memberIndexFound === -1) {
				members.push(ftuser)
			} else {
				members[memberIndexFound].auditor.push(...ftuser.auditor)
				members[memberIndexFound].creator.push(...ftuser.creator)
				members[memberIndexFound].responsible.push(...ftuser.responsible)
				members[memberIndexFound].closer.push(...ftuser.closer)
				members[memberIndexFound].accomplice.push(...ftuser.accomplice)
				!members[memberIndexFound].groups.find((g) => ftuser.groups.find((ftg) => ftg == g)) &&
					members[memberIndexFound].groups.push(...ftuser.groups)
			}
		})
	})

	const users = await BitrixService.getBitrixUsersByIds(
		members.map((it) => it.id),
		bitrixAccess
	)
	members = members
		.map((m) => ({ ...m, ...formatSimpleUser(users.find((u) => u.ID === m.id)) }))
		.filter((mf) => mf.id && mf.name.trim() !== 'Não atribuído')

	allTasks = allTasks
		.map((task) => ({
			...formatTask(task),
			creator: getNameAndIdFromUser(members.find((m) => m.id == task.createdBy)),
			responsible: getNameAndIdFromUser(members.find((m) => m.id == task.responsible.id)),
			closer: getNameAndIdFromUser(members.find((m) => m.id == task.closedBy)),
			auditors: task.auditors.map((ta) => getNameAndIdFromUser(members.find((m) => m.id == ta))),
			accomplices: task.accomplices.map((ta) => getNameAndIdFromUser(members.find((m) => m.id == ta)))
		}))
		.filter((t) => (!!t.createdDate && !!t.closedDate ? !!t.responsible.id : true))

	allTasks.forEach((task) => {
		task.tags.forEach((taskTag) => {
			const foundIndex = tags.findIndex((t) => t.id === taskTag.id)
			if (foundIndex === -1) {
				tags.push({ id: taskTag.id, name: taskTag.title, value: 1, tasks: [task.id] })
			} else {
				tags[foundIndex].value += 1
				tags[foundIndex].tasks.push(task.id)
			}
		})
	})
	tags = tags.map((ntd) => ({ ...ntd, name: `${ntd.name} (${ntd.value})` })).sort((a, b) => a.name.localeCompare(b.name))
	//sort
	groups = groups.sort((a, b) => a.name.localeCompare(b.name))
	members = members.sort((a, b) => a.name.localeCompare(b.name))
	tags = tags.sort((a, b) => a.name.localeCompare(b.name))

	return { groups, members, tags, allTasks }
}

module.exports = {
	getAllTasksAndGroupsWithMembers
}
