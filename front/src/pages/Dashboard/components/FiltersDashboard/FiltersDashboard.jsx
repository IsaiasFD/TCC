import React, { useState, useEffect, memo } from 'react'
import { connect } from 'react-redux'
import { Button, Card, Modal, Grid, Checkbox, Typography } from '@mui/material'
//system libs
import SelectTag from 'components/SelectTag/SelectTag'
import { addOnFiltersAction } from 'storage/redux/actions/dashboard.actions'
import { DEFAULT_DASHBOARD_FILTERS } from 'storage/redux/reducer/main.reducer'
import MembersFiltersCheckList from './components/MembersFiltersCheckList/MembersFiltersCheckList'
import api from 'service/service'
import { add, set } from 'date-fns'
import { is } from 'date-fns/locale'

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
let loadedOptions = false
let firstApply = true

const FiltersDashboard = ({ filtersDependantRedux, addOnFiltersDispatch, data, onApplyFilters, buttonStyle, fromDate, toDate }) => {
	const [selectedFilters, setSelectedFilters] = useState(DEFAULT_DASHBOARD_FILTERS)
	const [filterOptions, setFilterOptions] = useState(data)
	const [open, setOpen] = useState(true)

	const loadTasks = async () => {
		try {
			if (selectedFilters.groups.length === 0) {
				return { ...filterOptions, allTasks: [], members: [], tags: [] }
			}
			const selectedGroups = selectedFilters.groups
			const encodedGroups = encodeURIComponent(selectedGroups.join(','))
			const res = await api.get(`/dashboard/get-all-tasks-and-groups-with-members/${fromDate}/${toDate}/${encodedGroups}`)
			const fOptions = { ...filterOptions, allTasks: res?.data?.allTasks, members: res?.data?.members, tags: res?.data?.tags }
			return fOptions
		} catch (error) {
			console.error('Error loading data:', error)
		}
	}

	// useEffect(() => {
	// 	if (!open && !firstLoad) {
	// 		handleChangeFilter(data, filtersDependantRedux)
	// 	}
	// }, [open])

	useEffect(() => {
		// const tempFilter = {
		// 	...filtersDependantRedux,
		// 	groups: filterOptions.groups.filter((g) => filtersDependantRedux.groups.includes(g.id)).map((g) => g.id),
		// 	members: filterOptions.members.filter((m) => filtersDependantRedux.members.includes(m.id)).map((m) => m.id),
		// 	tags: filterOptions.tags.filter((t) => filtersDependantRedux.tags.includes(t.id)).map((t) => t.id),
		// 	priority: priorityOptions.filter((p) => filtersDependantRedux.priority.includes(p.id)).map((p) => p.id),
		// 	showOnlySelectedMemberData: filtersDependantRedux.showOnlySelectedMemberData,
		// 	showOnlyHotfixData: filtersDependantRedux.showOnlyHotfixData,
		// 	showOnlyHighPriorityData: filtersDependantRedux.showOnlyHighPriorityData
		// }
		setSelectedFilters(filtersDependantRedux)
		//applyFilters(tempFilter, firstLoad)
		if (filtersDependantRedux.groups.length > 0) {
			setOpen(false)
		}
	}, [])

	useEffect(() => {
		if (!firstLoad) {
			loadTasks().then((res) => {
				handleChangeFilter(res, selectedFilters)
			})
		} else {
			firstLoad = false
		}
	}, [selectedFilters])

	useEffect(() => {
		if (loadedOptions) {
			const tempFilter = {
				...selectedFilters,
				groups: filterOptions.groups.filter((g) => selectedFilters.groups.includes(g.id)).map((g) => g.id),
				members: filterOptions.members.filter((m) => selectedFilters.members.includes(m.id)).map((m) => m.id),
				tags: filterOptions.tags.filter((t) => selectedFilters.tags.includes(t.id)).map((t) => t.id),
				priority: priorityOptions.filter((p) => selectedFilters.priority.includes(p.id)).map((p) => p.id),
				showOnlySelectedMemberData: selectedFilters.showOnlySelectedMemberData,
				showOnlyHotfixData: selectedFilters.showOnlyHotfixData,
				showOnlyHighPriorityData: selectedFilters.showOnlyHighPriorityData
			}
			setSelectedFilters(tempFilter)

			if (firstApply) {
				applyFilters(tempFilter, firstLoad)
				firstApply = false
			}
		} else {
			loadedOptions = true
		}
	}, [filterOptions.members, filterOptions.tags])

	useEffect(() => {
		if (!firstLoad) {
			loadTasks().then((res) => {
				const tasks = handleChangeFilter(res, selectedFilters)
				onApplyFilters(tasks)
			})
		}
	}, [fromDate, toDate])

	const onChangeGroups = (changedGroups) => {
		const newFilters = { ...selectedFilters, groups: changedGroups.map((g) => g.id) }
		setSelectedFilters(newFilters)
		handleChangeSelect(newFilters, 'groups')
	}

	const onChangeMembers = (changedMembers) => {
		const newFilters = { ...selectedFilters, members: changedMembers.map((m) => m.id) }
		if (changedMembers.length === 0) {
			setSelectedFilters({ ...newFilters, showOnlySelectedMemberData: false })
		} else {
			setSelectedFilters(newFilters)
		}
	}
	const onChangeTags = (changedTags) => {
		const newFilters = { ...selectedFilters, tags: changedTags.map((t) => t.id) }
		setSelectedFilters(newFilters)
	}

	const onChangePriority = (changedPriority) => {
		const newFilters = { ...selectedFilters, priority: changedPriority.map((p) => p.id) }
		setSelectedFilters(newFilters)
	}

	const handleOpen = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
	}

	const applyFilters = (selectedFilter, closeFilter) => {
		setOpen(!!closeFilter)

		if (onApplyFilters) {
			const tasks = handleChangeFilter(filterOptions, selectedFilter)
			addOnFiltersDispatch({ dependant: selectedFilter })
			onApplyFilters(tasks)
		}
	}

	const resetFilters = () => {
		setSelectedFilters(DEFAULT_DASHBOARD_FILTERS)
		addOnFiltersDispatch({ dependant: DEFAULT_DASHBOARD_FILTERS })
		handleChangeFilter(data, DEFAULT_DASHBOARD_FILTERS)
	}

	const handleChangeShowOnlyData = (event, type) => {
		let newFilters = { ...selectedFilters }
		if (type === 'members') {
			newFilters.showOnlySelectedMemberData = event.target.checked
		} else if (type === 'hotfix') {
			newFilters.showOnlyHotfixData = event.target.checked
		} else if (type === 'highPriority') {
			newFilters.showOnlyHighPriorityData = event.target.checked
		}
		setSelectedFilters(newFilters)
		handleChangeFilter(data, newFilters)
	}

	const handleChangeSelect = (newFilters) => {
		handleChangeFilter(filterOptions, newFilters)
	}

	const handleChangeFilter = (filterData, newFilters) => {
		const filterOptionsSelected = {
			groups: filterOptions.groups.filter((g) => newFilters.groups.includes(g.id)),
			members: filterOptions.members.filter((m) => newFilters.members.includes(m.id)),
			tags: filterOptions.tags.filter((t) => newFilters.tags.includes(t.id)),
			priority: priorityOptions.filter((p) => newFilters.priority.includes(p.id)),
			showOnlySelectedMemberData: newFilters.showOnlySelectedMemberData,
			showOnlyHotfixData: newFilters.showOnlyHotfixData,
			showOnlyHighPriorityData: newFilters.showOnlyHighPriorityData
		}
		const { options, tasks } = getFilterOptions(filterData, filterOptionsSelected)
		const changeMembers =
			JSON.stringify(options.members.sort((a, b) => a.id - b.id)) !== JSON.stringify(filterOptions.members.sort((a, b) => a.id - b.id))
		const changeTags = JSON.stringify(options.tags.sort((a, b) => a.id - b.id)) != JSON.stringify(filterOptions.tags.sort((a, b) => a.id - b.id))

		if (changeMembers || changeTags) {
			setFilterOptions({ ...filterData, members: options.members, tags: options.tags })
		}
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
							<SelectTag
								label='Grupos'
								options={filterOptions.groups}
								onChange={onChangeGroups}
								selected={filterOptions?.groups?.filter((g) => selectedFilters.groups.includes(g.id)) || []}
							/>
							<SelectTag
								label='Membros'
								options={filterOptions.members}
								onChange={onChangeMembers}
								selected={filterOptions?.members?.filter((m) => selectedFilters.members.includes(m.id)) || []}
							/>
							<SelectTag
								label='Tags'
								options={filterOptions.tags}
								onChange={onChangeTags}
								selected={filterOptions?.tags?.filter((t) => selectedFilters.tags.includes(t.id)) || []}
							/>
							<SelectTag
								label='Prioridades'
								options={priorityOptions}
								onChange={onChangePriority}
								selected={filterOptions?.priority?.filter((p) => selectedFilters.priority.includes(p.id)) || []}
							/>
						</Grid>
						<Grid item xs={6} style={{ paddingLeft: '5em', maxHeight: '15em', overflow: 'auto' }}>
							<MembersFiltersCheckList data={filterOptions?.members?.filter((m) => selectedFilters.members.includes(m.id)) || []} />
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox
								onChange={(e) => handleChangeShowOnlyData(e, 'members')}
								checked={selectedFilters.showOnlySelectedMemberData}
								disabled={selectedFilters.members.length === 0}
							/>
							<Typography>Mostrar apenas dados de membros selecionados</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox onChange={(e) => handleChangeShowOnlyData(e, 'hotfix')} checked={selectedFilters.showOnlyHotfixData} />
							<Typography>Mostrar apenas dados de hotfix</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center' }}>
							<Checkbox
								onChange={(e) => handleChangeShowOnlyData(e, 'highPriority')}
								checked={selectedFilters.showOnlyHighPriorityData}
							/>
							<Typography>Mostrar apenas dados de alta prioridade</Typography>
						</Grid>
						<Grid item xs={12} style={{ display: 'flex', alignItems: 'center', marginTop: '2em', paddingLeft: '0.3em' }}>
							<Button onClick={() => applyFilters(selectedFilters)}>Aplicar</Button>
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
