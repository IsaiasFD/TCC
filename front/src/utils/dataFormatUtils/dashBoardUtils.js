import lodash from 'lodash'
import moment from 'moment-timezone'

const formatToSeries = (formattedData, labels, orderBy) => {
	if (orderBy) {
		formattedData = lodash.orderBy(formattedData, 'value', orderBy)
	}
	const seriesDataObject = {
		series: formattedData.map((it) => ({ name: it?.key?.name, data: [it?.value] })),
		labels
	}
	return seriesDataObject
}

const formatToSeriesPie = (formattedData) => {
	const seriesDataObject = {
		series: formattedData.map((it) => it.value),
		labels: formattedData.map((it) => it.key.name)
	}
	return seriesDataObject
}

function formatToSeries2(formattedData) {
	formattedData.sort((a, b) => {
		return new Date(a.key.createdDate) - new Date(b.key.createdDate)
	})
	let labels = new Set()
	const seriesDataObject = []
	formattedData.forEach((item) => {
		const name = item.key.name
		const createdDate = new Date(item.key.createdDate).getTime()
		const value = item.value

		let seriesEntry = seriesDataObject.findIndex((entry) => entry.name === name)
		labels.add(createdDate)
		if (seriesEntry != -1) {
			seriesDataObject[seriesEntry].data.push(value)
		} else {
			seriesDataObject.push({
				name: name,
				data: [value]
			})
		}
	})
	let labelsArray = Array.from(labels).map((label) => moment(label).format('MMM/YYYY'))
	return { series: seriesDataObject, labels: labelsArray }
}

const buildOverviewMetrics = (allTasks) => {
	let totalTasks = allTasks.length
	let openTasks = 0
	let closedTasks = 0
	let highPriority = 0
	let normalPriority = 0
	let hotfixTasks = 0
	allTasks.forEach((task) => {
		if (task.title.toUpperCase().includes('[HOTFIX]')) {
			hotfixTasks += 1
		}
		if (task.priority === '1') {
			normalPriority += 1
		} else if (task.priority === '2') {
			highPriority += 1
		}
		if (task.closedDate) {
			closedTasks += 1
		} else {
			openTasks += 1
		}
	})

	const finalData = { totalTasks, openTasks, closedTasks, highPriority, normalPriority, hotfixTasks }

	return finalData
}

const buildGraphsMetrics = (allTasks) => {
	let auditors = []
	let creators = []
	let responsibles = []
	let closers = []
	let accomplices = []
	let tagsByTime = []
	let tags = []
	let averageCompletionTime = []
	let averageCompletionTimeHistory = []
	let priorityTasks = []
	let taskByType = []

	allTasks.forEach((task) => {
		//Usuários dentro do grupo
		const taskAuditors = task.auditors.filter((ta) => ta.id)
		const taskAccomplices = task.accomplices.filter((tac) => tac.id)
		const taskCreator = task.creator
		const taskResponsible = task.responsible
		const taskCloser = task.closer
		auditors = auditors.concat(taskAuditors)
		accomplices = accomplices.concat(taskAccomplices)
		if (taskCreator.id) {
			creators = taskCreator && creators.concat(taskCreator)
		}
		if (taskResponsible.id) {
			responsibles = taskResponsible && responsibles.concat(taskResponsible)
		}
		if (taskCloser.id) {
			closers = taskCloser && closers.concat(taskCloser)
		}
		//extrair tags por tempo
		task.tags.forEach((tt) => {
			const foundIndex = tagsByTime.findIndex((t) => {
				const currentDate = new Date(task.createdDate)
				const existingDate = new Date(t.key.createdDate)
				return (
					t.key.id === tt.id &&
					currentDate.getMonth() === existingDate.getMonth() &&
					currentDate.getFullYear() === existingDate.getFullYear()
				)
			})
			if (foundIndex === -1) {
				tagsByTime.push({
					key: {
						id: tt.id,
						name: tt.title,
						createdDate: new Date(new Date(task.createdDate).getFullYear(), new Date(task.createdDate).getMonth(), 1)
					},
					value: 1
				})
			} else {
				tagsByTime[foundIndex].value += 1
			}
		})

		//extrair tags
		task.tags.forEach((tt) => {
			const foundIndex = tags.findIndex((t) => t.key.id === tt.id)
			if (foundIndex === -1) {
				tags.push({ key: { id: tt.id, name: tt.title }, value: 1 })
			} else {
				tags[foundIndex].value += 1
			}
		})

		if (task.createdDate && task.closedDate && task.responsible.id) {
			const created = moment(task.createdDate)
			const closed = moment(task.closedDate)
			//tempo até fechar
			averageCompletionTime.push({
				// taskId: task.id,
				responsibleId: task.responsible.id,
				responsibleName: task.responsible.name,
				tags: task.tags,
				// completionTime: moment(closed).diff(created),
				completionTimeHours: moment(closed).diff(created, 'hours', true),
				createdDate: task.createdDate,
				closedDate: task.closedDate
			})
		}
		if (task.createdDate && task.closedDate && task.history && task.history.result && task.history.result.list) {
			const created = moment(task.createdDate, ['YYYY-MM-DDTHH:mm:ssZ', 'DD/MM/YYYY HH:mm:ss'])
			const closed = moment(task.closedDate, ['YYYY-MM-DDTHH:mm:ssZ', 'DD/MM/YYYY HH:mm:ss'])
			let responsibleTimes = {}
			let currentResponsible = null
			let currentStartTime = created

			const sortedHistory = task.history.result.list.sort((a, b) =>
				moment(a.createdDate, ['YYYY-MM-DDTHH:mm:ssZ', 'DD/MM/YYYY HH:mm:ss']).diff(
					moment(b.createdDate, ['YYYY-MM-DDTHH:mm:ssZ', 'DD/MM/YYYY HH:mm:ss'])
				)
			)

			sortedHistory.forEach((event) => {
				if (event.field === 'RESPONSIBLE_ID') {
					const eventTime = moment(event.createdDate, ['YYYY-MM-DDTHH:mm:ssZ', 'DD/MM/YYYY HH:mm:ss'])
					if (currentResponsible) {
						const duration = eventTime.diff(currentStartTime, 'hours', true)
						if (!responsibleTimes[currentResponsible.id]) {
							responsibleTimes[currentResponsible.id] = { hours: 0, name: `${currentResponsible.name} ${currentResponsible.lastName}` }
						}
						responsibleTimes[currentResponsible.id].hours += duration
					}
					currentResponsible = event.user
					currentStartTime = eventTime
				}
			})

			if (currentResponsible) {
				let closedFormated = moment.parseZone(closed).format('YYYY-MM-DDTHH:mm:ss')
				let currentStartTimeFormated = moment.parseZone(currentStartTime).format('YYYY-MM-DDTHH:mm:ss')
				const duration = moment(closedFormated).diff(moment(currentStartTimeFormated), 'hours')

				if (!responsibleTimes[currentResponsible.id]) {
					responsibleTimes[currentResponsible.id] = { hours: 0, name: `${currentResponsible.name} ${currentResponsible.lastName}` }
				}
				responsibleTimes[currentResponsible.id].hours += duration
			}

			for (const [responsibleId, data] of Object.entries(responsibleTimes)) {
				averageCompletionTimeHistory.push({
					responsibleId: responsibleId,
					responsibleName: data.name,
					tags: task.tags,
					completionTimeHours: data.hours,
					createdDate: task.createdDate,
					closedDate: task.closedDate
				})
			}
		}

		// Prioridade
		for (let i = 1; i <= 5; i++) {
			let priorityName = 'PRIORIDADE ' + i
			if (task.title.toUpperCase().includes(priorityName) || task.title.toUpperCase().includes('HOTFIX')) {
				if (task.title.toUpperCase().includes('HOTFIX')) {
					priorityName = 'HOTFIX'
				}
				const taskDate = new Date(task.createdDate)
				const taskYear = taskDate.getFullYear()
				const taskMonth = taskDate.getMonth()

				const exists = priorityTasks.some(
					(task) =>
						task.key.name === priorityName &&
						task.key.createdDate.getFullYear() === taskYear &&
						task.key.createdDate.getMonth() === taskMonth
				)

				if (!exists) {
					priorityTasks.push({
						key: {
							name: priorityName,
							createdDate: new Date(taskYear, taskMonth, 1)
						},
						value: 1
					})
				} else {
					const index = priorityTasks.findIndex(
						(task) =>
							task.key.name === priorityName &&
							task.key.createdDate.getFullYear() === taskYear &&
							task.key.createdDate.getMonth() === taskMonth
					)
					priorityTasks[index].value += 1
				}
				break
			}
		}

		// Tipo de tarefa
		let taskType = null
		if (task.type.isCorrection) {
			taskType = 'CORREÇÃO'
		} else if (task.type.isEvolution) {
			taskType = 'EVOLUÇÃO'
		} else if (task.type.isAdaptation) {
			taskType = 'ADAPTAÇÃO'
		}

		if (taskType) {
			const taskDate = new Date(task.createdDate)
			const taskYear = taskDate.getFullYear()
			const taskMonth = taskDate.getMonth()

			const exists = taskByType.some(
				(task) =>
					task.key.name === taskType && task.key.createdDate.getFullYear() === taskYear && task.key.createdDate.getMonth() === taskMonth
			)

			if (!exists) {
				taskByType.push({
					key: {
						name: taskType,
						createdDate: new Date(taskYear, taskMonth, 1)
					},
					value: 1
				})
			} else {
				const index = taskByType.findIndex(
					(task) =>
						task.key.name === taskType && task.key.createdDate.getFullYear() === taskYear && task.key.createdDate.getMonth() === taskMonth
				)
				taskByType[index].value += 1
			}
		}
	})

	const users = lodash.uniqBy([...auditors, ...creators, ...responsibles, ...closers, ...accomplices], 'id')
	const auditorsFormatted = Object.entries(lodash.countBy(auditors, 'id'))
		.map(([key, value]) => ({ key, value }))
		.map((obj) => ({ ...obj, key: users.find((user) => user.id === obj.key) }))
	const creatorsFormatted = Object.entries(lodash.countBy(creators, 'id'))
		.map(([key, value]) => ({ key, value }))
		.map((obj) => ({ ...obj, key: users.find((user) => user.id === obj.key) }))
	const responsiblesFormatted = Object.entries(lodash.countBy(responsibles, 'id'))
		.map(([key, value]) => ({ key, value }))
		.map((obj) => ({ ...obj, key: users.find((user) => user.id === obj.key) }))
	const closersFormatted = Object.entries(lodash.countBy(closers, 'id'))
		.map(([key, value]) => ({ key, value }))
		.map((obj) => ({ ...obj, key: users.find((user) => user.id === obj.key) }))
	const accomplicesFormatted = Object.entries(lodash.countBy(accomplices, 'id'))
		.map(([key, value]) => ({ key, value }))
		.map((obj) => ({ ...obj, key: users.find((user) => user.id === obj.key) }))

	const groupedMembersAvg = lodash.groupBy(averageCompletionTime, 'responsibleId')
	const avgMemberTimeByMonth = []
	Object.values(groupedMembersAvg).forEach((members) => {
		members.forEach((g) => {
			const currentDate = new Date(g.closedDate)
			const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
			const foundIndex = avgMemberTimeByMonth.findIndex((t) => {
				const existingDate = new Date(t.key.createdDate)
				return (
					t.key.id === g.responsibleId &&
					currentDate.getMonth() === existingDate.getMonth() &&
					currentDate.getFullYear() === existingDate.getFullYear()
				)
			})

			if (foundIndex === -1) {
				avgMemberTimeByMonth.push({
					key: {
						id: g.responsibleId,
						name: g.responsibleName,
						createdDate: monthStart
					},
					value: Math.round(g.completionTimeHours * 10) / 10,
					count: 1
				})
			} else {
				const existingEntry = avgMemberTimeByMonth[foundIndex]
				const totalHours = existingEntry.value * existingEntry.count + g.completionTimeHours
				existingEntry.count += 1
				existingEntry.value = Math.round((totalHours / existingEntry.count) * 10) / 10
			}
		})
	})
	const groupedMembersAvgHistory = lodash.groupBy(averageCompletionTimeHistory, 'responsibleId')
	const avgMemberTimeByMonthHistory = []
	Object.values(groupedMembersAvgHistory).forEach((members) => {
		members.forEach((g) => {
			const currentDate = new Date(g.closedDate)
			const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
			const foundIndex = avgMemberTimeByMonthHistory.findIndex((t) => {
				const existingDate = new Date(t.key.createdDate)
				return (
					t.key.id === g.responsibleId &&
					currentDate.getMonth() === existingDate.getMonth() &&
					currentDate.getFullYear() === existingDate.getFullYear()
				)
			})

			if (foundIndex === -1) {
				avgMemberTimeByMonthHistory.push({
					key: {
						id: g.responsibleId,
						name: g.responsibleName,
						createdDate: monthStart
					},
					value: Math.round(g.completionTimeHours * 10) / 10,
					count: 1
				})
			} else {
				const existingEntry = avgMemberTimeByMonthHistory[foundIndex]
				const totalHours = existingEntry.value * existingEntry.count + g.completionTimeHours
				existingEntry.count += 1
				existingEntry.value = Math.round((totalHours / existingEntry.count) * 10) / 10
			}
		})
	})
	const tagsCompletion = []
	averageCompletionTime.forEach((item) => {
		item.tags.forEach((it) => {
			tagsCompletion.push({
				id: it.id,
				name: it.title,
				completionTimeHours: item.completionTimeHours,
				createdDate: item.createdDate,
				closedDate: item.closedDate
			})
		})
	})
	const groupedTagsAvg = lodash.groupBy(tagsCompletion, 'id')
	const avgTagTimeByMonth = []
	Object.values(groupedTagsAvg).forEach((tags) => {
		tags.forEach((g) => {
			const currentDate = new Date(g.closedDate)
			const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
			const foundIndex = avgTagTimeByMonth.findIndex((t) => {
				const existingDate = new Date(t.key.createdDate)
				return (
					t.key.id === g.id &&
					currentDate.getMonth() === existingDate.getMonth() &&
					currentDate.getFullYear() === existingDate.getFullYear()
				)
			})
			if (foundIndex === -1) {
				avgTagTimeByMonth.push({
					key: {
						id: g.id,
						name: g.name,
						createdDate: monthStart
					},
					value: Math.round(g.completionTimeHours * 10) / 10,
					count: 1
				})
			} else {
				const existingEntry = avgTagTimeByMonth[foundIndex]
				const totalHours = existingEntry.value * existingEntry.count + g.completionTimeHours
				existingEntry.count += 1
				existingEntry.value = Math.round((totalHours / existingEntry.count) * 10) / 10
			}
		})
	})

	const finalData = {
		usersGraphData: {
			auditors: formatToSeries(auditorsFormatted, ['Observadores'], 'desc'),
			creators: formatToSeries(creatorsFormatted, ['Criadores'], 'desc'),
			responsibles: formatToSeries(responsiblesFormatted, ['Responsáveis'], 'desc'),
			closers: formatToSeries(closersFormatted, ['Fechadores'], 'desc'),
			accomplices: formatToSeries(accomplicesFormatted, ['Participantes'], 'desc')
		},
		tagsGraphData: {
			popular: formatToSeries2(tagsByTime, 'desc')
		},
		completionGraphData: {
			averagePersonTime: formatToSeries2(avgMemberTimeByMonth),
			averageTagTime: formatToSeries2(avgTagTimeByMonth),
			averagePersonTimeHistory: formatToSeries2(avgMemberTimeByMonthHistory)
		},
		priorityGraphData: {
			priorityTasks: formatToSeries2(priorityTasks)
		},
		typeTaskGraphData: {
			taskByType: formatToSeries2(taskByType)
		},
		tagsGraphPie: {
			tags: formatToSeriesPie(tags)
		}
	}

	return finalData
}

export { buildOverviewMetrics, buildGraphsMetrics }
