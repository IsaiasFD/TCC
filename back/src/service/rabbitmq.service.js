const amqp = require('amqplib/callback_api')
const config = require('../config')

const RABBITMQ_USER = config.RABBITMQ.USER
const RABBITMQ_PASSWORD = config.RABBITMQ.PASSWORD
const RABBITMQ_HOST = config.RABBITMQ.HOST
const RABBITMQ_PORT = config.RABBITMQ.PORT
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`

const sendToQueue = async (queue, message) => {
	amqp.connect(RABBITMQ_URL, (error0, connection) => {
		if (error0) {
			throw error0
		}
		connection.createChannel((error1, channel) => {
			if (error1) {
				throw error1
			}

			channel.assertQueue(queue, {
				durable: false
			})

			channel.sendToQueue(queue, Buffer.from(message))
			console.debug(`Sent message to queue ${queue}: ${message}`)

			setTimeout(() => {
				connection.close()
			}, 500)
		})
	})
}

const consumeQueue = async (queue, callback) => {
	amqp.connect(RABBITMQ_URL, (error0, connection) => {
		if (error0) {
			throw error0
		}
		connection.createChannel((error1, channel) => {
			if (error1) {
				throw error1
			}

			channel.assertQueue(queue, {
				durable: false
			})

			console.debug(`Waiting for messages in ${queue}. To exit press CTRL+C`)

			channel.consume(queue, (msg) => {
				if (msg !== null) {
					console.debug(`Received message from queue ${queue}: ${msg.content.toString()}`)
					callback(msg.content.toString())
					channel.ack(msg)
				}
			})
		})
	})
}

module.exports = { sendToQueue, consumeQueue }
