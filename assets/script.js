const mainEl = document.querySelector('main');
const startQuizButton = document.getElementById('startQuizButton');
const highScoresButton = document.getElementById('highScoresButton');

let quizRootEl;
let resultsRootEl;
let highScoresRootEl;

let questions;
let questionIndex = -1;
let questionPara;
let choicesList;
let timeRemaining;
let timeRemainingSpan;
const MAX_QUIZ_TIME = 10;
let countdownId;
let currentScore = 0;

let highScores;
let highScoresList;
const MAX_HIGH_SCORES_LENGTH = 10;

let scoreSpan;
let highScoreForm;
let nameInput;
let submitButton;

const PREV_QUESTION_RESULT_TIMER_MS = 1500;
const prevQuestionResult = {
    span: document.createElement('span'),
    setValue(val) {
        clearTimeout(this.timerId);
        if (val == true) {
            this.span.className = 'question-result-span question-result-correct';
            this.span.innerHTML = 'Correct &#x2713;';
            this.timerId = setTimeout(this.hideResult, PREV_QUESTION_RESULT_TIMER_MS);
        } else if (val == false) {
            this.span.className = 'question-result-span question-result-incorrect';
            this.span.innerHTML = 'Incorrect &#x2715;'
            this.timerId = setTimeout(this.hideResult, PREV_QUESTION_RESULT_TIMER_MS);
        } else {
            this.span.className = 'hidden';
        }
    },
    hideResult() {
        this.span.className = 'hidden';
    }
}
prevQuestionResult.hideResult = prevQuestionResult.hideResult.bind(prevQuestionResult);

startQuizButton.addEventListener('click', showQuiz);
highScoresButton.addEventListener('click', showHighScores);

function showQuiz() {
    if (!quizRootEl) {
        buildQuizRoot();
    }
    currentScore = 0;
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
    questionPara = document.createElement('p');
    choicesList = document.createElement('ol');
    const prevQuestionResultPara = document.createElement('p');
    prevQuestionResultPara.append(prevQuestionResult.span);
    const timeRemainingPara = document.createElement('p');
    if (!timeRemainingSpan) {
        timeRemainingSpan = document.createElement('span');
    }
    timeRemainingPara.append('Time Remaining: ', timeRemainingSpan);

    quizRootEl.append(questionHeader, questionPara, choicesList, prevQuestionResultPara, timeRemainingPara);
    quizRootEl.addEventListener('click', (event) => {
        event.preventDefault();
        if (event.target.matches('button')) {
            quizMakeChoice(event.target.dataset.index);
        }
    })
}

function buildChoicesList() {
    return questions[questionIndex].choices.map((choice, index) => {
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = choice;
        button.dataset.index = index;
        listItem.append(button);
        return listItem;
    });
}

function showNextQuestion(prevResult) {
    questionIndex = (questionIndex + 1) % questions.length;
    questionPara.textContent = questions[questionIndex].question;
    choicesList.replaceChildren(...buildChoicesList());
    prevQuestionResult.setValue(prevResult);
}

function quizMakeChoice(choice) {
    let result;
    if (choice == questions[questionIndex].answer) {
        result = true;
        currentScore++;
    } else {
        result = false;
    }
    showNextQuestion(result);
}

function updateTimeRemaining(val) {
    timeRemaining = val;
    timeRemainingSpan.textContent = timeRemaining;
}

function countdownTick() {
    updateTimeRemaining(timeRemaining - 1);
    if (timeRemaining <= 0) {
        clearInterval(countdownId);
        showResults();
    }
}

function showHighScores(highlightIndex) {
    // console.log('showing high scores');
    startQuizButton.classList.remove('hidden');
    highScoresButton.classList.add('hidden');
    if (!highScoresRootEl) {
        buildHighScoresRoot();
    }
    if (highlightIndex != undefined) {
        buildHighScoresList(highlightIndex);
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

function buildHighScoresList(highlightIndex) {
    if (!highScoresList) {
        highScoresList = document.createElement('ol');
    }
    const listItems = highScores.map(({ name, score }, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${name}: ${score}`;
        if (index === highlightIndex) {
            listItem.classList.add('highlighted');
        }
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
        if (score <= highScores[i].score) {
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
    return i;
}

function showResults() {
    if (!resultsRootEl) {
        buildResultsRoot();
    }
    scoreSpan.textContent = currentScore;
    const placement = findPlaceInHighScores(currentScore);
    console.log(`score: ${currentScore}, placement: ${placement}`);
    if (placement < MAX_HIGH_SCORES_LENGTH) {
        highScoreForm.classList.remove('hidden');
    } else {
        highScoreForm.classList.add('hidden');
        startQuizButton.classList.remove('hidden');
        highScoresButton.remove('hidden');
    }
    mainEl.replaceChildren(resultsRootEl);
}

function buildResultsRoot() {
    resultsRootEl = document.createElement('div');
    
    const resultsHeading = document.createElement('h2');
    resultsHeading.textContent = "Results";
    
    const scorePara = document.createElement('p');
    scoreSpan = document.createElement('span');
    scorePara.append('Your score: ', scoreSpan);

    highScoreForm = document.createElement('form');
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'nameInput');
    nameLabel.textContent = 'Your name:';
    nameInput = document.createElement('input');
    nameInput.setAttribute('id', 'nameInput');
    nameInput.setAttribute('required', true)
    nameInput.setAttribute('maxlength', 8);
    submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    highScoreForm.append(nameLabel, nameInput, submitButton);
    highScoreForm.addEventListener('submit', e => {
        e.preventDefault();
        const placement = addToHighScores(nameInput.value, currentScore);
        showHighScores(placement);
    });

    resultsRootEl.append(resultsHeading, scorePara, highScoreForm);
}

function loadQuestions() {
    if (questions) return;

    questions = [{
        question: 'What is the answer (a)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 0
    }, {
        question: 'What is the answer (b)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 1
    }, {
        question: 'What is the answer (c)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 2
    }, {
        question: 'What is the answer (d)?',
        choices: ['a', 'b', 'c', 'd'],
        answer: 3
    }]
}

loadQuestions();
loadHighScores();
showHighScores();