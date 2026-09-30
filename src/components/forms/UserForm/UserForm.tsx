/**
 * UserForm component for handling user login and registration forms.
 *
 * Renders a form for user login or registration based on the provided mode.
 * Includes input fields for name, email, and password with validation and error handling.
 */

import { useEffect, useState, type FC, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/common';
import { useAppDispatch } from '@/store/hooks.ts';
import { loginUserThunk } from '@/store/thunks';
import { createUser } from '@/services';
import { ROUTE_PATHS, USER_FORM_MODES, type UserFormMode } from '@/constants';
import { authEnabled } from '@/services/api';
import styles from './styles.module.scss'; // feel free to add any styles you need

interface UserFormProps {
	mode: UserFormMode;
}

export const UserForm: FC<UserFormProps> = ({ mode }) => {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [requestError, setRequestError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const isLogin = mode === USER_FORM_MODES.LOGIN;

	const resetForm = () => {
		setName('');
		setEmail('');
		setPassword('');
		setErrors({});
		setRequestError('');
	};

	useEffect(() => {
		resetForm();
	}, [mode]);

	const validate = () => {
		const nextErrors: { [key: string]: string } = {};
		if (!isLogin && !name.trim()) {
			nextErrors.name = 'Name is required';
		}
		if (!email.trim()) {
			nextErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			nextErrors.email = 'Enter a valid email address';
		}
		if (!password.trim()) {
			nextErrors.password = 'Password is required';
		}
		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate() || isSubmitting) {
			return;
		}

		setRequestError('');
		setIsSubmitting(true);
		try {
			if (isLogin) {
				await dispatch(loginUserThunk({ email: email.trim(), password })).unwrap();
				navigate(ROUTE_PATHS.MOVIES);
			} else {
				await createUser({ name: name.trim(), email: email.trim(), password });
				navigate(ROUTE_PATHS.LOGIN);
			}
		} catch (error) {
			setRequestError(
				typeof error === 'string' ? error : error instanceof Error ? error.message : 'Request failed. Please try again.'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className={styles.userForm} onSubmit={handleSubmit}>
			<h2 className={styles.title}>{isLogin ? 'LOGIN' : 'REGISTRATION'}</h2>
			{!authEnabled && <p role='status'>Authentication is disabled for this deployment.</p>}
			{requestError && (
				<p className={styles.error} role='alert'>
					{requestError}
				</p>
			)}

			{!isLogin && (
				<>
					<Input labelText='NAME' placeholderText='enter name' value={name} onChange={(e) => setName(e.target.value)} />
					{errors.name && <span className={styles.error}>{errors.name}</span>}
				</>
			)}

			<Input
				labelText='EMAIL'
				placeholderText='enter email'
				type='email'
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			{errors.email && <span className={styles.error}>{errors.email}</span>}

			<Input
				labelText='PASSWORD'
				placeholderText={isLogin ? 'enter password' : 'create password'}
				type='password'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			{errors.password && <span className={styles.error}>{errors.password}</span>}

			<p className={styles.switchText}>
				{isLogin ? (
					<>
						Do not have an account? Go to <Link to={ROUTE_PATHS.REGISTRATION}>registration</Link> form!
					</>
				) : (
					<>
						Already registered? Go to <Link to={ROUTE_PATHS.LOGIN}>login</Link> form!
					</>
				)}
			</p>

			<div className={styles.actions}>
				<Button variant='secondary' type='button' onClick={resetForm}>
					RESET
				</Button>
				<Button variant='primary' type='submit' disabled={isSubmitting}>
					{isSubmitting ? 'PLEASE WAIT' : isLogin ? 'LOGIN' : 'REGISTER'}
				</Button>
			</div>
		</form>
	);
};
