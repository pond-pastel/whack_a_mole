const NEXT_MOLE_INTERVAL = {
    easy: 500,
    normal: 300,
    hard: 150
};
const REMOVE_MOLE_INTERVAL = {
    easy: 1500,
    normal: 1000,
    hard: 700
};
const MAX_TIME = 60;
let moleInterval = new Array(5).fill(null);
let moleKey = ["I", "O", "P", "K", "L"];
let newMoleKey = [];
let score = 0;
let time = 0;
let isMoleKeyChange = false;
let isSetting = false;
let isPlaying = false;
let isShowResult = false;
let isTouchMedia = false;
let data, nextMoleInterval, timer;

function dataApply() {
    const d = localStorage.getItem("whack_a_mole");
    const difficulty = document.querySelector("#difficulty");
    if(d) {
        data = JSON.parse(d);
        difficulty.value = data.difficulty;
        moleKey = data.key;
    } else {
        data = {
            difficulty: difficulty.value,
            key: moleKey,
            highScore: {}
        };
        dataSave();
    }
}

function dataSave() {
    const difficulty = document.querySelector("#difficulty");
    data.difficulty = difficulty.value;
    data.key = moleKey;
    localStorage.setItem("whack_a_mole", JSON.stringify(data));
}

function moleApply(ele) {
    ele.innerHTML = "";
    for(let i = 0; i < 5;i++) {
        const ground = document.createElement("div");
        ground.className = "ground";
        const mole = document.createElement("div");
        mole.className = "mole";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "mole-checkbox";
        if(ele.id === "mole-group") {
            checkbox.checked = !isPlaying;
        }
        const keyLabel = document.createElement("div");
        keyLabel.className = "mole-key-label";
        keyLabel.classList.add("keyboard");
        if(!isTouchMedia) {
            keyLabel.innerText = moleKey[i];
        }
        mole.append(checkbox);
        ground.append(mole);
        ground.append(keyLabel);
        ele.append(ground);
    }
    switch(ele.id) {
        case "mole-key-change":
            const description = document.createElement("div");
            description.className = "description";
            description.textContent = "変更したいキーを順番に押してください。";
            ele.append(description);
            break;
        case "mole-group":
            const moles = document.querySelectorAll("#mole-group .mole");
            moles.forEach((m, i) => {
                m.addEventListener("pointerdown", () => {
                    if(!isTouchMedia) {
                        return;
                    }
                    whack(i);
                    gameStart();
                });
            });
    }
}

function moleKeyChangeStart() {
    if(isPlaying) {
        return;
    }
    isMoleKeyChange = true;
    const moleKeyChange = document.querySelector("#mole-key-change");
    moleApply(moleKeyChange);
    moleKeyChange.style.display = null;
    newMoleKey = [];
    const moles = document.querySelectorAll("#mole-key-change .mole .mole-checkbox");
    moles[0].checked = true;
}

function moleKeyChangeApply(k) {
    const key = k.toUpperCase();
    const reg = new RegExp("^[A-Z]$");
    if(!isMoleKeyChange) {
        return;
    }
    if(reg.test(key)) {
        if(newMoleKey.some((k) => k === key)) {
            alert("すでに登録されています。別のキーを登録してください。");
            return;
        }
        newMoleKey.push(key);
    } else {
        return;
    }
    const moleKeyLabel = document.querySelector("#mole-key-change .ground:has(.mole-checkbox:checked) .mole-key-label");
    moleKeyLabel.innerText = key;
    const moles = document.querySelectorAll("#mole-key-change .mole .mole-checkbox");
    moles.forEach((m) => {
        m.checked = false;
    });
    if(newMoleKey.length < 5) {
        moles[newMoleKey.length].checked = true;
    } else {
        moleKey = Array.from(newMoleKey);
        dataSave();
        moleKeyChangeEnd();
    }
}

function moleKeyChangeEnd() {
    const moleKeyChange = document.querySelector("#mole-key-change");
    moleKeyChange.style.display = "none";
    newMoleKey = [];
    isMoleKeyChange = false;
    const moleGroup = document.querySelector("#mole-group");
    moleApply(moleGroup);
}

function gameStart(k = null) {
    if(isPlaying || isShowResult) {
        return;
    }
    if(k) {
        const key = k.toUpperCase();
        if(isSetting || isMoleKeyChange) {
            return;
        }
        if(!moleKey.some((k) => k === key)) {
            return;
        }
    }
    isPlaying = true;
    score = 0;
    const difficulty = document.querySelector("#difficulty");
    highScore = data.highScore[difficulty.value];
    scoreApply();
    time = MAX_TIME;
    timeApply();
    const moles = document.querySelectorAll("#mole-group .mole .mole-checkbox");
    moles.forEach((m) => {
        m.checked = false;
    })
    const beforeStarting = document.querySelectorAll(".before-starting");
    beforeStarting.forEach((b) => {
        b.style.display = "none";
    });
    const playing = document.querySelectorAll(".playing");
    playing.forEach((p) => {
        p.style.display = null;
    });
    moleAppears();
    nextMoleInterval = setInterval(moleAppears, NEXT_MOLE_INTERVAL[difficulty.value]);
    timer = setInterval(timePasses, 1000);
}

function timePasses() {
    time -= 1;
    if(time < 1) {
        gameEnd();
    }
    timeApply();
}

function timeApply() {
    const timerEle = document.querySelector(".playing.timer");
    timerEle.innerHTML = `Time<br>${time}`;
}

function moleAppears(num = null) {
    const moles = document.querySelectorAll("#mole-group .mole .mole-checkbox");
    let id;
    if(num === null) {
        id = Math.floor(Math.random() * 5);
    } else {
        const rand = Math.floor((Math.random() * 4) + 1);
        id = (num + rand) % 5;
    }
    if(moleInterval[id] === null) {
        moles[id].checked = true;
        const difficulty = document.querySelector("#difficulty");
        moleInterval[id] = setTimeout(moleRemove, REMOVE_MOLE_INTERVAL[difficulty.value], id);
    }
}

function moleRemove(num) {
    const moles = document.querySelectorAll("#mole-group .mole .mole-checkbox");
    moles[num].checked = false;
    if(moleInterval[num]) {
        clearTimeout(moleInterval[num]);
        moleInterval[num] = null;
    }
}

function whack(k) {
    if(!isPlaying) {
        return;
    }
    let num = k;
    if(typeof k === "string") {
        const key = k.toUpperCase();
        num = moleKey.findIndex((m) => m === key);
    }
    if(num < 0) {
        return;
    }
    const moles = document.querySelectorAll("#mole-group .mole .mole-checkbox");
    if(moles[num].checked) {
        score += 1;
        moles[num].checked = false;
        moleAppears(num);
    } else {
        score -= 1;
    }
    scoreApply();
}

function scoreApply() {
    const scoreEle = document.querySelector(".playing.score");
    scoreEle.innerHTML = `Score<br>${score}`;
}

function highScoreUpdate() {
    const difficulty = document.querySelector("#difficulty");
    const HS = data.highScore[difficulty.value];
    if(HS == undefined) {
        data.highScore[difficulty.value] = score;
    } else if(HS < score) {
        data.highScore[difficulty.value] = score;
    }
    dataSave();
    highScoreApply();
}

function highScoreApply() {
    const highScoreEle = document.querySelector(".high-score");
    const difficulty = document.querySelector("#difficulty");
    const HS = data.highScore[difficulty.value];
    highScoreEle.innerHTML = `${difficulty.selectedOptions[0].innerText}<br>High Score<br>${HS ?? "記録なし"}`;
}

function gameEnd() {
    clearInterval(nextMoleInterval);
    nextMoleInterval = null;
    clearInterval(timer);
    highScoreUpdate();
    timer = null;
    isPlaying = false;
    isShowResult = true;
    for(let i = 0;i < 5;i++) {
        moleRemove(i);
    }
    const playing = document.querySelectorAll(".playing");
    playing.forEach((p) => {
        p.style.display = "none";
    });
    const result = document.querySelectorAll(".result");
    result.forEach((r) => {
        r.style.display = null;
    });
}

function returnAction() {
    const result = document.querySelectorAll(".result");
    result.forEach((r) => {
        r.style.display = "none";
    });
    const beforeStarting = document.querySelectorAll(".before-starting");
    beforeStarting.forEach((b) => {
        b.style.display = null;
    });
    score = 0;
    isShowResult = false;
    const moles = document.querySelectorAll("#mole-group .mole .mole-checkbox");
    moles.forEach((m) => {
        m.checked = true;
    });
}

function touchMiss(e) {
    if(!e.classList.contains("mole") && isPlaying && isTouchMedia) {
        score -= 1;
    }
    scoreApply();
}

window.onload = function() {
    dataApply();
    highScoreApply();
    if(window.matchMedia("(hover: none)").matches) {
        isTouchMedia = true;
        const keyboard = document.querySelectorAll(".keyboard");
        keyboard.forEach((k) => {
            k.style.display = "none";
        });
        const touch = document.querySelectorAll(".touch");
        touch.forEach((t) => {
            t.style.display = null;
        });
    }
    const settingButton = document.querySelector("#setting-button");
    settingButton.addEventListener("click", () => {
        const checkbox = document.querySelector("#setting-checkbox");
        checkbox.checked = !checkbox.checked;
        isSetting = checkbox.checked;
    })
    const difficulty = document.querySelector("#difficulty");
    difficulty.addEventListener("change", () => {
        dataSave();
        highScoreApply();
    });
    const moleKeyChangeButton = document.querySelector("#mole-key-change-button");
    moleKeyChangeButton.addEventListener("click", () => {
        moleKeyChangeStart();
    });
    const returnButton = document.querySelector("#return-button");
    returnButton.addEventListener("click", () => {
        returnAction();
    });
    document.addEventListener("keydown", (e) => {
        key = e.key;
        moleKeyChangeApply(key);
        whack(key);
        gameStart(key);
    })
    document.addEventListener("pointerdown", (e) => {
        touchMiss(e.target);
    });
    const moleGroup = document.querySelector("#mole-group");
    moleApply(moleGroup);
}