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
const getFilterOptions = (data, filters) => {
	//Verifica a partir das tags selecionados quais membros serão mostrados no select
	let tasksFiltered = data.allTasks
	let membersOptions = data.members
	let groupsOptions = data.groups
	let tagsOptions = data.tags
	// Adiciona a verificação para filtrar tagsOptions com base nos grupos selecionados
	if (filters.groups.length > 0) {
		const selectedGroupIds = filters.groups.map((g) => g.id)
		tagsOptions = tagsOptions.filter((tag) =>
			tag.tasks.some((taskId) => data.allTasks.some((task) => task.id === taskId && selectedGroupIds.includes(task.group.id)))
		)
	}

	if (
		tasksFiltered?.length > 1 &&
		(filters.members.length > 0 ||
			filters.groups.length > 0 ||
			filters.tags.length > 0 ||
			filters?.showOnlyHotfixData ||
			filters?.showOnlyHighPriorityData ||
			filters?.priority.length > 0)
	) {
		//filtra pelos membros, grupos e tags
		const membersIdsInFilter = filters?.members?.map((m) => m.id)
		const priorityNames = filters?.priority?.map((p) => p.name.toUpperCase())
		tasksFiltered = tasksFiltered.filter((task) => {
			let cond1 = true
			let cond2 = true
			let cond3 = true
			let cond4 = true
			let cond5 = true
			let cond6 = true

			if (membersIdsInFilter.length > 0) {
				cond1 = task.allUsers.some((i) => membersIdsInFilter.includes(i))
			}
			if (filters.groups.length > 0) {
				cond2 = filters.groups.map((g) => g.id).includes(task.group.id)
			}
			if (filters.tags.length > 0) {
				cond3 = task.tags.some((taskTags) => filters.tags.some((filterTag) => filterTag.id === taskTags.id))
			}
			if (filters?.showOnlyHotfixData) {
				cond4 = task.title.toUpperCase().includes('[HOTFIX]')
			}
			if (filters?.showOnlyHighPriorityData) {
				cond5 = task.priority === '2'
			}
			if (filters?.priority.length > 0) {
				cond6 = priorityNames.some((priorityName) => task.title.toUpperCase().includes(priorityName))
			}

			return cond1 && cond2 && cond3 && cond4 && cond5 && cond6
		})
		//filtra pra mostrar somente dados dos itens selecionados nos filtros
		if (filters.showOnlySelectedMemberData) {
			tasksFiltered = tasksFiltered.map((fd) => {
				return {
					...fd,
					accomplices: fd.accomplices.filter((a) => membersIdsInFilter.includes(a.id)),
					auditors: fd.auditors.filter((au) => membersIdsInFilter.includes(au.id)),
					closer: membersIdsInFilter.includes(fd.closer.id) ? fd.closer : [],
					creator: membersIdsInFilter.includes(fd.creator.id) ? fd.creator : [],
					responsible: membersIdsInFilter.includes(fd.responsible.id) ? fd.responsible : []
				}
			})
		}

		if (filters?.tags?.length > 0) {
			tasksFiltered.forEach((it) => {
				it.tags = it.tags.filter((tag) => filters.tags.map((t) => t.id).includes(tag.id))
			})
		}
	}

	const filterData = {
		tasks: tasksFiltered,
		options: {
			members: membersOptions,
			tags: tagsOptions
		}
	}
	return filterData
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
