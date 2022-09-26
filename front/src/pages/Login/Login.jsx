import React, { useEffect, useState } from 'react'
import api from 'service/service'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'

const Login = () => {
	let [searchParams] = useSearchParams()
	let navigate = useNavigate()
	const [loading, setLoading] = useState(false)

	const getAuth = () => {
		setLoading(true)
		api.get('/get-url-auth')
			.then((res) => {
				window.location.href = res.data
			})
			.catch((e) => console.error(e.response.data))
	}

	useEffect(() => {
		if (searchParams.get('code') && searchParams.get('scope')) {
			setLoading(true)
			api.get(`/get-url-final-auth?authCode=${searchParams.get('code')}&scope=${searchParams.get('scope')}`)
				.then(() => {
					setLoading(false)
					navigate('/dashboard')
				})
				.catch((e) => console.error(e.response.data))
		}
	}, [searchParams])

	return (
		<div style={{ justifyContent: 'center', display: 'flex', height: '100vh', alignItems: 'center' }}>
			<div style={{ display: 'block', border: '1px solid blue', height: '30em', width: '30em' }}>
				<h3 style={{ justifyContent: 'center', display: 'flex' }}>Fazer login utilizando o seu Bitrix24</h3>
				<div style={{ justifyContent: 'center', display: 'flex', marginTop: 'auto', marginBottom: 'auto' }}>
					<Button onClick={getAuth} style={{ height: 'fit-content', marginTop: '10em' }} disabled={loading}>
						{loading ? 'Carregando' : 'Entrar'}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default Login
