import React, { useEffect, useState } from 'react'
import api from 'service/service'
import { connect } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, CardHeader, Divider, Grid, TextField, Typography } from '@mui/material'
import { loginAction } from 'storage/redux/actions/user.actions'
import axios from 'axios'

const Login = ({ loginActionDispatch }) => {
	let [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [domainBitrix, setdomainBitrix] = useState('')

	const getAuth = () => {
		setLoading(true)
		api.get(`/login/get-url-auth/${domainBitrix}`).then((res) => {
			window.location.href = res.data
		})
	}

	useEffect(() => {
		if (searchParams.get('code') && searchParams.get('scope')) {
			setLoading(true)
			api.get(`/login?authCode=${searchParams.get('code')}&scope=${searchParams.get('scope')}&domain=${searchParams.get('domain')}`).then(
				(res) => {
					setLoading(false)
					loginActionDispatch(res.data)
				}
			)
		}
	}, [searchParams])

	const handleOnChangeDomain = (e) => {
		setdomainBitrix(e.target.value)
	}

	const handleOnEnterDomain = (event) => {
		if (event.key === 'Enter') {
			getAuth()
		}
	}

	return (
		<div style={{ justifyContent: 'center', display: 'flex', height: '100vh', alignItems: 'center' }}>
			<Card style={{ height: '25em', width: '40em', padding: '0em 2em 0em 2em' }}>
				{/* <Typography style={{ justifyContent: 'center', display: 'flex' }} color='text.secondary'>
					Faça o login utilizando o seu Bitrix24
				</Typography> */}
				<CardHeader title='Login' subheader='Faça o login utilizando o seu Bitrix24' />

				<Divider />

				<Grid container style={{ marginTop: '5em', marginBottom: 'auto' }}>
					<Grid item xs={8}>
						<TextField
							label='Domínio Bitrix'
							variant='outlined'
							onChange={handleOnChangeDomain}
							fullWidth
							onKeyDown={handleOnEnterDomain}
						/>
					</Grid>
					<Grid item xs={2}>
						<Button onClick={getAuth} disabled={loading} variant='contained' style={{ height: '100%', marginLeft: '3em' }}>
							{loading ? 'Carregando' : 'Entrar'}
						</Button>
					</Grid>
				</Grid>
				<Grid container style={{ marginBottom: 'auto', marginTop: '0.3em' }}>
					<Grid item xs>
						<Typography style={{ marginLeft: '0.2em', opacity: '0.8' }} color='text.secondary'>
							Domínio vinculado no Bitrix24, ex: teste123
						</Typography>
					</Grid>
				</Grid>
			</Card>
		</div>
	)
}

const mapDispatchToProps = (dispatch) => ({
	loginActionDispatch: (user) => dispatch(loginAction(user))
})

export default connect(null, mapDispatchToProps)(Login)
