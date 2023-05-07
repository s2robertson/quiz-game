const mainEl = document.querySelector('main');
const startQuizButton = document.getElementById('startQuizButton');
const highScoresButton = document.getElementById('highScoresButton');

let resultsRootEl;

const MAX_QUIZ_TIME = 10;
const PREV_QUESTION_RESULT_TIMER_MS = 1500;
const MAX_HIGH_SCORES_LENGTH = 10;

const page = {
    showHighScores() {
        const root = highScores.initScreen();
        startQuizButton.classList.remove('hidden');
        highScoresButton.classList.add('hidden');
        mainEl.replaceChildren(root);
    },

    showQuiz() {
        const root = quiz.initScreen();
        startQuizButton.classList.add('hidden');
        highScoresButton.classList.add('hidden');
        mainEl.replaceChildren(root);
    }
}

let questions;
const quiz = {
    questionIndex: -1,
    currentScore: 0,
    questionPara: document.createElement('p'),
    choicesList: document.createElement('ol'),

    initScreen() {
        this.currentScore = 0;

        if (!this.root) {
            this.root = document.createElement('div');
            const questionHeader = document.createElement('h2');
            questionHeader.textContent = "Question:";
            const prevQuestionResultPara = document.createElement('p');
            prevQuestionResultPara.append(this.prevQuestionResult.span);
            const timeRemainingPara = document.createElement('p');
            timeRemainingPara.append('Time Remaining: ', this.timeRemaining.span);
        
            this.root.append(questionHeader, this.questionPara, this.choicesList, prevQuestionResultPara, timeRemainingPara);
            this.root.addEventListener('click', (event) => {
                event.preventDefault();
                if (event.target.matches('button')) {
                    this.makeChoice(event.target.dataset.index);
                }
            })

            this.prevQuestionResult.hideResult = this.prevQuestionResult.hideResult.bind(this.prevQuestionResult);
            this.timeRemaining.countdownTick = this.timeRemaining.countdownTick.bind(this.timeRemaining);
        }
        this.showNextQuestion();
        this.timeRemaining.startCountdown();
        return this.root;
    },

    buildChoicesList() {
        let result = questions[this.questionIndex].choices.map((choice, index) => {
            const listItem = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = choice;
            button.dataset.index = index;
            listItem.append(button);
            return listItem;
        });
        this.choicesList.replaceChildren(...result);
    },

    showNextQuestion(prevResult) {
        this.questionIndex = (this.questionIndex + 1) % questions.length;
        this.questionPara.textContent = questions[this.questionIndex].question;
        this.buildChoicesList();
        this.prevQuestionResult.setValue(prevResult);
    },

    makeChoice(choice) {
        let result;
        if (choice == questions[this.questionIndex].answer) {
            result = true;
            this.currentScore++;
        } else {
            result = false;
            this.timeRemaining.applyPenalty();
        }
        this.showNextQuestion(result);
    },

    prevQuestionResult: {
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
    },

    timeRemaining: {
        span: document.createElement('span'),

        startCountdown() {
            this.setCountdownSeconds(MAX_QUIZ_TIME);
            this.countdownId = setInterval(this.countdownTick, 1000);
        },

        countdownTick() {
            this.setCountdownSeconds(this.countdownSeconds - 1);
            if (this.countdownSeconds <= 0) {
                clearInterval(this.countdownId);
                showResults();
            }
        },

        setCountdownSeconds(val) {
            this.countdownSeconds = val;
            this.span.textContent = val;
        },

        applyPenalty(penalty = 2) {
            this.setCountdownSeconds(this.countdownSeconds - penalty);
        }


    }
}

const highScores = {
    scores: [],
    scoresList: document.createElement('ol'),
    clearScoresButton: document.createElement('button'),

    initScreen() {
        if (!this.root) {
            this.root = document.createElement('div');
            const subheading = document.createElement('h2');
            subheading.textContent = 'High Scores';
            
            this.buildScoresList();
            this.clearScoresButton.textContent = 'Clear High Scores';
            this.clearScoresButton.addEventListener('click', () => this.clearScores());
            this.root.append(subheading, this.scoresList, this.clearScoresButton);
        }
        return this.root;
    },

    buildScoresList(highlightIndex) {
        const listItems = this.scores.map(({ name, score }, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${name}: ${score}`;
            if (index === highlightIndex) {
                listItem.classList.add('highlighted');
            }
            return listItem;
        });
        this.scoresList.replaceChildren(...listItems);;
    },

    loadScores() {
        this.scores = JSON.parse(localStorage.getItem('quiz-game-high-scores'));
        if (!this.scores) {
            this.scores = [];
        }
    },

    findPlacement(score) {
        let i;
        for (i = this.scores.length - 1; i >= 0; i--) {
            if (score <= this.scores[i].score) {
                break;
            }
        }
        return i + 1;
    },

    addScore(name, score) {
        let i = this.findPlacement(score);
        if (i >= MAX_HIGH_SCORES_LENGTH) {
            return;
        }

        this.scores = this.scores.slice(0, i).concat(
            { name, score },
            this.scores.slice(i, MAX_HIGH_SCORES_LENGTH - 1)
        );
        localStorage.setItem('quiz-game-high-scores', JSON.stringify(this.scores));
        this.buildScoresList(i);
    },

    clearScores() {
        this.scores = [];
        localStorage.setItem('quiz-game-high-scores', JSON.stringify(this.scores));
        this.buildScoresList();
    }
}
highScores.loadScores();

let scoreSpan;
let highScoreForm;
let nameInput;
let submitButton;

startQuizButton.addEventListener('click', () => page.showQuiz());
highScoresButton.addEventListener('click', () => page.showHighScores());

function showResults() {
    const currentScore = quiz.currentScore;
    if (!resultsRootEl) {
        buildResultsRoot();
    }
    scoreSpan.textContent = currentScore;
    const placement = highScores.findPlacement(currentScore);
    // console.log(`score: ${currentScore}, placement: ${placement}`);
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
        highScores.addScore(nameInput.value, quiz.currentScore);
        page.showHighScores();
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
page.showHighScores();