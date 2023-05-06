const mainEl = document.querySelector('main');
const startRootEl = document.getElementById('startRoot');

let quizRootEl;
let resultsRootEl;
let highScoresRootEl;

let questions;
let questionIndex = -1;

let currentScore = 0;

// start quiz button
document.querySelector('#startRoot button').addEventListener('click', () => {
    showQuiz();
});

function showQuiz() {
    if (!quizRootEl) {
        buildQuizRoot();
    }
    if (!questions) {
        loadQuestions();
    }
    showNextQuestion();
    mainEl.replaceChildren(quizRootEl);
}

function buildQuizRoot() {
    quizRootEl = document.createElement('div');
    const questionHeader = document.createElement('h2');
    quizRootEl.append(questionHeader);
    const choicesList = document.createElement('ol');
    for (let i = 0; i < 4; i++) {
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        listItem.append(button);
        choicesList.append(listItem);
    }
    quizRootEl.append(choicesList);

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
     *   ol 
     *     li x4 */
    quizRootEl.children[0].textContent = questions[questionIndex].question;
    let listItems = quizRootEl.children[1].children;
    for (let i = 0; i < 4; i++) {
        /* li
         *   button */
        let button = listItems[i].children[0]
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

function loadQuestions() {
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