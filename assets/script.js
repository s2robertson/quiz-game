const mainEl = document.querySelector('main');
const startQuizButton = document.getElementById('startQuizButton');
const highScoresButton = document.getElementById('highScoresButton');

let quizRootEl;
let resultsRootEl;
let highScoresRootEl;

let questions;
let questionEl;
let questionIndex = -1;
let timeRemaining;
let timeRemainingSpan;
const MAX_QUIZ_TIME = 10;
let countdownId;

let highScores;
let highScoresList;
const MAX_HIGH_SCORES_LENGTH = 10;

let currentScore = 0;

startQuizButton.addEventListener('click', showQuiz);
highScoresButton.addEventListener('click', showHighScores);

function showQuiz() {
    if (!quizRootEl) {
        buildQuizRoot();
    }
    showNextQuestion();
    startQuizButton.classList.add('hidden');
    highScoresButton.classList.add('hidden');
    updateTimeRemaining(MAX_QUIZ_TIME);
    countdownId = setInterval(countdownTick, 1000);
    mainEl.replaceChildren(quizRootEl);
}

function buildQuizRoot() {
    quizRootEl = document.createElement('div');
    const questionHeader = document.createElement('h2');
    questionHeader.textContent = "Question:";
    const questionPara = document.createElement('p');
    const choicesList = document.createElement('ol');
    for (let i = 0; i < 4; i++) {
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        listItem.append(button);
        choicesList.append(listItem);
    }
    const timeRemainingPara = document.createElement('p');
    if (!timeRemainingSpan) {
        timeRemainingSpan = document.createElement('span');
    }
    timeRemainingPara.append('Time Remaining: ', timeRemainingSpan);

    quizRootEl.append(questionHeader, questionPara, choicesList, timeRemainingPara);
    quizRootEl.addEventListener('click', (event) => {
        event.preventDefault();
        if (event.target.matches('button')) {
            quizMakeChoice(event.target.dataset.value);
        }
    })
}

function showNextQuestion() {
    questionIndex = (questionIndex + 1) % questions.length;
    /* div 
     *   h2
     *   p
     *   ol 
     *     li x4 */
    quizRootEl.children[1].textContent = questions[questionIndex].question;
    let listItems = quizRootEl.children[2].children;
    for (let i = 0; i < 4; i++) {
        /* li
         *   button */
        let button = listItems[i].children[0];
        button.textContent = questions[questionIndex].choices[i];
        button.dataset.value = questions[questionIndex].choices[i];
    }
}

function quizMakeChoice(choice) {
    if (choice === questions[questionIndex].answer) {
        currentScore++;
    }
    showNextQuestion();
}

function updateTimeRemaining(val) {
    timeRemaining = val;
    timeRemainingSpan.textContent = timeRemaining;
}

function countdownTick() {
    updateTimeRemaining(timeRemaining - 1);
    if (timeRemaining <= 0) {
        clearInterval(countdownId);
        // show results
    }
}

function showHighScores(highlightIndex) {
    // console.log('showing high scores');
    startQuizButton.classList.remove('hidden');
    highScoresButton.classList.add('hidden');
    if (!highScoresRootEl) {
        buildHighScoresRoot();
    }
    mainEl.replaceChildren(highScoresRootEl);
}

function buildHighScoresRoot() {
    // console.log('building high scores');
    highScoresRootEl = document.createElement('div');
    const subheading = document.createElement('h2');
    subheading.textContent = 'High Scores';
    
    if (!highScores) {
        loadHighScores();
    }
    buildHighScoresList();
    highScoresRootEl.append(subheading, highScoresList);
}

function buildHighScoresList() {
    if (!highScoresList) {
        highScoresList = document.createElement('ol');
    }
    const listItems = highScores.map(({ name, score }) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${name}: ${score}`;
        return listItem;
    });
    highScoresList.replaceChildren(...listItems);;
}

function loadHighScores() {
    if (highScores) return;

    highScores = JSON.parse(localStorage.getItem('quiz-game-high-scores'));
    if (!highScores) {
        highScores = [];
    }
}

function findPlaceInHighScores(score) {
    let i;
    for (i = highScores.length - 1; i >= 0; i--) {
        if (score >= highScores[i].score) {
            break;
        }
    }
    return i + 1;
}

function addToHighScores(name, score) {
    let i = findPlaceInHighScores(score);
    if (i < MAX_HIGH_SCORES_LENGTH) {
        highScores = highScores.slice(0, i).concat(
            { name, score },
            highScores.slice(i, MAX_HIGH_SCORES_LENGTH - 1)
        );
    }
    localStorage.setItem('quiz-game-high-scores', JSON.stringify(highScores));
}

function loadQuestions() {
    if (questions) return;

    questions = [{
        question: 'What is the answer (a)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 'a'
    }, {
        question: 'What is the answer (b)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 'b'
    }, {
        question: 'What is the answer (c)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 'c'
    }, {
        question: 'What is the answer (d)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 'd'
    }]
}

loadQuestions();
loadHighScores();
showHighScores();