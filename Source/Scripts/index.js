const firebaseConfig = {
    apiKey: "AIzaSyD6KgpiYs5kOh8cBk9l86AEwROfkZwYInA",
    authDomain: "numb-2099e.firebaseapp.com",
    projectId: "numb-2099e",
    storageBucket: "numb-2099e.firebasestorage.app",
    messagingSenderId: "396460932900",
    appId: "1:396460932900:web:5fd651b3e96573cb6afdb1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

const modes = {
    normal: { time: 30, maxWrong: 5, correctTime: 4, wrongTime: -5, correctScore: 10, wrongScore: -15 },
    marathon: { time: 60, maxWrong: 10, correctTime: 5, wrongTime: -5, correctScore: 10, wrongScore: -10 }
};

function updateModeDetails() {
    const mode = document.getElementById('mode-select').value;
    const modeData = modes[mode];
    document.getElementById('mode-details').innerHTML = `
    <p><i class="ph ph-clock"></i> Time: ${modeData.time}s | Max Wrong: ${modeData.maxWrong}</p>
    <p><i class="ph ph-check-circle"></i> Correct: +${modeData.correctScore} score, +${modeData.correctTime}s</p>
    <p><i class="ph ph-x-circle"></i> Wrong: ${modeData.wrongScore} score, ${modeData.wrongTime}s</p>
  `;
}

async function loadLeaderboard(mode) {
    const users = (await db.collection('users').get())
        .docs
        .filter(doc => doc.data()[`${mode}Score`] > 0)
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b[`${mode}Score`] - a[`${mode}Score`] || a[`${mode}Time`] - b[`${mode}Time`])
        .slice(0, 4);

    const leaderboard = document.querySelector(`#page_home .list-group-${mode}`);
    leaderboard.innerHTML = users.map((user, i) => `
    <div class="list-group-item d-flex align-items-center justify-content-between gap-6 border-0 py-2">
      <div class="d-flex align-items-center gap-3">
        <div class="icon icon-shape rounded flex-none text-bg-light">
          <i class="ph ph-${i === 0 ? 'crown-simple' : i === 1 ? 'trophy' : i === 2 ? 'medal' : 'exam'} text-lg"></i>
        </div>
        <div>
          <span class="d-block text-heading text-sm fw-semibold">${user.displayName}</span>
          <span class="d-none d-sm-block text-muted text-xs">@${user.username}</span>
        </div>
      </div>
      <div class="text-end">
        <span class="d-block text-heading text-sm fw-bold">SCORED ${user[`${mode}Score`].toString().padStart(3, '0')}</span>
        <span class="d-block text-muted text-xs">TIMED ${formatTime(user[`${mode}Time`])}</span>
      </div>
    </div>
  `).join('');
}

const toggleForms = () => {
    document.getElementById('login').classList.toggle('d-none');
    document.getElementById('create').classList.toggle('d-none');
};

const handleForm = async (e, isLogin) => {
    e.preventDefault();
    const [email, password, username, displayName] = [
        e.target.querySelector(isLogin ? '#loginemail' : '#createemail').value,
        e.target.querySelector(isLogin ? '#loginpassword' : '#createpassword').value,
        !isLogin && e.target.querySelector('#username').value,
        !isLogin && e.target.querySelector('#display').value
    ];

    try {
        if (isLogin) {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            if (!(await db.collection('users').where('username', '==', username).get()).empty) {
                return alert('Username already taken');
            }
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').doc(user.uid).set({
                username,
                displayName,
                email,
                normalScore: 0, normalTime: 0,
                marathonScore: 0, marathonTime: 0
            });
        }
        showHome();
    } catch (error) {
        alert(error.message);
    }
};

const updateSettings = async e => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const [newUsername, newDisplayName] = [
        e.target.querySelector('#changeusername').value,
        e.target.querySelector('#changedisplay').value
    ];

    try {
        const usernameQuery = await db.collection('users').where('username', '==', newUsername).get();
        if (!usernameQuery.empty && usernameQuery.docs[0].id !== user.uid) {
            return alert('Username already taken');
        }
        await db.collection('users').doc(user.uid).update({ username: newUsername, displayName: newDisplayName });
        alert('Settings updated');
    } catch (error) {
        alert(error.message);
    }
};

const showPage = (page) => {
    ['page_auth', 'page_home', 'page_play', 'page_lebo', 'page_user', 'page_game'].forEach(id =>
        document.getElementById(id).classList.toggle('d-none', id !== page)
    );
};

const showHome = () => {
    showPage('page_home');
};

const showPlay = () => {
    showPage('page_play');
    updateModeDetails();
};

const showLeaderboard = async () => {
    showPage('page_lebo');
    await Promise.all([
        loadLeaderboard('normal'),
        loadLeaderboard('marathon')
    ]);
};

const showSettings = async () => {
    showPage('page_user');
    const user = auth.currentUser;
    if (user) {
        const doc = await db.collection('users').doc(user.uid).get();
        const { username, displayName } = doc.data();
        document.getElementById('changeusername').value = username;
        document.getElementById('changedisplay').value = displayName;
    }
};

async function loadLeaderboard(mode) {
    const users = (await db.collection('users').get())
        .docs
        .filter(doc => doc.data()[`${mode}Score`] > 0)
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b[`${mode}Score`] - a[`${mode}Score`] || a[`${mode}Time`] - b[`${mode}Time`])
        .slice(0, 4);

    const leaderboard = document.querySelector(`#page_lebo .list-group-${mode}`);
    leaderboard.innerHTML = users.map((user, i) => `
        <div class="list-group-item d-flex align-items-center justify-content-between gap-6 border-0 py-2">
          <div class="d-flex align-items-center gap-3">
            <div class="icon icon-shape rounded flex-none text-bg-light">
              <i class="ph ph-${i === 0 ? 'crown-simple' : i === 1 ? 'trophy' : i === 2 ? 'medal' : 'exam'} text-lg"></i>
            </div>
            <div>
              <span class="d-block text-heading text-sm fw-semibold">${user.displayName}</span>
              <span class="d-none d-sm-block text-muted text-xs">@${user.username}</span>
            </div>
          </div>
          <div class="text-end">
            <span class="d-block text-heading text-sm fw-bold">SCORED ${user[`${mode}Score`].toString().padStart(3, '0')}</span>
            <span class="d-block text-muted text-xs">TIMED ${formatTime(user[`${mode}Time`])}</span>
          </div>
        </div>
    `).join('');
}

const showAuth = () => showPage('page_auth');

auth.onAuthStateChanged(user => user ? showHome() : showAuth());

const elements = {
    score: document.getElementById("score"),
    time: document.getElementById("time-remaining"),
    progress: document.querySelector(".progress-bar"),
    question: document.getElementById("question"),
    answer: document.getElementById("answer"),
    numbers: document.querySelectorAll(".btn-outline-dark[value]"),
    backspace: document.getElementById("backspace"),
    submit: document.getElementById("submit")
};

let gameState = { timeLeft: 30, score: 0, totalTime: 0, correctAnswer: 0, wrongAnswers: 0, timer: null, mode: 'normal' };

const updateDisplay = () => {
    elements.score.textContent = gameState.score.toString().padStart(3, "0");
    elements.time.textContent = formatTime(gameState.timeLeft);
    elements.progress.style.width = `${Math.min((gameState.timeLeft / modes[gameState.mode].time) * 100, 100)}%`;
    elements.progress.setAttribute("aria-valuenow", Math.min((gameState.timeLeft / modes[gameState.mode].time) * 100, 100));
    document.getElementById("wrong").textContent = `${gameState.wrongAnswers} / ${modes[gameState.mode].maxWrong}`;
};

const generateQuestion = () => {
    const ops = ["+", "-", "*", "/"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2, answer;

    switch (op) {
        case "+": num1 = Math.floor(Math.random() * 50) + 1; num2 = Math.floor(Math.random() * 50) + 1; answer = num1 + num2; break;
        case "-": num1 = Math.floor(Math.random() * 50) + 1; num2 = Math.floor(Math.random() * num1); answer = num1 - num2; break;
        case "*": num1 = Math.floor(Math.random() * 12) + 1; num2 = Math.floor(Math.random() * 12) + 1; answer = num1 * num2; break;
        case "/": const quotient = Math.floor(Math.random() * 12) + 1; const divisor = Math.floor(Math.random() * 12) + 1; num1 = divisor * quotient; num2 = divisor; answer = quotient; break;
    }

    elements.question.textContent = `${num1} ${op} ${num2}`;
    gameState.correctAnswer = answer;
};

const startGame = () => {
    gameState.mode = document.getElementById('mode-select').value;
    Object.assign(gameState, {
        score: 0,
        timeLeft: modes[gameState.mode].time,
        totalTime: 0,
        wrongAnswers: 0
    });
    generateQuestion();
    updateDisplay();
    showPage('page_game');

    gameState.timer = setInterval(() => {
        if (gameState.timeLeft > 0) {
            gameState.timeLeft--;
            gameState.totalTime++;
            updateDisplay();
        } else {
            clearInterval(gameState.timer);
            gameOver();
        }
    }, 1000);
};

const gameOver = async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const currentScore = userDoc.data()[`${gameState.mode}Score`] || 0;
            const currentTime = userDoc.data()[`${gameState.mode}Time`] || 0;
            if (gameState.score > currentScore || (gameState.score === currentScore && gameState.totalTime < currentTime)) {
                await db.collection('users').doc(user.uid).update({
                    [`${gameState.mode}Score`]: gameState.score,
                    [`${gameState.mode}Time`]: gameState.totalTime
                });
            }
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    showHome();
};

document.querySelectorAll('.toggle-btn').forEach(btn => btn.addEventListener('click', toggleForms));
document.getElementById('create').addEventListener('submit', e => handleForm(e, false));
document.getElementById('login').addEventListener('submit', e => handleForm(e, true));
document.getElementById('settings-form').addEventListener('submit', updateSettings);
document.getElementById('logout').addEventListener('click', () => auth.signOut());
document.getElementById('mode-select').addEventListener('change', updateModeDetails);
document.getElementById('start-game').addEventListener('click', startGame);

elements.numbers.forEach(btn => btn.addEventListener("click", () => elements.answer.value += btn.value));
elements.backspace.addEventListener("click", () => elements.answer.value = elements.answer.value.slice(0, -1));

elements.submit.addEventListener("click", () => {
    const userAnswer = parseInt(elements.answer.value);
    if (userAnswer === gameState.correctAnswer) {
        gameState.score += modes[gameState.mode].correctScore;
        gameState.timeLeft += modes[gameState.mode].correctTime;
    } else {
        gameState.score = Math.max(gameState.score + modes[gameState.mode].wrongScore, 0);
        gameState.timeLeft = Math.max(gameState.timeLeft + modes[gameState.mode].wrongTime, 0);
        gameState.wrongAnswers++;
    }

    elements.answer.value = "";
    generateQuestion();
    updateDisplay();
    if (gameState.timeLeft <= 0 || gameState.wrongAnswers >= modes[gameState.mode].maxWrong) {
        clearInterval(gameState.timer);
        gameOver();
    }
});