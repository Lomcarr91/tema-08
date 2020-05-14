<script>
import { fade, fly, scale } from 'svelte/transition'

	
	let q = ''
	let api_key = 'YBbQ2eniNuaWN622xhUgDj0akvVSoZ2S'
	const limit = 1
	let gif
	let favorites = []
	let showFav = false

	 const getgif = () =>
{
	gif = null
	 fetch(`https://api.giphy.com/v1/gifs/search?q=${q}&limit=${limit}&api_key=${api_key}`) 
		.then( res => res.json() )
			.then( json => {
			 console.log(json)
			 gif = json.data[0].images.downsized_medium.url 
			})
}
</script>


<main>

<header>
	<input id="search" placeholder="Search for gif" type="text" bind:value={q} on:keydown={(key) => key.key == "Enter"? getgif():''}>
	<button on:click={getgif}>Søk</button>
</header>
	
{#if gif}
    <img in:scale src="{gif}" alt="{q}">
{:else}
    <h2>Skriv noe og trykk Søk</h2>
{/if}   
</main>

<style>
	:global(body, html){
		margin:0;
		padding:0;
	}
	:global(*){
		box-sizing:border-box;
	}
	main{
		display:grid;
		place-items:center;
		height:100%;
	}
	header{
		position:absolute;
		top:2rem;
		width:100%;
		display:grid;
		padding: 0 20vw 0 20vw;
	}
#search{
	border-radius: 20px;
	text-align: center
}
	button{
		border-radius: 20px;
	}
</style>