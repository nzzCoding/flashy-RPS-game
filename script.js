let tokenList = ["scissor", "paper", "rock", "lizard", "spock"];
let rules = {
    "scissor": ["paper", "lizard"],
    "paper": ["rock", "spock"],
    "rock": ["scissor", "lizard"],
    "lizard": ["spock", "paper"],
    "spock": ["scissor", "rock"]
};
let score = (sessionStorage.getItem("score") !== null)? 
    Number(sessionStorage.getItem("score")) : 0;//stored score that survives refreshes
let hoverScale = 1.03;//value used to scale svg token on hover
let selectTriggerInterval = 100;//interval in ms
let scoreNode = document.querySelector(".score-content");//node displaying the score
let resultsBoard = document.querySelector(".results-step")
let resultNode = document.querySelector(".round-result h1");//node displaying result at end of round
let playerSide = document.querySelector(".side-body.player svg");//svg that will be populated dynamically, represents the player choice
let houseSide = document.querySelector(".side-body.house svg");//same as above but for house side

scoreNode.textContent = score;//at refresh set score from session storage

function checkResult(playerChoice, computerChoice) {
    if (!tokenList.includes(playerChoice)) {
        throw new Error(`chosen element is not a token: ${playerChoice}`);
    }
    if (playerChoice === computerChoice) {
        return "DRAW"
    }
    return (
        (rules[playerChoice].filter(
            (choice) => choice === computerChoice).length > 0) ? "YOU WIN" : "YOU LOSE"
    )
}

function randomSelection() {
    let randomNumber = Math.floor(Math.random() * 5);
    return tokenList[randomNumber]
}

function Token(id) {
    /*
    Token constructor
    a token is represented by:
    - id
    - corresponding node on the DOM
    - coordinates on the SVG viewport
    - mouse focus
    */
    this.id = id;

    this.node = document.querySelector(`#${id}`);
    this.BBox = this.node.getBBox();
    this.x = this.BBox.x;
    this.y = this.BBox.y;
    this.width = this.BBox.width;
    this.height = this.BBox.height;

    this.tokenFocus = false;

    this.getNewScaledCenter = function (coeff) {
        let newX = (this.width/2) - (coeff*this.width)/2;
        let newY = (this.height/2) - (coeff*this.height)/2;
        return [newX, newY]
    }

    this.scale = function (coeff) {
        let [centerX, centerY] = this.getNewScaledCenter(coeff);
        this.node.setAttribute(
            "transform", 
            `matrix(${coeff} 0 0 ${coeff} ${centerX} ${centerY})`);
    }
}

//Object mapping token ids to corresponding Token
let tokenDict = new Object();
tokenList.forEach(
    (tokenID) => tokenDict[tokenID] = new Token(tokenID));

//used to store the token that will be selected in the future
let selectedToken, housePick;

/*
mouseenter mouserelease and clickevent functions 
connected to each <a class="interactive-token"> elements on the DOM (5 in total)
*/
function tokenHoverEffect(event) {
    let target = event.currentTarget.children[0];
    let curToken = tokenDict[target.id];
    if (!curToken.tokenFocus) {
        curToken.scale(hoverScale);
        curToken.tokenFocus = !curToken.tokenFocus;
    }
}

function tokenLeaveEffect(event) {
    let target = event.currentTarget.children[0];
    let curToken = tokenDict[target.id];
    if (true) {
        curToken.scale(1);
        curToken.tokenFocus = !curToken.tokenFocus;
    }
}

function tokenSelected(event) {
    let target = event.currentTarget.children[0];
    let curToken = tokenDict[target.id];
    selectedToken = curToken;
}

let tokenNodes = document.querySelectorAll(".interactive-token");

for (let i = 0; i < tokenNodes.length; i++) {
        tokenNodes[i].addEventListener("mouseover", tokenHoverEffect);
        tokenNodes[i].addEventListener("mouseleave", tokenLeaveEffect);
        tokenNodes[i].addEventListener("click", tokenSelected);
}

/*
events displaying/showing rules section
*/
let rulesNode = document.querySelector(".displayed-rules");
let rulesOpen = document.querySelector("#rules-open-btn");
let rulesExit = document.querySelector("#rules-exit-btn");
rulesOpen.addEventListener("click", (event) => {
    rulesNode.setAttribute("style", "display: flex;");
});
rulesExit.addEventListener("click", (event) => {
    rulesNode.setAttribute("style", "display: none;");
});
/*
Main steps of the game
- token selection
- show player selection and wait for random computer choice
- show player selection and computer selection
- decide the winner and update the score
*/
let steps = {
    "selection": document.querySelector(".selection-step"),
    "results": document.querySelector(".results-step"),
    "round-end": document.querySelector(".round-result")
};
function displayStep(step, displayType) {
    steps[step].setAttribute("style", `display: ${displayType};`);
}

function hideStep(step) {
    steps[step].setAttribute("style", "display: none;");
}

let triggerCheck = undefined;//setInterval ref put in global scope to clean it later
function getSelectionTrigger(interval) {
    /*
    returns a promise that resolves when a token is selected
    */
    return new Promise((resolve, reject) => {
        triggerCheck = setInterval(() => {
            if (selectedToken != undefined) {
                resolve(selectedToken);
            }
        }, interval);
    });
}

function sleep(sleepingTime) {
    /*
    returns a promise that resolves after a timeout
    used to wait a few moments between steps
    */
   return new Promise((resolve, reject) => {
       setTimeout(() => {
           resolve("waiting done")
       }, sleepingTime);
   });
}

function populateSVG(svg, insertion, symbolRef, className, x, y) {
    let svgChild = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svgChild.setAttribute("href", symbolRef);
    svgChild.setAttribute("class", className);
    svgChild.setAttribute("x", x);
    svgChild.setAttribute("y", y);

    svg.insertBefore(svgChild, insertion);
}

function clearSVG(svg) {
    while (svg.children.length > 0) {
        svg.removeChild(svg.lastChild);
    }
}

async function selection_step() {
    /*
    awaits selection from player then show next step
    */
    let playerSelection = await getSelectionTrigger(selectTriggerInterval);
    clearInterval(triggerCheck);

    hideStep("selection");
    displayStep("results", "grid");
    
    results_step();
}

async function results_step() {
    /*
    slideshow of steps function, show each step for a given time then move onto the next
    the house chosen token will be picked randomly at step 3
    step 4 show the final result and highlights the winner
    */
    populateSVG(
        playerSide,
        null, 
        `#symbol-${selectedToken.id}-token`, 
        `token ${selectedToken.id}`,
        "14.155",
        "15.082");

    populateSVG(
        houseSide,
        null,
        "#empty-slot",
        "token empty-slot",
        "14.155",
        "15.082");

    let stepTimer = await sleep(1000);//waiting time between step 2 and 3

    housePick = randomSelection();

    houseSide.removeChild(houseSide.lastChild);
    houseToken = populateSVG(
        houseSide,
        null,
        `#symbol-${housePick}-token`,
        `token ${housePick}`,
        "14.155",
        "15.082");

    stepTimer = await sleep(1000);//waiting time between step 3 and 4
    
    resultsBoard.setAttribute("class", "results-step expanded")
    displayStep("round-end", "flex");

    let result = checkResult(selectedToken.id, housePick);
    let increment, highlight;
    if (result === "YOU WIN") {
        increment = 1;
        highlight = playerSide
    } else if (result === "YOU LOSE") {
        increment = -1;
        highlight = houseSide
    } else {
        increment = 0;
    }
    score += increment;
    sessionStorage.setItem("score", score);

    if (highlight !== undefined) {
        populateSVG(
            highlight,
            highlight.lastChild,
            "#glow-bg",
            "glow-bg",
            "0",
            "0");
    }

    scoreNode.textContent = score;//defined at line 14, node that displays score
    resultNode.textContent = result;
}

function playAgain() {
    /*
    clears the svgs displaying player and house pick
    hides rematch btn and results-step nodes and show selection step
    reinitialize the choices to "undefined"
    */
    selectedToken = undefined;
    housePick = undefined;

    clearSVG(playerSide);
    clearSVG(houseSide);

    resultNode.textContent = "";
    resultsBoard.setAttribute("class", "results-step compact");
    hideStep("results");
    hideStep("round-end");
    displayStep("selection", "flex");
    
    selection_step();
}

let rematchBtn = document.querySelector("#rematch-btn");
rematchBtn.addEventListener("click", playAgain)

/*
main loop that goes over the 4 steps of the game
*/
selection_step();