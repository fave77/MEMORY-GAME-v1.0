//initiating the game!
function init(level) {
    const containers = document.querySelectorAll('.container');
    containers[0].classList.add('hide');
    containers[1].classList.remove('hide');

    //...and the game starts!
    CONTROLLER.shuffle();
    CONTROLLER.setBoard(level);
    const destination = new Date().getTime() + MODEL.timer;
    MODEL.timeInterval = setInterval(() => VIEW.updateTimer(destination), 1000);
}

//initiating AOS library
AOS.init({
    duration: 1000
});

//MODEL holds the gamestate during each move
const MODEL = {
    fruits: {
        'fruit-1': 'apple.svg',
        'fruit-2': 'bananas.svg',
        'fruit-3': 'cherries.svg',
        'fruit-4': 'garlic.svg',
        'fruit-5': 'grapes.svg',
        'fruit-6': 'pineapple.svg',
        'fruit-7': 'strawberry.svg',
        'fruit-8': 'watermelon.svg'
    },
    locations: [],
    state: [],
    moves: 0,
    stars: 5,
    timer: undefined,
    timeInterval: undefined
};

//VIEW updates the UI/UX for the game
const VIEW = {
    generateFruits() {
        //assigning the fruits to each card on the board
        const cards = [];
        for(let i=0; i<MODEL.locations.length; i++){
            const card = document.getElementById('card-' + (i+1));
            card.children[0].setAttribute('src', 'img/' + MODEL.fruits['fruit-' + MODEL.locations[i]]);
            card.children[0].setAttribute('alt', MODEL.locations[i]);
            cards.push(card);
        }
        return cards;
    },
    selectCard() {
        //animation for selecting a card
        const card = this;
        this.classList.toggle('flipInY');
        this.classList.toggle('flip');
        this.classList.toggle('open');
        this.children[0].classList.toggle('hidden');
        this.removeEventListener('click', VIEW.selectCard);
        CONTROLLER.gameplay(card);
    },
    updateTimer(destination) {
        //updates the timer for every second
        const timer = document.querySelector('time');
        const present = new Date().getTime();
        const remainingTime = destination - present;
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        timer.textContent = '0' + minutes + ':' + ((String(seconds).length == 1)?'0':'') + seconds;
        if(!(minutes + seconds)) exit('failure');
    },
    updateMoves() {
        //keep track of the number of moves
        const moves = document.getElementById('moves');
        moves.textContent = MODEL.moves;
    },
    updateStars() {
        //updates star rating based on the number of moves
        const stars = document.querySelectorAll('.star');
        const lastStar = stars[stars.length - 1];
        lastStar.classList.remove('rollIn')
        lastStar.classList.add('zoomOutRight');
        MODEL.stars -= 1;
        setTimeout(() => lastStar.remove(), 500);
    },
    match(getId) {
        //animation for correct guess
        MODEL.state.map(card => {
            card.classList.toggle('flipInY');
            card.classList.toggle('rubberBand');
            card.classList.toggle('open');
            card.classList.toggle('match');
        });
        CONTROLLER.checkState(getId(MODEL.state[0]));
    },
    mismatch() {
        //animation for incorrect guess
        MODEL.state.map(card => {
            card.classList.add('deep-orange', 'lighten-2');
            setTimeout(() => card.classList.remove('deep-orange', 'lighten-2'), 500);
            card.classList.toggle('flipInY');
            card.classList.toggle('flip');
            card.classList.toggle('open');
            card.children[0].classList.toggle('hidden');
            card.addEventListener('click', VIEW.selectCard);
        });
    },
    popupWin(modal, fragment, header, h4, div) {
        //modal for winning
        const paragraph1 = document.createElement('p');
        const paragraph2 = document.createElement('p');
        const timeTaken = document.querySelector('time').textContent;
        const level = document.querySelector('.difficulty').textContent;
        let minutes = timeTaken.slice(0, timeTaken.indexOf(':'))[1];
        let seconds = timeTaken.slice(timeTaken.indexOf(':') + 1);
        switch(level) {
            case 'Easy':
                minutes = (minutes == '1')?'':'1 min. ';
                seconds = 60 - seconds;
                break;
            case 'Medium':
                minutes = '';
                seconds = 60 - seconds;
                break;
            case 'Hard':
                minutes = '';
                seconds = 45 - seconds;
                break;
        }
        h4.textContent = 'Congratulations! You Won!';
        header.appendChild(h4);
        div.innerHTML = '<div class="checkmark draw"></div>';
        div.classList.add('circle-loader');
        paragraph1.textContent = '... in ' + minutes
                            + ((seconds[0] == '0')?seconds[1]:seconds) + ' secs. '
                            +' with ' + MODEL.moves + ' moves and '
                            + MODEL.stars + ((MODEL.stars == 1)?' star.':' stars.');
        paragraph2.textContent = 'May the memory be with you!';
        fragment.appendChild(header);
        fragment.appendChild(paragraph1);
        fragment.appendChild(div);
        fragment.appendChild(paragraph2);
        modal.appendChild(fragment);
        setTimeout(() => {
            document.querySelector('.circle-loader').classList.add('load-complete');
            document.querySelector('.checkmark').setAttribute('style', 'display: block');
        }, 1000);
    },
    popupLose(modal, fragment, header, h4, div) {
        //modal for losing
        h4.textContent = 'Time\'s Up!';
        header.appendChild(h4);
        div.innerHTML = '<div class="hourglassBackground"><div class="hourglassContainer">'
                    + '<div class="hourglassCurves"></div>'
                    + '<div class="hourglassCapTop"></div>'
                    + '<div class="hourglassGlassTop"></div>'
                    + '<div class="hourglassSand"></div>'
                    + '<div class="hourglassSandStream"></div>'
                    + '<div class="hourglassCapBottom"></div>'
                    + '<div class="hourglassGlass"></div>'
                + '</div></div>';
        fragment.appendChild(header);
        fragment.appendChild(div);
        modal.appendChild(fragment);
    }
};

//CONTROLLER handles the gameplay
const CONTROLLER = {
    shuffle() {
        //shuffle the fruits randomly
        const fruitId = [];
        const counter = {};
        for(let key in MODEL.fruits)
            fruitId.push(parseInt(key.split('').reverse().join('')));
        for(let i=0; i<16; i++) {
            const id = fruitId[Math.floor(Math.random()*fruitId.length)];
            counter[id] = (counter[id] + 1) || 1;
            MODEL.locations[i] = id;
            if(counter[id] == 2) fruitId.splice(fruitId.indexOf(id), 1);
        }
    },
    setBoard(level) {
        //set the board for gameplay by adding a timer & event listeners
        const restart = document.getElementById('restart').children[0];
        const cards = VIEW.generateFruits();
        restart.addEventListener('click', CONTROLLER.restart);
        cards.map(card => card.addEventListener('click', VIEW.selectCard));
        MODEL.timer = (level == 'Easy')?121000:((level == 'Medium')?61000:46000);
        MODEL.locations = Array.from(new Set(MODEL.locations));
    },
    gameplay(card) {
        //checking for correctness of the two guesses
        const getId = item => item.children[0].getAttribute('alt');
        MODEL.state.push(card);
        if(MODEL.state.length == 2) {
            document.addEventListener('click', CONTROLLER.handler, true);
            setTimeout(() => {
                CONTROLLER.updateScore();
                if(getId(MODEL.state[0]) == getId(MODEL.state[1])) VIEW.match(getId);
                else VIEW.mismatch();
                MODEL.state.length = 0;
                document.removeEventListener('click', CONTROLLER.handler, true);
            }, 1000);
        }
    },
    handler(event) {
        //preventing all the click handlers from invoking
        event.stopPropagation();
        event.preventDefault();
    },
    updateScore() {
        //updates the number of moves
        MODEL.moves += 1;
        VIEW.updateMoves();
        switch(MODEL.moves) {
            case 11:
            case 15:
            case 19:
            case 23:
                VIEW.updateStars();
                break;
        }
    },
    checkState(id) {
        //checking for the completion of the game
        let count = MODEL.locations.length;
        MODEL.locations = MODEL.locations.map(item => (item == id)?undefined:item);
        MODEL.locations.forEach(item => {
            if(!item) count -= 1;
        });
        if(!count) setTimeout(() => exit('success'), 2000);
    },
    restart() {
        //resets the gameboard
        const difficultyButton = document.querySelector('.difficulty');
        window.open('index.html?level=' + difficultyButton.textContent, '_self');
    }
};

//invoking the welcome window
window.onload = () => {
    const playButton = document.querySelector('.play');
    const difficultyButton = document.querySelector('.difficulty');
    const difficultyLevel = ['Easy', 'Medium', 'Hard'];
    playButton.addEventListener('click', () =>  init(difficultyButton.textContent));
    difficultyButton.addEventListener('click', function() {
        this.textContent = difficultyLevel[difficultyLevel.indexOf(this.textContent) + 1] || difficultyLevel[0];
    });
    if(window.location.href.indexOf('?') > 0) {
        difficultyButton.textContent = window.location.href.slice(window.location.href.indexOf('=') + 1);
        init(difficultyButton.textContent);
    }
    else {
        const firstContainer = document.querySelector('.container');
        firstContainer.classList.remove('hide');
    }
};

//showing final popup message
function exit(result) {
    clearInterval(MODEL.timeInterval);
    const modal = document.querySelector('.message');
    const fragment = document.createDocumentFragment();
    const header = document.createElement('header');
    const h4 = document.createElement('h4');
    const div = document.createElement('div');
    const playAgain = document.querySelector('.play-again');
    const containers = document.querySelectorAll('.container');
    containers[1].classList.add('hide');
    containers[2].classList.remove('hide');
    (result == 'success')
        ?VIEW.popupWin(modal, fragment, header, h4, div)
        :VIEW.popupLose(modal, fragment, header, h4, div);
    playAgain.addEventListener('click', () => window.open('index.html', '_self'));
}