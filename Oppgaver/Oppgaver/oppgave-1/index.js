
let lagBruker = document.querySelector('#lagBruker')
let logIn= document.querySelector('#logIn')

submit.addEventListener('click',nyBruker)

function nyBruker (){
    console.log(form)
}

let fornavn = document.querySelector('#fornavn')
let etternavn = document.querySelector('#etternavn')
let email = document.querySelector('#email')
let brukernavn = document.querySelector('#brukernavn')
let passord = document.querySelector('#passord')
let checkbox = document.querySelector('#checkbox')
let submit = document.querySelector('#submit')
let form = document.querySelector('#form')

submit.addEventListener('click', okButton)

function okButton(){
    console.log(name.value, email.value)
    greet()
}

function greet(){
    form.innerHTML = '<h1>Hei ' + brukernavn.value + '</h1>' 
    form.innerHTML += '<p>Det var veldig hyggelig at du ville være med i prosjektet.'
    form.innerHTML += '<p>Om jeg forstår det korrekt, er navnet ditt ' + fornavn.value + etternavn.value + ' og eposten din er: ' + email.value

    const newOkButton = document.createElement('button')
    newOkButton.innerHTML = 'ok'
    newOkButton.addEventListener('click', function(){
        form.innerHTML = '<h1>Supert!</h1>'
    })
    form.appendChild(newOkButton)

    const newCancelButton = document.createElement('button')
    newCancelButton.innerHTML = 'cancel'
    newCancelButton.addEventListener('click', function(){
        form.innerHTML = '' 
        form.appendChild(fornavn)
        form.appendChild(etternavn)
        form.appendChild(email)
        form.appendChild(brukernavn)
        form.appendChild(passord)
        form.appendChild(checkbox)
        form.appendChild(submit)
    })
    form.appendChild(newCancelButton)
}