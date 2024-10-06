import React, { useState, useEffect, memo } from 'react'
import { connect } from 'react-redux'
import { Button, Card, Modal, Grid, Checkbox, Typography } from '@mui/material'
//system libs
import SelectTag from 'components/SelectTag/SelectTag'
import { addOnFiltersAction } from 'storage/redux/actions/dashboard.actions'
import { DEFAULT_DASHBOARD_FILTERS } from 'storage/redux/reducer/main.reducer'
import MembersFiltersCheckList from './components/MembersFiltersCheckList/MembersFiltersCheckList'
import { set } from 'date-fns'
import api from 'service/service'

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	bgcolor: 'background.paper',
	boxShadow: 24,
	p: 5,
	width: '50%'
}

const priorityOptions = [
	{ id: 1, name: 'PRIORIDADE 1' },
	{ id: 2, name: 'PRIORIDADE 2' },
	{ id: 3, name: 'PRIORIDADE 3' },
	{ id: 4, name: 'PRIORIDADE 4' },
	{ id: 5, name: 'PRIORIDADE 5' }
]

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

let firstLoad = true

const FiltersDashboard = ({ filtersDependantRedux, addOnFiltersDispatch, data, onApplyFilters, buttonStyle, fromDate, toDate }) => {
	const [filters, setFilters] = useState(filtersDependantRedux)
	const [filterOptions, setFilterOptions] = useState(data)
	const [open, setOpen] = useState(true)

	const loadTasks = async () => {
		try {
			if (filters.groups.length === 0) {
				return { ...filterOptions, allTasks: [], members: [], tags: [] }
			}
			const selectedGroups = filters.groups.map((g) => g.id)
			const encodedGroups = encodeURIComponent(selectedGroups.join(','))
			const res = await api.get(`/dashboard/get-all-tasks-and-groups-with-members/${fromDate}/${toDate}/${encodedGroups}`)
			const fOptions = { ...filterOptions, allTasks: res?.data?.allTasks, members: res?.data?.members, tags: res?.data?.tags }
			return fOptions
		} catch (error) {
			console.error('Error loading data:', error)
		}
	}

	useEffect(() => {
		if (!open) {
			setFilters(filtersDependantRedux)
			handleChangeFilter(data, filtersDependantRedux)
		}
	}, [open])

	useEffect(() => {
		setFilters(filtersDependantRedux)
		applyFilters(filtersDependantRedux, firstLoad)
		firstLoad = false
	}, [filtersDependantRedux])

	useEffect(() => {
		loadTasks().then((res) => {
			handleChangeFilter(res, filters)
		})
	}, [filters.groups])

	useEffect(() => {
		loadTasks().then((res) => {
			const tasks = handleChangeFilter(res, filters)
			onApplyFilters(tasks)
		})
	}, [fromDate, toDate])

	const onChangeGroups = (changedGroups) => {
		const newFilters = { ...filters, groups: changedGroups }
		setFilters(newFilters)
	}

	const onChangeMembers = (changedMembers) => {
		const newFilters = { ...filters, members: changedMembers }
		if (changedMembers.length === 0) {
			newFilters.showOnlySelectedMemberData = false
		}
		setFilters(newFilters)
		handleChangeSelect(newFilters, 'members')
	}
	const onChangeTags = (changedTags) => {
		const newFilters = { ...filters, tags: changedTags }
		setFilters(newFilters)
		handleChangeSelect(newFilters, 'tags')
	}

	const onChangePriority = (changedPriority) => {
		const newFilters = { ...filters, priority: changedPriority }
		setFilters(newFilters)
		handleChangeSelect(newFilters, 'priority')
	}

	const handleOpen = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
	}

	const applyFilters = (filters, closeFilter) => {
		setOpen(!!closeFilter)
		addOnFiltersDispatch({ dependant: filters })
		if (onApplyFilters) {
			const tasks = handleChangeFilter(filterOptions, filters)
			onApplyFilters(tasks)
		}
	}

	const resetFilters = () => {
		setFilters(DEFAULT_DASHBOARD_FILTERS)
		const tasks = handleChangeFilter(data, DEFAULT_DASHBOARD_FILTERS)
	}

	const handleChangeShowOnlyData = (event, type) => {
		let newFilters = { ...filters }
		if (type === 'members') {
			newFilters.showOnlySelectedMemberData = event.target.checked
		} else if (type === 'hotfix') {
			newFilters.showOnlyHotfixData = event.target.checked
		} else if (type === 'highPriority') {
			newFilters.showOnlyHighPriorityData = event.target.checked
		}
		setFilters(newFilters)
		handleChangeFilter(data, newFilters)
	}

	const handleChangeSelect = (newFilters) => {
		handleChangeFilter(filterOptions, newFilters)
	}

	const handleChangeFilter = (filterData, newFilters) => {
		const { options, tasks } = getFilterOptions(filterData, newFilters)
		setFilterOptions({ ...filterData, members: options.members, tags: options.tags })
		return tasks
	}

	return (
		<>
			<Button onClick={handleOpen} style={buttonStyle}>
				+Filtros
			</Button>
			<Modal open={open} onClose={handleClose}>
				<Card sx={style} style={{ overflow: 'auto' }}>
					<Grid container spacing={0}>
						<Grid item xs={6}>
							<SelectTag label='Grupos' options={filterOptions.groups} onChange={onChangeGroups} selected={filters.groups} />
							<SelectTag label='Membros' options={filterOptions.members} onChange={onChangeMembers} selected={filters.members} />
							<SelectTag label='Tags' options={filterOptions.tags} onChange={onChangeTags} selected={filters.tags} />
							<SelectTag label='Prioridades' options={priorityOptions} onChange={onChangePriority} selected={filters.priority} />
						</Grid>
						<Grid item xs={6} style={{ paddingLeft: '5em', maxHeight: '15em', overflow: 'auto' }}>
							<MembersFiltersCheckList data={filters.members} />
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox
								onChange={(e) => handleChangeShowOnlyData(e, 'members')}
								checked={filters.showOnlySelectedMemberData}
								disabled={filters.members.length === 0}
							/>
							<Typography>Mostrar apenas dados de membros selecionados</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox onChange={(e) => handleChangeShowOnlyData(e, 'hotfix')} checked={filters.showOnlyHotfixData} />
							<Typography>Mostrar apenas dados de hotfix</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox onChange={(e) => handleChangeShowOnlyData(e, 'highPriority')} checked={filters.showOnlyHighPriorityData} />
							<Typography>Mostrar apenas dados de alta prioridade</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center', marginTop: '2em', paddingLeft: '0.3em' }}>
							<Button onClick={() => applyFilters(filters)}>Aplicar</Button>
							<Button onClick={resetFilters}>Resetar</Button>
						</Grid>
					</Grid>
				</Card>
			</Modal>
		</>
	)
}

const mapStateToProps = ({ store }) => ({
	filtersDependantRedux: store?.dashboard?.filters?.dependant,
	fromDate: store?.dashboard?.filters?.fromDate,
	toDate: store?.dashboard?.filters?.toDate
})

const mapDispatchToProps = (dispatch) => ({
	addOnFiltersDispatch: (filters) => dispatch(addOnFiltersAction(filters))
})

export default connect(mapStateToProps, mapDispatchToProps)(memo(FiltersDashboard))
