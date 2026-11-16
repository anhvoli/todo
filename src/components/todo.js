import React, { Component } from 'react'
import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import CardContent from '@material-ui/core/CardContent';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { onAuthStateChanged } from 'firebase/auth';
import {
	collection,
	query,
	where,
	onSnapshot,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { friendlyFirestoreError } from '../util/auth';

const styles = (theme) => ({

    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
    toolbar: theme.mixins.toolbar,
	
	title: {
		marginLeft: theme.spacing(2),
		flex: 1
	},
	submitButton: {
		display: 'block',
		color: 'white',
		textAlign: 'center',
		position: 'absolute',
		top: 14,
		right: 10
	},
	floatingButton: {
		position: 'fixed',
		bottom: 0,
		right: 0
	},
	form: {
		width: '98%',
		marginLeft: 13,
		marginTop: '130px'
	},
	root: {
		minWidth: 470
	},
	bullet: {
		display: 'inline-block',
		margin: '0 2px',
		transform: 'scale(0.8)'
	},
	pos: {
		marginBottom: 12
	},
	uiProgess: {
		position: 'fixed',
		zIndex: '1000',
		height: '31px',
		width: '31px',
		left: '50%',
		top: '35%'
	},
	dialogeStyle: {
		maxWidth: '50%'
	},
	viewRoot: {
		margin: 0,
		padding: theme.spacing(2)
	},
	closeButton: {
		position: 'absolute',
		right: theme.spacing(1),
		top: theme.spacing(1),
		color: theme.palette.grey[500]
	},
	completedTitle: {
		textDecoration: 'line-through',
		color: theme.palette.text.secondary
	},
	customError: {
		color: 'red',
		fontSize: '0.8rem',
		marginTop: 10
	}
});

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

class todo extends Component {
	constructor(props) {
		super(props);

		this.state = {
			todos: [],
			title: '',
			body: '',
			todoId: '',
			errors: [],
			open: false,
			uiLoading: true,
			buttonType: '',
			viewOpen: false,
			firestoreError: ''
		};

		this.deleteTodoHandler = this.deleteTodoHandler.bind(this);
		this.toggleTodoHandler = this.toggleTodoHandler.bind(this);
		this.handleEditClickOpen = this.handleEditClickOpen.bind(this);
		this.handleViewOpen = this.handleViewOpen.bind(this);
	}

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value
		});
	};

	componentWillMount = () => {
		// Live-sync this user's todos from Firestore (no orderBy in the query
		// to avoid needing a composite index — we sort client-side instead).
		this.unsubAuth = onAuthStateChanged(auth, (user) => {
			if (!user) return; // home.js already redirects to /login
			this.currentUid = user.uid;
			const q = query(collection(db, 'todos'), where('uid', '==', user.uid));
			this.unsubTodos = onSnapshot(
				q,
				(snapshot) => {
					const todos = snapshot.docs.map((d) => {
						const data = d.data();
						const createdAt =
							data.createdAt && data.createdAt.toDate
								? data.createdAt.toDate()
								: data.createdAt || new Date();
						return {
							todoId: d.id,
							title: data.title || '',
							body: data.body || '',
							completed: !!data.completed,
							createdAt
						};
					});
					todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
					this.setState({
						todos,
						uiLoading: false,
						firestoreError: ''
					});
				},
				(error) => {
					console.log(error);
					this.setState({
						uiLoading: false,
						firestoreError: friendlyFirestoreError(error)
					});
				}
			);
		});
	};

	componentWillUnmount = () => {
		if (this.unsubTodos) this.unsubTodos();
		if (this.unsubAuth) this.unsubAuth();
	};

	deleteTodoHandler(data) {
		const todoId = data.todo.todoId;
		deleteDoc(doc(db, 'todos', todoId)).catch((err) => {
			console.log(err);
			this.setState({ firestoreError: friendlyFirestoreError(err) });
		});
	}

	toggleTodoHandler(data) {
		const todo = data.todo;
		updateDoc(doc(db, 'todos', todo.todoId), { completed: !todo.completed }).catch((err) => {
			console.log(err);
			this.setState({ firestoreError: friendlyFirestoreError(err) });
		});
	}

	handleEditClickOpen(data) {
		this.setState({
			title: data.todo.title,
			body: data.todo.body,
			todoId: data.todo.todoId,
			buttonType: 'Edit',
			open: true
		});
	}

	handleViewOpen(data) {
		this.setState({
			title: data.todo.title,
			body: data.todo.body,
			viewOpen: true
		});
	}

	render() {
		const DialogTitle = withStyles(styles)((props) => {
			const { children, classes, onClose, ...other } = props;
			return (
				<MuiDialogTitle disableTypography className={classes.root} {...other}>
					<Typography variant="h6">{children}</Typography>
					{onClose ? (
						<IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
							<CloseIcon />
						</IconButton>
					) : null}
				</MuiDialogTitle>
			);
		});

		const DialogContent = withStyles((theme) => ({
			viewRoot: {
				padding: theme.spacing(2)
			}
		}))(MuiDialogContent);

		dayjs.extend(relativeTime);
		const { classes } = this.props;
		const { open, errors, viewOpen } = this.state;

		const handleClickOpen = () => {
			this.setState({
				todoId: '',
				title: '',
				body: '',
				buttonType: '',
				open: true
			});
		};

		const handleSubmit = (event) => {
			event.preventDefault();
			const userTodo = {
				title: this.state.title,
				body: this.state.body
			};
			let promise;
			if (this.state.buttonType === 'Edit') {
				promise = updateDoc(doc(db, 'todos', this.state.todoId), userTodo);
			} else {
				promise = addDoc(collection(db, 'todos'), {
					...userTodo,
					uid: this.currentUid,
					completed: false,
					createdAt: serverTimestamp()
				});
			}
			promise
				.then(() => {
					// onSnapshot refreshes the list live — no page reload needed.
					this.setState({ open: false, errors: [] });
				})
				.catch((error) => {
					console.log(error);
					this.setState({ open: true, errors: { general: friendlyFirestoreError(error) } });
				});
		};

		const handleViewClose = () => {
			this.setState({ viewOpen: false });
		};

		const handleClose = (event) => {
			this.setState({ open: false });
		};

		if (this.state.uiLoading === true) {
			return (
				<main className={classes.content}>
					<div className={classes.toolbar} />
					{this.state.uiLoading && <CircularProgress size={150} className={classes.uiProgess} />}
				</main>
			);
		} else {
			return (
				<main className={classes.content}>
					<div className={classes.toolbar} />

					{this.state.firestoreError && (
						<Typography variant="body2" className={classes.customError} data-testid="firestore-error">
							{this.state.firestoreError}
						</Typography>
					)}

					<IconButton
						className={classes.floatingButton}
						color="primary"
						aria-label="Add Todo"
						onClick={handleClickOpen}
					>
						<AddCircleIcon style={{ fontSize: 60 }} />
					</IconButton>
					<Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
						<AppBar className={classes.appBar}>
							<Toolbar>
								<IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
									<CloseIcon />
								</IconButton>
								<Typography variant="h6" className={classes.title}>
									{this.state.buttonType === 'Edit' ? 'Edit Todo' : 'Create a new Todo'}
								</Typography>
								<Button
									autoFocus
									color="inherit"
									onClick={handleSubmit}
									className={classes.submitButton}
								>
									{this.state.buttonType === 'Edit' ? 'Save' : 'Submit'}
								</Button>
							</Toolbar>
						</AppBar>

						<form className={classes.form} noValidate>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<TextField
										variant="outlined"
										required
										fullWidth
										id="todoTitle"
										label="Todo Title"
										name="title"
										autoComplete="todoTitle"
										helperText={errors.title}
										value={this.state.title}
										error={errors.title ? true : false}
										onChange={this.handleChange}
									/>
								</Grid>
								<Grid item xs={12}>
									<TextField
										variant="outlined"
										required
										fullWidth
										id="todoDetails"
										label="Todo Details"
										name="body"
										autoComplete="todoDetails"
										multiline
										rows={25}
										rowsMax={25}
										helperText={errors.body}
										error={errors.body ? true : false}
										onChange={this.handleChange}
										value={this.state.body}
									/>
								</Grid>
							</Grid>
							{errors.general && (
								<Typography variant="body2" className={classes.customError}>
									{errors.general}
								</Typography>
							)}
						</form>
					</Dialog>

					<Grid container spacing={2}>
						{this.state.todos.map((todo) => (
							<Grid item xs={12} sm={6} key={todo.todoId}>
								<Card className={classes.root} variant="outlined" data-testid="todo-card">
									<CardContent>
										<Typography
											variant="h5"
											component="h2"
											className={todo.completed ? classes.completedTitle : ''}
										>
											{todo.title}
										</Typography>
										<Typography className={classes.pos} color="textSecondary">
											{dayjs(todo.createdAt).fromNow()}
										</Typography>
										<Typography variant="body2" component="p">
											{`${todo.body.substring(0, 65)}`}
										</Typography>
									</CardContent>
									<CardActions>
										<FormControlLabel
											control={
												<Checkbox
													checked={todo.completed}
													onChange={() => this.toggleTodoHandler({ todo })}
													color="primary"
													inputProps={{ 'aria-label': 'Mark done' }}
												/>
											}
											label={todo.completed ? 'Done' : 'Mark done'}
										/>
										<Button size="small" color="primary" onClick={() => this.handleViewOpen({ todo })}>
											{' '}
											View{' '}
										</Button>
										<Button size="small" color="primary" onClick={() => this.handleEditClickOpen({ todo })}>
											Edit
										</Button>
										<Button size="small" color="primary" onClick={() => this.deleteTodoHandler({ todo })}>
											Delete
										</Button>
									</CardActions>
								</Card>
							</Grid>
						))}
					</Grid>

					<Dialog
						onClose={handleViewClose}
						aria-labelledby="customized-dialog-title"
						open={viewOpen}
						fullWidth
						classes={{ paperFullWidth: classes.dialogeStyle }}
					>
						<DialogTitle id="customized-dialog-title" onClose={handleViewClose}>
							{this.state.title}
						</DialogTitle>
						<DialogContent dividers>
							<TextField
								fullWidth
								id="todoDetails"
								name="body"
								multiline
								readonly
								rows={1}
								rowsMax={25}
								value={this.state.body}
								InputProps={{
									disableUnderline: true
								}}
							/>
						</DialogContent>
					</Dialog>
				</main>
			);
		}
	}
}

export default withStyles(styles)(todo);
