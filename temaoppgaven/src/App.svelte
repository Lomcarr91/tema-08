<script>
	//debug objekt lagt till
	let calls = []
	let newcall = {}
	//scene kan være frontpage | addcall | alarm
	let scene = 'frontpage'

	const addCall = () => {
		calls = [newcall, ...calls]
		newcall = {}
		scene = 'frontpage'
	}

	let whatsthetime = 0

	let time

	$: console.log(calls)

	let src = 'Pics/call.gif'; // 
	let logo = 'Call to Mind';


	//Alarm-delen
	const slumre = (call) => {
		let index = calls.indexOf(call)
		console.log(index)
		calls[index].hour = new Date().getHours() + 1
		scene = 'frontpage'
	}

	const callDone = (call) => {
		calls = calls.filter(c => c != call)
		scene = 'frontpage'
	}

	const checkCalls = () => {
		time = new Date().getHours()
		calls.map(call => {
			if (call.hour == time) {
				scene = 'alarm'
			}
		})
	}

	setInterval(checkCalls, 1000)
</script>



<main>
<!--Startsiden, og hvor "påminnelsene" blir registrert og lagt evd-->
	{#if scene === 'frontpage'}
	<h3>Call To Mind</h3>	
		{#if calls.length == 0}
		 <img {src} alt="{logo}">
			<div id="introTekst">
				<h4>Du har ingen planlagte anrop enda!</h4>
				<p>Trykk på den det blå krysset i høyre hjørne for å registrere- og planlegge en telefonsamtale</p>
			</div>
			{:else}
			 {#each calls as call}
			 	<div class="call">
				 	<h2>{call.name}</h2>
					 <p>{call.phone}</p>
					 <p>{call.notes}</p>
					 <p>{call.hour}</p>
					 <button class="btnDelete" on:click={()=>callDone(call)}>Slett påminnelse</button>
				 </div>
			 {/each}
		{/if}
		
	
	{/if}

	<!--Hvor en skal legge inn informasjon om påminnelsen-->
	{#if scene == 'addcall'}
	<h3>Call To Mind</h3>	
			<h1 id="addCall"> Registrer påminnelse</h1>
			<div id="acBox">
				<input placeholder='navn' bind:value={newcall.name}> 
				<input placeholder='telefonnummer' bind:value={newcall.phone}>
				<input placeholder='notat' bind:value={newcall.notes}>
				<input placeholder='sett inn hel time' bind:value={newcall.hour}>
				<button class="acButton" on:click={addCall}>Lagre</button>
				<button class="acButton" on:click={ () => scene='frontpage' }>Avbryt</button> 
			</div>
			
	{/if}
	
	<!--ferdig alarm som vil ringe hver time fra satt klokkeslett-->
	{#if scene == 'alarm'}
		<h1 id="addAlarm">Alarm</h1>
		{#each calls as call}
			{#if call.hour == time}
				<div class="call">
				 	<h2>{call.name}</h2>
					 <p>{call.phone}</p>
					 <p>{call.notes}</p>
					 <p>{call.hour}</p>
					 <button class="alarmButton" on:click={()=>callDone(call)}>Ring</button>
					 <button class="alarmButton" on:click={()=>slumre(call)}>Slumre</button>
				 </div>
			{/if}
		{/each}
		
	{/if}

	<button id="addTimer" on:click={ () => scene='addcall' } >+</button>
</main>




<style>
/*Generell styling start*/
	@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
	
	@media (min-width: 640px) {
		main {
			max-width: none;
			
		}
	}

	:global(body) {
		background: linear-gradient(#117893, white);
		font-family: 'Roboto', sans-serif;
		background-repeat: no-repeat;
  		background-attachment: fixed;
	}

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h3{
		color: white;
	}

	h1 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	
/*Generell styling stop*/

/*Frontpage start*/
	img{
	width: 50vw;
	margin: 15px 0 0 0;
	padding: 10px 0 0 0;
	border: solid;
	border-radius: 10%;
	border-width: thin;
	color: white;
	}

	#introTekst {
		color: #117893;
		margin: 80px 0 0 0;
	}
/*Frontpage stop*/

/*Addcall start*/

	#acBox{
		margin: 45px 0 0 0;
		border: 1px transparent;
		border-radius: 10px;
		padding: 20px 20px 9px 20px;
		text-align: left;
		background-color: #117893;
		background-color: hsla(0, 0, 0, 0%)
	}	

	input{
		font-size: 15px;
		background: none;
		width: 100%;
		padding: 12px 20px;
		margin: 8px 0;
		border: none;
		border-bottom: 0.5px solid white;
	}	

	::placeholder{
		color: white;
		opacity: 0.5;
	}	
	
	#addCall{
		color: white;
		font-size: 25px;
	}
/*Addcall stop*/

/*Alarm starts*/
	#addAlarm{
		color: white;
		font-size: 25px;
	}

	.call{
		margin: 20px 0 125px 0;
		padding: 30px;
		background-color: #117893;
		color: white;
		border-radius: 10%;
	}
/*Alarm stops*/

/*Buttons start*/

	#addTimer{
		position: fixed;
		background:#117893;
		color: white;
		padding:1rem;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		margin: 60px 0 0 100px;
	}

	.acButton{
		color: #117893;
		background-color: white;
		border-radius: 10%;
		border: 1px transparent;
		font-weight: bold;
		margin: 16.5px;
	}

	.btnDelete{
		color: #117893;
		background-color: white;
		border-radius: 10%;
		border: 1px transparent;
		font-weight: bold;
		margin: 16.5px;
	}

	.alarmButton{
		color: #117893;
		background-color: white;
		border-radius: 10%;
		border: 1px transparent;
		font-weight: bold;
		margin: 20px;
	}
/*Buttons stop*/
</style>