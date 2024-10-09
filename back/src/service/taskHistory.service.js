const taskHistoryRepository = require('../repository/taskHistory.repository')
const rabbitmqService = require('./rabbitmq.service')

const createTaskHistory = async (task_id, data) => {
	return await taskHistoryRepository.createTaskHistory(task_id, data)
}

const getTaskHistoryById = async (id) => {
	return await taskHistoryRepository.getTaskHistoryById(id)
}

const updateTaskHistory = async (task_id, data) => {
	return await taskHistoryRepository.updateTaskHistory(task_id, data)
}

const deleteTaskHistory = async (id) => {
	return await taskHistoryRepository.deleteTaskHistory(id)
}

const getTaskHistoriesByTaskIds = async (taskIds) => {
	const res = await taskHistoryRepository.getTaskHistoriesByTaskIds(taskIds)
	const map = {}
	res.forEach((row) => (map[row.task_id] = row.data))
	return map
}

const insertHistory = async (tasks, userId) => {
	const tasksIds = tasks.map((t) => t.id)
	const taskHistories = await getTaskHistoriesByTaskIds(tasksIds)

	for (const task of tasks) {
		const history = taskHistories[task.id]
		task.history = history

		if (!history) {
			const message = JSON.stringify({ taskId: task.id, userId: userId })
			rabbitmqService.sendToQueue('task_queue', message)
		}
	}
}

module.exports = {
	createTaskHistory,
	getTaskHistoryById,
	updateTaskHistory,
	deleteTaskHistory,
	getTaskHistoriesByTaskIds,
	insertHistory
}
