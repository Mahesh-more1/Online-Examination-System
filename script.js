// Online Examination System - Complete JavaScript

// DOM Elements
const startScreen = document.getElementById("start-screen");
const examContainer = document.getElementById("exam-container");
const startExamBtn = document.getElementById("start-exam-btn");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionNumber = document.getElementById("question-number");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const markBtn = document.getElementById("mark-btn");
const submitBtn = document.getElementById("submit-btn");
const questionNavButtons = document.getElementById("question-nav-buttons");
const timerElement = document.getElementById("timer");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const resultModal = document.getElementById("result-modal");
const closeModal = document.getElementById("close-modal");
const correctAnswersElement = document.getElementById("correct-answers");
const incorrectAnswersElement = document.getElementById("incorrect-answers");
const unansweredElement = document.getElementById("unanswered");
const scoreElement = document.getElementById("score");

// Exam State
let examData = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let markedQuestions = [];
let timeLeft = 90 * 60; // 90 minutes in seconds
let timerInterval;
let examStarted = false;

// Initialize the application
async function initApp() {
  await loadExamData();
  setupEventListeners();

  // If you want to start immediately without start screen:
  // startExam();
}

// Load exam data from JSON file
async function loadExamData() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) {
      throw new Error("Failed to load questions");
    }
    examData = await response.json();

    // Initialize user answers and marked questions arrays
    userAnswers = new Array(examData.length).fill(null);
    markedQuestions = new Array(examData.length).fill(false);

    console.log("Totla Questions loaded:", examData.length);
    // Generate sample questions if needed (for testing)
    if (examData.length < 100) {
      for (let i = examData.length; i < 100; i++) {
        examData.push({
          question: `Sample question ${i + 1}?`,
          image:
            i % 10 === 0
              ? `images/sample${Math.floor(Math.random() * 3) + 1}.jpg`
              : null,
          choices: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: `Option ${
            ["A", "B", "C", "D"][Math.floor(Math.random() * 4)]
          }`,
        });
      }
    }
  } catch (error) {
    console.error("Error loading exam data:", error);
    alert("Failed to load exam questions. Please try again later.");
  }
}

// Set up event listeners
function setupEventListeners() {
  startExamBtn.addEventListener("click", startExam);
  prevBtn.addEventListener("click", showPreviousQuestion);
  nextBtn.addEventListener("click", showNextQuestion);
  markBtn.addEventListener("click", toggleMarkQuestion);
  submitBtn.addEventListener("click", confirmSubmitExam);
  closeModal.addEventListener("click", closeResultModal);

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!examStarted) return;

    if (e.key === "ArrowLeft") {
      showPreviousQuestion();
    } else if (e.key === "ArrowRight") {
      showNextQuestion();
    } else if (e.key === "m" || e.key === "M") {
      toggleMarkQuestion();
    }
  });
}

// Start the exam
function startExam() {
  examStarted = true;
  startScreen.style.display = "none";
  examContainer.style.display = "block";

  // Create navigation buttons
  createNavigationButtons();

  // Start timer
  startTimer();

  // Load first question
  loadQuestion(currentQuestionIndex);

  // Update progress
  updateProgress();
}

// Create question navigation buttons
function createNavigationButtons() {
  questionNavButtons.innerHTML = "";
  examData.forEach((_, index) => {
    const button = document.createElement("button");
    button.className = "nav-btn";
    button.textContent = index + 1;
    button.addEventListener("click", () => navigateToQuestion(index));
    questionNavButtons.appendChild(button);
  });
}

// Load a question
function loadQuestion(index) {
  if (index < 0 || index >= examData.length) return;

  currentQuestionIndex = index;
  const question = examData[index];

  // Update question number and text
  questionNumber.textContent = `Question ${index + 1}`;

  // Clear previous question content
  questionText.innerHTML = "";

  // Add question text
  const questionTextNode = document.createElement("p");
  questionTextNode.textContent = question.question;
  questionText.appendChild(questionTextNode);

  // Add image if it exists
  if (question.image) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "question-image-container";

    const img = document.createElement("img");
    img.src = question.image;
    img.alt = "Question image";
    img.className = "question-image";
    img.onerror = () => {
      imgContainer.innerHTML =
        '<p class="image-error">[Image failed to load]</p>';
    };

    imgContainer.appendChild(img);
    questionText.appendChild(imgContainer);
  }

  // Clear previous options
  optionsContainer.innerHTML = "";

  // Create new options
  question.choices.forEach((choice, choiceIndex) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";
    optionDiv.addEventListener('click', () => {
        // Find the radio input within this div and check it
        const radioInput = optionDiv.querySelector('input[type="radio"]');
        if (radioInput) {
            radioInput.checked = true;
            userAnswers[index] = choice;
            updateNavButton(index);
            updateProgress();
        }
    });
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "answer";
    radio.id = `option-${index}-${choiceIndex}`;
    radio.value = choice;
    radio.checked = userAnswers[index] === choice;
    console.log("Checked:", radio.checked);
    const label = document.createElement("label");
    label.htmlFor = `option-${index}-${choiceIndex}`;

    // Add option label (A, B, C, D)
    const optionLabel = document.createElement("span");
    optionLabel.className = "option-label";
    optionLabel.textContent = `${String.fromCharCode(65 + choiceIndex)}. `;

    label.appendChild(optionLabel);
    label.appendChild(document.createTextNode(choice));

    optionDiv.appendChild(radio);
    optionDiv.appendChild(label);

    // Add event listener to save answer when selected
    radio.addEventListener("change", () => {
      userAnswers[index] = choice;
      updateNavButton(index);
      updateProgress();
    });

    optionsContainer.appendChild(optionDiv);
  });

  // Update button states
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === examData.length - 1;

  // Update mark button
  updateMarkButton();

  // Update nav button style
  updateNavButton(index);

  // Scroll to top of question container
  document.querySelector(".question-container").scrollTop = 0;
}

// Update mark button state
function updateMarkButton() {
  markBtn.textContent = markedQuestions[currentQuestionIndex]
    ? "Unmark Question"
    : "Mark for Review";
  markBtn.className = markedQuestions[currentQuestionIndex]
    ? "btn mark-btn marked"
    : "btn mark-btn";
}

// Update navigation button style
function updateNavButton(index) {
  const navButton = questionNavButtons.children[index];
  navButton.classList.remove("answered", "marked");

  if (userAnswers[index] !== null) {
    navButton.classList.add("answered");
  } else if (markedQuestions[index]) {
    navButton.classList.add("marked");
  }
}

// Navigation functions
function navigateToQuestion(index) {
  loadQuestion(index);
}

function showPreviousQuestion() {
  if (currentQuestionIndex > 0) {
    loadQuestion(currentQuestionIndex - 1);
  }
}

function showNextQuestion() {
  if (currentQuestionIndex < examData.length - 1) {
    loadQuestion(currentQuestionIndex + 1);
  }
}

function toggleMarkQuestion() {
  markedQuestions[currentQuestionIndex] =
    !markedQuestions[currentQuestionIndex];
  updateMarkButton();
  updateNavButton(currentQuestionIndex);
}

// Timer functions
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // Change color when time is running out
  if (timeLeft <= 300) {
    // 5 minutes
    timerElement.style.color = "#e74c3c";
  }
}

// Progress tracking
function updateProgress() {
  const answeredCount = userAnswers.filter((answer) => answer !== null).length;
  const progressPercentage = (answeredCount / examData.length) * 100;

  progressBar.style.width = `${progressPercentage}%`;
  progressText.textContent = `${answeredCount}/${examData.length}`;
}

// Exam submission
function confirmSubmitExam() {
  if (confirm("Are you sure you want to submit the exam?")) {
    submitExam();
  }
}

function submitExam() {
  clearInterval(timerInterval);
  examStarted = false;

  // Calculate results
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  examData.forEach((question, index) => {
    if (userAnswers[index] === null) {
      unanswered++;
    } else if (userAnswers[index] === question.correctAnswer) {
      correct++;
    } else {
      incorrect++;
    }
  });

  // Display results
  // Calculate score with negative marking (1/3 deduction per wrong answer)
  const score = correct - incorrect * (1 / 3);
  const normalizedScore = Math.max(0, score); // Ensure score doesn't go below 0
  const percentageScore = (normalizedScore / examData.length) * 100;

  // Display results
  correctAnswersElement.textContent = correct;
  incorrectAnswersElement.textContent = incorrect;
  unansweredElement.textContent = unanswered;
  scoreElement.textContent = percentageScore.toFixed(2); // Show score with 2 decimal places
  resultModal.style.display = "flex";
}

function closeResultModal() {
  resultModal.style.display = "none";
}

// Initialize the application when the page loads
window.addEventListener("DOMContentLoaded", initApp);
