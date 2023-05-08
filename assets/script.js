const mainEl = document.querySelector('main');
const startQuizButton = document.getElementById('startQuizButton');
startQuizButton.addEventListener('click', () => page.showQuiz());
const highScoresButton = document.getElementById('highScoresButton');
highScoresButton.addEventListener('click', () => page.showHighScores());


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
    },

    showResults() {
        const placement = highScores.findPlacement(quiz.currentScore);
        let showForm;
        if (placement < MAX_HIGH_SCORES_LENGTH) {
            showForm = true;
        } else {
            showForm = false;
            startQuizButton.classList.remove('hidden');
            highScoresButton.classList.remove('hidden');
        }
        const root = results.initScreen(showForm);
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
            this.root.setAttribute('id', 'quizRoot');
            const questionHeader = document.createElement('h2');
            questionHeader.textContent = "Question:";
            const timeRemainingPara = document.createElement('p');
            timeRemainingPara.append('Time Remaining: ', this.timeRemaining.span);
        
            this.root.append(questionHeader, this.questionPara, this.choicesList, this.prevQuestionResult.para, timeRemainingPara);
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
        para: document.createElement('p'),

        setValue(val) {
            clearTimeout(this.timerId);
            if (val == true) {
                this.para.className = 'question-result question-result-correct';
                this.para.innerHTML = 'Correct &#x2713;';
                this.timerId = setTimeout(this.hideResult, PREV_QUESTION_RESULT_TIMER_MS);
            } else if (val == false) {
                this.para.className = 'question-result question-result-incorrect';
                this.para.innerHTML = 'Incorrect &#x2715;'
                this.timerId = setTimeout(this.hideResult, PREV_QUESTION_RESULT_TIMER_MS);
            } else {
                this.para.className = 'hidden';
            }
        },

        hideResult() {
            this.para.className = 'hidden';
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
        },

        setCountdownSeconds(val) {
            this.countdownSeconds = val;
            this.span.textContent = val;

            if (this.countdownSeconds <= 0) {
                clearInterval(this.countdownId);
                page.showResults();
            }

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
            this.root.setAttribute('id', 'highScoresRoot');
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
            const numberSpan = document.createElement('span');
            numberSpan.textContent = index + 1;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = score;
            listItem.append(numberSpan, nameSpan, scoreSpan);
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

const results = {
    scoreSpan: document.createElement('span'),
    highScoreForm: document.createElement('form'),
    nameInput: document.createElement('input'),
    submitButton: document.createElement('button'),

    initScreen(showForm) {
        if (!this.root) {
            this.root = document.createElement('div');
            this.root.setAttribute('id', 'resultsRoot');
        
            const resultsHeading = document.createElement('h2');
            resultsHeading.textContent = "Results";
            
            const scorePara = document.createElement('p');
            scorePara.append('Your score: ', this.scoreSpan);
            
            const nameLabel = document.createElement('label');
            nameLabel.setAttribute('for', 'nameInput');
            nameLabel.textContent = 'Your name:';
            
            this.nameInput.setAttribute('id', 'nameInput');
            this.nameInput.setAttribute('required', true)
            this.nameInput.setAttribute('maxlength', 8);
            
            this.submitButton.textContent = 'Submit';
            this.highScoreForm.append(nameLabel, this.nameInput, this.submitButton);
            this.highScoreForm.addEventListener('submit', e => {
                e.preventDefault();
                highScores.addScore(this.nameInput.value, quiz.currentScore);
                page.showHighScores();
            });
        
            this.root.append(resultsHeading, scorePara, this.highScoreForm);
        }

        this.scoreSpan.textContent = quiz.currentScore;
        if (showForm) {
            this.highScoreForm.classList.remove('hidden');
        } else {
            this.highScoreForm.classList.add('hidden');
        }

        return this.root;
    }
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