# Quiz Game

## Description
This quiz game app was created to explore DOM manipulation in (vanilla) JavaScript.  It has three
screens it transitions through: high scores, quiz questions, and quiz results.  The high scores
screen displays the top 10 high scores, which are stored in localStorage.  If the user gets a new
high score, the most recent score will be highlighted.  There is also an option to reset the scores.
The quiz questions screen displays a question, and a selection of choices.  The quiz is timed (20
seconds by default), and choosing an incorrect answer will apply a two second penalty to the timer.
When time runs out, the quiz result is displayed, with a form for the user to enter their name if
they got a high score.  A possible next step could be to allow the user to configure the quiz timer
and incorrect answer penalty.

Presently, the list of questions is limited, but if one wished to expand it (e.g. by fetching
questions from a third-party API), it could be done by modifying `loadQuestions()` at the bottom
of `assets/script.js`.

## Usage
[See the quiz game live.](https://s2robertson.github.io/quiz-game/)

## Credits
[Fisher-Yates Shuffle](https://en.wikipedia.org/w/index.php?title=Fisher%E2%80%93Yates_shuffle&oldid=1152201110). (2023, May 9). In Wikipedia

## License
MIT

## Screenshot
![A screenshot of the quiz game](/Quiz-Game-Screenshot.png)