<script>
	//Dette er fra det gamle app.svelte dokumentet
	let addInfo

	addInfo.addEventListner('click')

</script>



<main>
	<h3>Call To Mind</h3>

	<img src="public/bilder/logo3.svg" alt="">

	<div id="intro">
		<h4>Du har ingen planlagte anrop enda!</h4>
		<p>Trykk på den det blå krysset i høyre hjørne for å registrere- og planlegge en telefonsamtale</p>
	</div>

<!--Knapp for å videresende til "timer"-skjemaet-->
	<button id="addInfo">+</button>
</main>




<style>
	@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

	:global(body) {
		background: linear-gradient(#117893, white);
		font-family: 'Roboto', sans-serif;
	}

	(main) {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	(h3) {
		color: #117893;
	}

	(h1) {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	(#intro) {
		color: #117893;
		margin: 150px 0px 0px 0px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>