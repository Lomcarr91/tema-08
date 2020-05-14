<script>
	//context menu start
	const {
		remote
	} = require('electron')
	const {
		Menu,
		MenuItem
	} = remote

	const menu = new Menu()
	menu.append(new MenuItem({
		label: 'meny 1',
		click() {
			info = 'item 1 klikket'
		}
	}))
	menu.append(new MenuItem({
		type: 'separator'
	}))
	menu.append(new MenuItem({
		label: 'meny 2',
		click() {
			info = 'item 2 klikket'
		}
	}))

	const context = e => {
		e.preventDefault()
		menu.popup({
			window: remote.getCurrentWindow()
		})
	}
	//context menu end


	let info = 'Nothing happening yet'

	const showNotification = () => {
		let myNotification = new Notification('Hello', {
			body: 'You are now officialy part of the system OS'
		})
		myNotification.onclick = () => {
			info = 'Notification clicked'
		}
	}

	//alerts start
	const amIOnline = () => {
		window.alert(navigator.onLine ? 'you\'re online sirs' : 'you\'re offline')
		info = 'Alert accepted'
	}
	amIOnline.onclick = () => {
		info = 'Alert accepted'
	}
	//alerts end
</script>


<main>
	<hr>
	<div class="stuff" on:contextmenu={context}>
		<h1>Svelte in Electron</h1>
		<p>{info}</p>

		<button on:click={()=> showNotification() }>Klikk på meg</button>
		<!--alerts start-->
		<button on:click={()=> amIOnline () }>Online?</button>
		<!--alerts end-->
</main>


<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	.stuff {
		width: 100%;
		height: 200px;
		background-color: slategray;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>