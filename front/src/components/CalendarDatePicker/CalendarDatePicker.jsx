import React, { useState } from 'react'
import { DEFAULT_DASHBOARD_DATE_FILTERS } from 'storage/redux/reducer/main.reducer'
import DatePicker from 'components/CalendarDatePicker/components/DatePicker/DatePicker'
import { CalendarMonth } from '@mui/icons-material'
import moment from 'moment-timezone'
import { Typography, Modal, IconButton, Card } from '@mui/material'

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	bgcolor: 'background.paper',
	boxShadow: 24,
	p: 10,
	height: '50%',
	width: '30.2%',
	padding: '20px'
}

const CalendarDatePicker = ({ onApplyDate }) => {
	const [date, setDate] = useState(DEFAULT_DASHBOARD_DATE_FILTERS)
	const [isOpenDatePicker, setIsOpenDatePicker] = useState(false)

	const toggleIsOpenDatePicker = () => {
		setIsOpenDatePicker(!isOpenDatePicker)
	}

	const onChangeDatePicker = (fromDate, toDate) => {
		const newDate = {
			fromDate: moment(fromDate).format('YYYY-MM-DD'),
			toDate: moment(toDate).format('YYYY-MM-DD')
		}
		setDate(newDate)
		onApplyDate(newDate)
		setIsOpenDatePicker(false)
	}

	const handleClose = () => {
		setIsOpenDatePicker(false)
	}

	return (
		<>
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<IconButton onClick={toggleIsOpenDatePicker}>
					<CalendarMonth style={{ color: '#1976D2' }} />
				</IconButton>
				<Typography sx={{ fontSize: '1em', marginTop: '2px', opacity: 0.7 }}>
					{moment(date.fromDate).format('DD/MM/YYYY')} - {moment(date.toDate).format('DD/MM/YYYY')}
				</Typography>
			</div>
			<Modal open={isOpenDatePicker} onClose={handleClose}>
				<Card sx={style}>
					<DatePicker
						onChange={onChangeDatePicker}
						selectionValue={{
							startDate: moment(date.fromDate, 'YYYY-MM-DD').toDate(),
							endDate: moment(date.toDate, 'YYYY-MM-DD').toDate(),
							key: 'selection'
						}}
					/>
				</Card>
			</Modal>
		</>
	)
}

export default CalendarDatePicker
