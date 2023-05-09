const mainEl = document.querySelector('main');
const startQuizButton = document.getElementById('startQuizButton');
startQuizButton.addEventListener('click', () => page.showQuiz());
const highScoresButton = document.getElementById('highScoresButton');
highScoresButton.addEventListener('click', () => page.showHighScores());


const MAX_QUIZ_TIME = 30;
const PREV_QUESTION_RESULT_TIMER_MS = 1500;
const MAX_HIGH_SCORES_LENGTH = 10;

/* Page navigation logic.
 * The app starts on high score (called at the bottom). */
const page = {
    // The high scores page can navigate to a new quiz
    showHighScores() {
        const root = highScores.initScreen();
        startQuizButton.classList.remove('hidden');
        highScoresButton.classList.add('hidden');
        mainEl.replaceChildren(root);
    },

    // The quiz auto-navigates to the results when the timer runs out
    showQuiz() {
        const root = quiz.initScreen();
        startQuizButton.classList.add('hidden');
        highScoresButton.classList.add('hidden');
        mainEl.replaceChildren(root);
    },

    /* The results screen has two possibilities:
     * If the user got a new high score, they are shown a form to enter their name, 
     * and it automatically navigates to the high scores upon submission.
     * If the user did not get a new high score, they can choose to navigate to either
     * the high scores page, or a new quiz */
    showResults() {
        const placement = highScores.findPlacement(quiz.currentScore);
        let showForm;
        if (placement != undefined) {
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

// The set of questions is global because it could be loaded from an external source
let questions;

// Quiz screen logic
const quiz = {
    questionIndex: -1,
    currentScore: 0,
    questionPara: document.createElement('p'),
    choicesList: document.createElement('ol'),

    initScreen() {
        this.currentScore = 0;

        if (!this.root) {
            /* Create the screen:
             * <h2>...
             * <p>The question
             * <ol>
             *   <li> x number of choices
             *     <button>Choice 1, etc.
             * <p>Feedback from the previous question
             * <p>Time Remaining: <span>
             */
            this.root = document.createElement('div');
            this.root.setAttribute('id', 'quizRoot');
            const questionHeader = document.createElement('h2');
            questionHeader.textContent = "Question:";
            const timeRemainingPara = document.createElement('p');
            timeRemainingPara.append('Time Remaining: ', this.timeRemaining.span);
        
            this.root.append(questionHeader, this.questionPara, this.choicesList, this.prevQuestionResult.para, timeRemainingPara);

            // respond to the user's choice of answers
            this.root.addEventListener('click', (event) => {
                event.preventDefault();
                if (event.target.matches('button')) {
                    this.makeChoice(event.target.dataset.index);
                }
            })

            // bind functions used in timeouts/intervals
            this.prevQuestionResult.hideResult = this.prevQuestionResult.hideResult.bind(this.prevQuestionResult);
            this.timeRemaining.countdownTick = this.timeRemaining.countdownTick.bind(this.timeRemaining);
        }

        this.showNextQuestion();
        this.timeRemaining.startCountdown();
        return this.root;
    },

    /* Build the list of choices for a question.
     * This is separate from initScreen() because it gets called for each showNextQuestion() */
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

    showNextQuestion() {
        this.questionIndex = (this.questionIndex + 1) % questions.length;
        this.questionPara.textContent = questions[this.questionIndex].question;
        this.buildChoicesList();
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
        this.showNextQuestion();
        this.prevQuestionResult.setValue(result);
    },

    // this encapsulates the logic around showing and hiding the result of answering a question
    prevQuestionResult: {
        para: document.createElement('p'),

        setValue(val) {
            // the user  could answer a question before the last result display has timed out
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
                // val = undefined
                this.para.className = 'hidden';
            }
        },

        hideResult() {
            this.para.className = 'hidden';
        }
    },

    // this object manages the countdown timer
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
                page.showResults(); // navigates to the results page automatically
            }

        },

        // If the user answers a question incorrectly, decrease time remaining
        applyPenalty(penalty = 2) {
            this.setCountdownSeconds(this.countdownSeconds - penalty);
        }
    }
}

// High scores screen logic
const highScores = {
    scores: [],
    scoresList: document.createElement('ol'),
    clearScoresButton: document.createElement('button'),

    initScreen() {
        if (!this.root) {
            /* Build the high scores screen:
             * <h2>
             * <ol>
             *   <li> x the number of high scores
             *     <span>(rank) <span>(name) <span>(score)
             * <button>Clear High Scores
             */
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

    /* Build the list of high scores.
     * This needs to be updated whenever the user makes a new high score (and that score should be highlighted).
     * The three spans are to fit the contents into a (css) grid.  This seems a little hackish--is there a better way? */
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

    // When the user finishes a quiz, search for their high scores ranking
    findPlacement(score) {
        let i;
        for (i = this.scores.length - 1; i >= 0; i--) {
            if (score <= this.scores[i].score) {
                break;
            }
        }
        // no ranking => undefined
        return i + 1 < MAX_HIGH_SCORES_LENGTH ? i + 1 : undefined;
    },

    // Given a user's name and score, add a new entry to the list
    addScore(name, score) {
        let i = this.findPlacement(score);
        if (i == undefined) {
            return;
        }

        this.scores = this.scores.slice(0, i).concat(
            { name, score },
            this.scores.slice(i, MAX_HIGH_SCORES_LENGTH - 1)
        );
        localStorage.setItem('quiz-game-high-scores', JSON.stringify(this.scores));

        // highlight the new entry
        this.buildScoresList(i);
    },

    clearScores() {
        this.scores = [];
        localStorage.setItem('quiz-game-high-scores', JSON.stringify(this.scores));
        this.buildScoresList();
    }
}
highScores.loadScores();  // should this be moved into highScores.initScreen?

// Results screen logic
const results = {
    scoreSpan: document.createElement('span'),
    highScoreForm: document.createElement('form'),
    nameInput: document.createElement('input'),
    submitButton: document.createElement('button'),

    initScreen(showForm) {
        if (!this.root) {
            /* Build the results screen:
             * <h2>
             * <p>Your score: <strong><span></strong>
             * <form>
             *   <div>
             *     <label>Your name:
             *     <input>
             *   <button>Submit
             */
            this.root = document.createElement('div');
            this.root.setAttribute('id', 'resultsRoot');
        
            const resultsHeading = document.createElement('h2');
            resultsHeading.textContent = "Results";
            
            const strong = document.createElement('strong');
            strong.append(this.scoreSpan);
            const scorePara = document.createElement('p');
            scorePara.append('Your score: ', strong);
            
            const nameDiv = document.createElement('div');
            nameDiv.setAttribute('id', 'nameGroup');
            const nameLabel = document.createElement('label');
            nameLabel.setAttribute('for', 'nameInput');
            nameLabel.textContent = 'Your name:';
            this.nameInput.setAttribute('id', 'nameInput');
            this.nameInput.setAttribute('required', true)
            this.nameInput.setAttribute('maxlength', 8);
            nameDiv.append(nameLabel, this.nameInput);
            
            this.submitButton.textContent = 'Submit';
            this.highScoreForm.append(nameDiv, this.submitButton);
            this.highScoreForm.addEventListener('submit', e => {
                e.preventDefault();
                highScores.addScore(this.nameInput.value, quiz.currentScore);
                page.showHighScores();
            });
        
            this.root.append(resultsHeading, scorePara, this.highScoreForm);
        }

        this.scoreSpan.textContent = quiz.currentScore;
        // if the user made a new high score, show the form, otherwise hide it
        if (showForm) {
            this.highScoreForm.classList.remove('hidden');
        } else {
            this.highScoreForm.classList.add('hidden');
        }

        return this.root;
    }
}

// Load the questions (possibly from an external source)
function loadQuestions() {
    if (questions) return;

    questions = [{
        question: 'In JavaScript, which characters are used to create an object literal?',
        choices: ['[ and ]', '{ and }', '( and )', '< and >'],
        answer: 1
    }, {
        question: 'In CSS Flexbox, which property controls the position and size of items on the cross axis?',
        choices: ['align-items', 'justify-items', 'justify-content', 'justify-self'],
        answer: 0
    }, {
        question: 'Which of the following is NOT a primitive datatype in JavaScript?',
        choices: ['number', 'string', 'boolean', 'smallint'],
        answer: 3
    }, {
        question: 'In CSS, what does the "+" combinator match?',
        choices: ['Any descendant', 'Direct descendants', 'Next sibling', 'Any sibling'],
        answer: 2
    }, {
        question: 'In the CSS box model, where is the padding located?',
        choices: ['The innermost section', 'The second to innermost section', 'The second to outermost section', 'The outermost section'],
        answer: 1
    }, {
        question: 'In JavaScript, how does the logical || operator work?',
        choices: [
            'It returns true only if both its operands are true',
            'It returns true if either of its operands is true',
            'It returns true if one of its operands is true, but not both',
            'It negates its operands'
        ],
        answer: 1
    }, {
        question: 'In CSS, which of the following pseudo-classes does NOT apply to links?',
        choices: [':hover', ':focus', ':active', ':valid'],
        answer: 3
    }]
}

loadQuestions();
page.showHighScores();