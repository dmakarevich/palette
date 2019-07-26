'use strict';

const blockSize = 200;
const numBlocksInRow = 3;
const interval = 10;
const radius = blockSize / 2;

const canvas = {
    width: blockSize * numBlocksInRow + interval * (numBlocksInRow - 1),
    height: blockSize * numBlocksInRow + interval * (numBlocksInRow - 1)
};

let ctx = null;

const defaultColor = '#ABB7B7';
const backgroundColor = '#FFFFFF';

const canvasHolder = document.querySelector('.canvas-holder');
const currentColorBtn = document.querySelector('.current-color');
const prevColorBtn = document.querySelector('.prev-color');
const colorPicker = document.querySelector('.color-picker');

const toolsMenu = document.querySelectorAll('.tools-block .action');

const currentColorName = 'currentColor';
const prevColorName = 'prevColor';

const actionType = {
    paint: 'paint',
    transform: 'transform',
    move: 'move'
};

const figureType = {
    rectangle: 0,
    circle: 1
};

let currentColor = getColor(currentColorName);
let prevColor = getColor(prevColorName);

const activeActionToolLabel = 'activeActionTool';
const activeClassName = 'active';
const dataValueAttributeLabel = 'data-value';
const valueAttributeLabel = 'value';
const figuresLabel = 'figures';
const canvasFiguresLabel = 'canvas-figures';

let selectedActionToolElem = null;
let selectedActionTool = '';
let selectedPointOnCanvas = null;
let selectedFigure = null;
let firstFigureToMove = null;

let figures = [
    []
];

function initFiguresMatrix(figures) {
    for (let i = 0; i < numBlocksInRow; i++) {
        figures[i] = [];
        for (let j = 0; j < numBlocksInRow; j++) {
            figures[i][j] = {
                x: 0,
                y: 0,
                type: figureType.rectangle,
                color: currentColor
            };
        }
    }

    return figures;
};

function sqr(param) {
    return Math.pow(param, 2);
}

function getCenterParamFromStart(param) {
    return param + radius;
}

function getColor(name) {
    return localStorage.getItem(name) ? localStorage.getItem(name) : defaultColor;
}

function setColor(name, color = currentColor) {
    localStorage.setItem(currentColorName, currentColor);
    localStorage.setItem(prevColorName, prevColor);

    prevColorBtn.style.color = prevColor;
    currentColorBtn.style.color = currentColor;
}

function saveCanvasState() {
    localStorage.setItem(canvasFiguresLabel, JSON.stringify(figures));
}

function drawRectangle(x, y, color) {
    const rectangle = new Path2D();
    rectangle.rect(x, y, blockSize, blockSize);

    ctx.fillStyle = color;
    ctx.fill(rectangle);

    return {
        x,
        y,
        type: 0,
        color
    }
};

function drawCircle(x, y, color) {
    const circle = new Path2D();
    circle.arc(getCenterParamFromStart(x), getCenterParamFromStart(y), radius, 0, 2 * Math.PI);

    ctx.fillStyle = color;
    ctx.fill(circle);

    return {
        x,
        y,
        type: 1,
        color
    }
}

function isFigurePoint(point) {
    let figure = null;

    figure = isPointInRectangle(point);
    if (figure != null && figure.type === 1) {
        figure = isPointInCircle(point, figure);
    }

    return figure;
}

function isPointInCircle(point, rectangleFigure) {
    let figure = null;
    let deltaX = point.x - getCenterParamFromStart(rectangleFigure.x);
    let deltaY = point.y - getCenterParamFromStart(rectangleFigure.y);

    if ((sqr(deltaX) + sqr(deltaY)) <= sqr(radius)) {
        figure = rectangleFigure;
    }

    return figure;
}

function isPointInRectangle(point) {
    let figure = null;
    figures.forEach((row) => {
        row.forEach((figureOnCanvas) => {
            if ((point.x >= figureOnCanvas.x && point.x <= (figureOnCanvas.x + blockSize)) &&
                (point.y >= figureOnCanvas.y && point.y <= (figureOnCanvas.y + blockSize))) {
                figure = figureOnCanvas;

                return;
            }
        });
    });

    return figure;
}

function draw() {
    if (canvasHolder.getContext) {
        ctx = canvasHolder.getContext('2d');

        canvasHolder.width = canvas.width;
        canvasHolder.height = canvas.height;

        if (localStorage.hasOwnProperty(canvasFiguresLabel)) {
            drawSavedCanvasState();
        } else {
            drawNewCanvasFigures();
        }

        function drawRow(x, y, j) {
            for (let i = 0; i < numBlocksInRow; i++) {
                figures[j][i] = drawRectangle(x, y, currentColor);
                x = x + blockSize + interval;
            }
        };

        function drawNewCanvasFigures(x = 0, y = 0) {
            for (let j = 0; j < numBlocksInRow; j++) {
                drawRow(x, y, j);
                y = y + blockSize + interval;
            }
        };

        function drawSavedCanvasState() {
            figures = JSON.parse(localStorage.getItem(canvasFiguresLabel));

            figures.forEach((row) => {
                row.forEach((figure) => {
                    if (figure.type === figureType.rectangle) {
                        drawRectangle(figure.x, figure.y, figure.color);
                    } else {
                        drawCircle(figure.x, figure.y, figure.color);
                    }
                })
            });
        };

    }
}

function addEventOnCanvas() {
    canvasHolder.addEventListener('click', function (event) {
        selectedPointOnCanvas = {
            x: event.offsetX,
            y: event.offsetY
        };
        selectedFigure = isFigurePoint(selectedPointOnCanvas);

        if (selectedFigure) {
            if (selectedActionTool) {
                doActionWithFigures();
            }
        }
    }, false);
}

function changedCurrentFigure(chanchedFigure) {
    figures.forEach(row => {
        row.forEach(figure => {
            if (figure.x === chanchedFigure.x && figure.y === chanchedFigure.y) {
                figure.type = chanchedFigure.type;
                figure.color = chanchedFigure.color;
            }
        })
    });
}

function doActionWithFigures() {
    switch (selectedActionTool) {
        case actionType.paint:
            if (selectedFigure.type === figureType.rectangle) {
                drawRectangle(selectedFigure.x, selectedFigure.y, currentColor);
                selectedFigure.color = currentColor;
            } else if (selectedFigure.type === figureType.circle) {
                drawCircle(selectedFigure.x, selectedFigure.y, currentColor);
                selectedFigure.color = currentColor;
            }

            changedCurrentFigure(selectedFigure);
            selectedFigure = null;
            break;

        case actionType.transform:
            drawRectangle(selectedFigure.x, selectedFigure.y, backgroundColor);

            if (selectedFigure.type === 0) {
                drawCircle(selectedFigure.x, selectedFigure.y, selectedFigure.color);
                selectedFigure.type = 1;
            } else {
                drawRectangle(selectedFigure.x, selectedFigure.y, selectedFigure.color);
                selectedFigure.type = 0;
            }

            changedCurrentFigure(selectedFigure);
            selectedFigure = null;
            break;

        case actionType.move:
            if (firstFigureToMove === null) {
                firstFigureToMove = Object.assign({}, selectedFigure);
            } else {
                const firstFigure = Object.assign({}, firstFigureToMove);
                const secondFigureToMove = Object.assign({}, selectedFigure);

                replaceTwoFigures(secondFigureToMove, firstFigureToMove);
                replaceTwoFigures(firstFigure, selectedFigure);

                firstFigureToMove = null;
                selectedFigure = null;
            }
            break;
    }
    saveCanvasState();
}

function replaceTwoFigures(firstFigure, secondFigure) {
    drawRectangle(secondFigure.x, secondFigure.y, backgroundColor);

    secondFigure.type = firstFigure.type;
    secondFigure.color = firstFigure.color;

    if (firstFigure.type === 1) {
        drawCircle(secondFigure.x, secondFigure.y, secondFigure.color);
    } else {
        drawRectangle(secondFigure.x, secondFigure.y, secondFigure.color);
    }

    changedCurrentFigure(secondFigure);
}


function addEventOnToolsMenu() {
    toolsMenu.forEach((elem) => {
        elem.addEventListener('click', (event) => {
            const actionName = (event.target).getAttribute(dataValueAttributeLabel);
            addActiveTool(actionName);
        }, false)
    });
}

function addChooseColorEvent() {
    colorPicker.addEventListener('input', (event) => {
        prevColor = currentColor;
        currentColor = colorPicker.value;

        colorPicker.style.background = currentColor;
        setColor();
    });
}

function addActiveTool(actionName) {
    if (selectedActionToolElem) {
        selectedActionToolElem.classList.remove(activeClassName);
    };

    selectedActionToolElem = document.querySelector(`[data-value=${actionName}]`);
    selectedActionTool = actionName;
    selectedActionToolElem.classList.add(activeClassName);
    if (selectedActionTool != actionType.move) {
        firstFigureToMove = null;
    }
}

function addEventOnHotKey() {
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;

        switch (keyName.toLowerCase()) {
            case 'p':
                addActiveTool(actionType.paint);
                break;
            case 't':
                addActiveTool(actionType.transform);
                break;
            case 'm':
                addActiveTool(actionType.move);
                break;
        };

    }, false);
}

function chooseSavedColors() {
    document.querySelectorAll('.color').forEach((elem) => {
        elem.addEventListener('click', (event) => {
            prevColor = currentColor;
            currentColor = (event.target).getAttribute(dataValueAttributeLabel);

            setColor();
        })
    });
}

window.onload = () => {
    currentColorBtn.style.color = currentColor;
    prevColorBtn.style.color = prevColor;

    colorPicker.style.backgroundColor = currentColor;

    addEventOnToolsMenu();
    addChooseColorEvent();
    chooseSavedColors();

    initFiguresMatrix(figures);
    draw();

    addEventOnCanvas();

    addEventOnHotKey();
}
