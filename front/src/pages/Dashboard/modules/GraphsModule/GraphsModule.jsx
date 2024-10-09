import React, { useState, memo, useEffect } from 'react'
import { Unstable_Grid2 as Grid, MenuItem, Select } from '@mui/material'
import { buildGraphsMetrics } from 'utils/dataFormatUtils/dashBoardUtils'
import GraphContainer from 'components/GraphContainer/GraphContainer'
//import { render } from 'react-dom'
import { id } from 'date-fns/locale'
import CustomChart from 'components/Chart/CustomChart/CustomChart'

const graphHeight = 400
const containerHeight = graphHeight + 80
const allGraphColors = [
	'#008FFB',
	'#00E396',
	'#FEB019',
	'#FF4560',
	'#964B00',
	'#6A3D9A',
	'#009CDF',
	'#C9A76A',
	'#EA526F',
	'#4E3D63',
	'#00A08B',
	'#D8BF56',
	'#957DAD',
	'#738678',
	'#6B4226',
	'#984B43',
	'#D2D4DC',
	'#5E6A71',
	'#1C0C1F',
	'#14A7D0'
]

const RenderGraph = ({ graph }) => {
	return (
		<Grid item xs={graph.xs} key={graph.title}>
			<GraphContainer height={containerHeight} title={graph.title} key={graph.title}>
				<CustomChart
					series={graph?.series}
					labels={graph?.labels}
					height={graphHeight}
					width='100%'
					colors={allGraphColors}
					additionalOptions={graph.additionalOptions}
					typeChart={graph.typeChart}
				/>
			</GraphContainer>
		</Grid>
	)
}

const GraphsModule = ({ data, loading }) => {
	const [metrics, setMetrics] = useState({})
	const graphsToRender = [
		{
			id: 1,
			canLoad: metrics?.tagsGraphData?.popular?.series?.length > 0,
			series: metrics?.tagsGraphData?.popular?.series,
			labels: metrics?.tagsGraphData?.popular?.labels,
			title: 'Tags',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 12,
			typeChart: 'bar'
		},
		{
			id: 2,
			canLoad: metrics?.tagsGraphPie?.tags?.series?.length > 0,
			series: metrics?.tagsGraphPie?.tags?.series,
			labels: metrics?.tagsGraphPie?.tags?.labels,
			title: 'Tags',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 12,
			typeChart: 'pie'
		},
		{
			id: 3,
			canLoad: metrics?.priorityGraphData?.priorityTasks?.series?.length > 0,
			series: metrics?.priorityGraphData?.priorityTasks?.series,
			labels: metrics?.priorityGraphData?.priorityTasks?.labels,
			title: 'Prioridade',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 12,
			typeChart: 'line'
		},
		{
			id: 4,
			canLoad: metrics?.typeTaskGraphData?.taskByType?.series?.length > 0,
			series: metrics?.typeTaskGraphData?.taskByType?.series,
			labels: metrics?.typeTaskGraphData?.taskByType?.labels,
			title: 'Tipo',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 12,
			typeChart: 'line'
		},
		{
			id: 5,
			canLoad: metrics?.completionGraphData?.averageTagTime?.series?.length > 0,
			series: metrics?.completionGraphData?.averageTagTime?.series,
			labels: metrics?.completionGraphData?.averageTagTime?.labels,
			title: 'Média de tempo para finalização de tarefas por tag',
			additionalOptions: { formatterLabel: ' h' },
			xs: 12,
			typeChart: 'line'
		},
		{
			id: 6,
			canLoad: metrics?.completionGraphData?.averagePersonTime?.series?.length > 0,
			series: metrics?.completionGraphData?.averagePersonTime?.series,
			labels: metrics?.completionGraphData?.averagePersonTime?.labels,
			title: 'Média de tempo para finalização de tarefas por pessoa',
			additionalOptions: { formatterLabel: ' h' },
			xs: 12,
			typeChart: 'line'
		},
		{
			id: 7,
			canLoad: metrics?.completionGraphData?.averagePersonTimeHistory?.series?.length > 0,
			series: metrics?.completionGraphData?.averagePersonTimeHistory?.series,
			labels: metrics?.completionGraphData?.averagePersonTimeHistory?.labels,
			title: 'Média de tempo de alocação em tarefas por pessoa',
			additionalOptions: { formatterLabel: ' h' },
			xs: 12,
			typeChart: 'line'
		},
		{
			id: 8,
			canLoad: metrics?.usersGraphData?.responsibles?.series?.length > 0,
			series: metrics?.usersGraphData?.responsibles?.series,
			labels: metrics?.usersGraphData?.responsibles?.labels,
			title: 'Responsáveis',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 6,
			typeChart: 'bar'
		},
		{
			id: 9,
			canLoad: metrics?.usersGraphData?.creators?.series?.length > 0,
			series: metrics?.usersGraphData?.creators?.series,
			labels: metrics?.usersGraphData?.creators?.labels,
			title: 'Criadores',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 6,
			typeChart: 'bar'
		},
		{
			id: 10,
			canLoad: metrics?.usersGraphData?.closers?.series?.length > 0,
			series: metrics?.usersGraphData?.closers?.series,
			labels: metrics?.usersGraphData?.closers?.labels,
			title: 'Fechadores',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 6,
			typeChart: 'bar'
		},
		{
			id: 11,
			canLoad: metrics?.usersGraphData?.accomplices?.series?.length > 0,
			series: metrics?.usersGraphData?.accomplices?.series,
			labels: metrics?.usersGraphData?.accomplices?.labels,
			title: 'Participantes',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 6,
			typeChart: 'bar'
		},
		{
			id: 12,
			canLoad: metrics?.usersGraphData?.auditors?.series?.length > 0,
			series: metrics?.usersGraphData?.auditors?.series,
			labels: metrics?.usersGraphData?.auditors?.labels,
			title: 'Observadores',
			additionalOptions: { formatterLabel: ' tarefas' },
			xs: 12,
			typeChart: 'bar'
		}
	]

	useEffect(() => {
		if (data) {
			setMetrics(buildGraphsMetrics(data))
		}
	}, [data])

	return (
		<Grid container className='module'>
			{graphsToRender
				.filter((it) => it.canLoad)
				.map((graph) => (
					<RenderGraph graph={graph} key={graph.id} />
				))}
		</Grid>
	)
}

export default memo(GraphsModule)
