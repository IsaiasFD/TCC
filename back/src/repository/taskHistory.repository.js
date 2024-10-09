const { pool } = require('../db')

const createTaskHistory = async (task_id, data) => {
	const query = `
        INSERT INTO task_history (task_id, data)
        VALUES ($1, $2)
        RETURNING *;
    `
	const values = [task_id, data]
	const res = await pool.query(query, values)
	return res.rows[0]
}

const getTaskHistoryById = async (id) => {
	const query = `
        SELECT * FROM task_history
        WHERE id = $1;
    `
	const values = [id]
	const res = await pool.query(query, values)
	return res.rows[0]
}

const updateTaskHistory = async (task_id, data) => {
	const query = `
        UPDATE task_history
        SET data = $1, updated_at = CURRENT_TIMESTAMP
        WHERE task_id = $2
        RETURNING *;
    `
	const values = [data, task_id]
	const res = await pool.query(query, values)
	return res.rows[0]
}

const deleteTaskHistory = async (id) => {
	const query = `
        DELETE FROM task_history
        WHERE id = $1
        RETURNING *;
    `
	const values = [id]
	const res = await pool.query(query, values)
	return res.rows[0]
}

const getTaskHistoriesByTaskIds = async (taskIds) => {
	const query = `
        SELECT * FROM task_history
        WHERE task_id IN (${taskIds});
    `
	const res = await pool.query(query)
	return res.rows
}

module.exports = {
	createTaskHistory,
	getTaskHistoryById,
	updateTaskHistory,
	deleteTaskHistory,
	getTaskHistoriesByTaskIds
}
