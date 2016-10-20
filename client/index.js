/*
  TODO: delete this comment

  This file is where you bootstrap your JS code
  For example import stuff here:

  import {select} from 'd3-selection';
  import myComponent from './components/my-component';

  Split logical parts of you project into components e.g.

  /client
    - /components
        - /component-name
            - styles.scss
            - index.js
            - template.html

*/

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import QuizQuestion from './components/quiz-question';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { questions: JSON.parse(document.getElementById('data').textContent) };
  }

  render() {
    const quizQuestions = this.state.questions.map((question, i) =>
      <QuizQuestion key={question.id} questionNumber={i + 1} question={question.question} />
    );

    // if (!quizQuestions) {
    //   return <div>Loading…</div>;
    // }

    return (
      <div>
        <h1>Quiz app</h1>
        <p>This quiz has {quizQuestions.length} questions.</p>
        {quizQuestions}
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.querySelector('#react-container')
);
