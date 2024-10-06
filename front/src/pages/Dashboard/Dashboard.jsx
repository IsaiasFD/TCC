import React, { useState, useEffect, memo } from 'react'
import api from 'service/service'
import SideMenu from 'components/SideMenu/SideMenu'
import FiltersDashboard from './components/FiltersDashboard/FiltersDashboard'
import { connect } from 'react-redux'
import { Unstable_Grid2 as Grid } from '@mui/material'
import { addOnFiltersAction } from 'storage/redux/actions/dashboard.actions'
import AccountInfo from 'pages/AccountInfo/AccountInfo'
import OverviewModule from './modules/OverviewModule/OverviewModule'
import GraphsModule from './modules/GraphsModule/GraphsModule'
import CalendarDatePicker from 'components/CalendarDatePicker/CalendarDatePicker'
import { LoadingIcon } from 'utils/SystemIcons/SystemIcons'

const ORIGINAL_FILTER_DATA = {
	allTasks: [],
	groups: [],
	members: [],
	tags: [],
	date: { fromDate: null, toDate: null }
}

const getGroups = async () => {
	try {
		const res = await api.get('dashboard/get-groups')
		return res.data
	} catch (error) {
		console.error('Error fetching groups:', error)
		return []
	}
}

const Dashboard = ({ addOnFiltersDispatch, selectedMenuItemRedux, fromDate, toDate }) => {
	const [originalFilterData, setOriginalFilterData] = useState(null)
	const [tasksFiltered, setTasksFiltered] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [date, setDate] = useState({ fromDate, toDate })

	const load = async () => {
		setIsLoading(true)
		const groups = await getGroups()
		setOriginalFilterData({ ...ORIGINAL_FILTER_DATA, groups: groups })
		setIsLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	const handleOnApplyFilters = (newTasksFiltered) => {
		setTasksFiltered(newTasksFiltered)
	}

	const handleOnApplyDate = (newDate) => {
		setDate(newDate)
		addOnFiltersDispatch(newDate)
	}

	return (
		<Grid container spacing={0} className='page'>
			<Grid item xs={2} style={{ position: 'relative' }}>
				<SideMenu />
			</Grid>
			<Grid item xs={10}>
				<div
					style={{
						paddingLeft: '1.3em',
						backgroundColor: '#ffffff',
						borderRadius: '0px 0px 10px 10px',
						boxShadow: 'inset 0px 0px 3px 0px rgba(0,0,0,0.3)',
						height: '4em',
						display: selectedMenuItemRedux === 'account' ? 'none' : 'flex'
					}}
				>
					<CalendarDatePicker onApplyDate={handleOnApplyDate} disabled={isLoading} controlledDate={date} />
					<div style={{ marginLeft: '1.5em', display: 'flex', alignItems: 'center' }}>
						{isLoading ? (
							<LoadingIcon thickness={2} style={{ color: '#1976D2', width: '25px', height: '25px', marginLeft: '2em' }} />
						) : (
							<FiltersDashboard data={originalFilterData} onApplyFilters={handleOnApplyFilters} />
						)}
					</div>
				</div>
				{['overview', 'graphs'].includes(selectedMenuItemRedux) && (
					<>
						{selectedMenuItemRedux === 'overview' && <OverviewModule data={tasksFiltered} loading={isLoading} />}
						{selectedMenuItemRedux === 'graphs' && <GraphsModule data={tasksFiltered} loading={isLoading} />}
					</>
				)}
				{selectedMenuItemRedux === 'account' && <AccountInfo />}
			</Grid>
		</Grid>
	)
}

const mapDispatchToProps = (dispatch) => ({
	addOnFiltersDispatch: (filters) => dispatch(addOnFiltersAction(filters))
})

const mapStateToProps = ({ store }) => ({
	selectedMenuItemRedux: store?.dashboard?.selectedMenuItem,
	fromDate: store?.dashboard?.filters?.fromDate,
	toDate: store?.dashboard?.filters?.toDate
})

export default connect(mapStateToProps, mapDispatchToProps)(memo(Dashboard))
