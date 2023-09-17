// ��ȡ������������
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const thicknessRange = document.getElementById('thicknessRange');
const eraserSizeRange = document.getElementById('eraserSizeRange');
const dropdownButtons = document.querySelectorAll('.tool-button');
const subMenus = document.querySelectorAll('.dropdown-content');
const colorButtons = document.getElementsByClassName('color');
const eraserButton = document.getElementById('eraserButton');
const clearCanvasButton = document.getElementById('clearCanvasButton');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const moveCanvasButton = document.getElementById('moveCanvasButton');
const toggleBackgroundButton = document.getElementById('toggleBackground');
const penButton = document.getElementById('penButton');
const penColorButtons = document.getElementsByClassName('penColor');
const penSubMenu = document.getElementById('penSubMenu');
penSubMenu.classList.add('close');


const initialCanvasWidth = 4096;
const initialCanvasHeight = 10240;

canvas.width = initialCanvasWidth;
canvas.height = initialCanvasHeight;

// ��Ӵ����¼�����
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

let currentColor = 'black';
let currentTool = 'pen';
let isDrawing = false;
let history = [];
let redoHistory = [];
let currentCoordinates = [];

let isCanvasMoving = false;
let startOffsetX = 0;
let startOffsetY = 0;
let offsetX = 0;
let offsetY = 0;
let canvasTranslateX = 0;
let canvasTranslateY = 0;
let minCanvasTranslateX = 0;
let minCanvasTranslateY = 0;
let maxCanvasTranslateX = 0;
let maxCanvasTranslateY = 0;

let isErasing = false;
let eraserSize = 10;

// ȫ�ַ�Χ���lineWidthHistory����
let lineWidthHistory = [];

/* ע������ط�ר�����electron�����������ɾȥ*/
const { ipcRenderer } = require('electron');

// ��ȡ��ťԪ��

const eraserSubMenu = document.getElementById('eraserSubMenu');

// Ĭ������¼���ʰ�ť
penButton.classList.add('button-active');

// ��ӱʰ�ť�ĵ���¼�������
penButton.addEventListener('click', () => {
    // ����ʰ�ť
    penButton.classList.add('button-active');
    
    // �Ƴ���Ƥ����ť�Ļ״̬
    eraserButton.classList.remove('button-active');
    
    // ������ִ����ʹ�����صĲ���
});

// �����Ƥ����ť�ĵ���¼�������
eraserButton.addEventListener('click', () => {
    // ������Ƥ����ť
    eraserButton.classList.add('button-active');
    
    // �Ƴ��ʰ�ť�Ļ״̬
    penButton.classList.remove('button-active');
    
    // ������ִ������Ƥ��������صĲ���
    
    // �ڴ���Ƥ����������ʱ������������������߼�����ʾ��Ƥ������
    eraserSubMenu.style.display = 'block';
});

// ��ӹر���Ƥ������������߼�
function closeEraserSubMenu() {
    // ������Ƥ����������
    eraserSubMenu.style.display = 'none';
    
    // ����ʰ�ť���ص��ʹ��ߣ�
    penButton.classList.add('button-active');
    
    // �Ƴ���Ƥ����ť�Ļ״̬
    eraserButton.classList.remove('button-active');
    
    // �����������������ر���Ƥ����������ʱ�Ĳ���
}

// �ڹر���Ƥ����������İ�ť������Ԫ������ӵ���¼��������������ùر���Ƥ����������ĺ���

document.getElementById('minimize-white-window').addEventListener('click', () => {
    ipcRenderer.send('minimize-white-window');
});

document.getElementById('closeWindow').addEventListener('click', () => {
    // �������̷��͹رմ��ڵ�����
    ipcRenderer.send('close-window-request');
});

const menuButton = document.getElementById('menuButton');
const menuContainer = document.getElementById('menuContainer');

let isMenuOpen = false;

menuButton.addEventListener('click', toggleMenu);

function toggleMenu() {
    if (!isMenuOpen) {
        openMenu();
    } else {
        closeMenu();
    }
}

function openMenu() {
    isMenuOpen = true;
    menuContainer.style.display = 'block';
}

function closeMenu() {
    isMenuOpen = false;
    menuContainer.style.display = 'none';
}



// �رն���������¼�������
document.addEventListener('click', (event) => {
    const target = event.target;
    const isDropdownButton = [...dropdownButtons].some((button) => button.contains(target));
    if (!isDropdownButton) {
        subMenus.forEach((menu) => {
            menu.style.display = 'none';
        });
    }
});

// ��ʾ��������İ�ť����¼�������
dropdownButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const dropdownContent = button.nextElementSibling;
        dropdownContent.style.display = 'block';
        event.stopPropagation();
    });
});

// ���㻭�����ƶ���Χ
function calculateCanvasRange() {
    const boundingRect = canvas.getBoundingClientRect();
    const canvasRange = {
        minX: -boundingRect.width + initialCanvasWidth,
        minY: -boundingRect.height + initialCanvasHeight,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
    };
    return canvasRange;
}

// ������ͼ�¼�
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// ������ɫ��ť����¼�
for (let i = 0; i < colorButtons.length; i++) {
    colorButtons[i].addEventListener('click', changeColor);
}

// ������Ƥ����ť����¼�
eraserButton.addEventListener('click', useEraser);

// �������������ť����¼�
clearCanvasButton.addEventListener('click', clearCanvas);

// ����������ť����¼�
undoButton.addEventListener('click', undo);

// ����������ť����¼�
redoButton.addEventListener('click', redo);



// �����л�������ɫ��ť����¼�
toggleBackgroundButton.addEventListener('click', toggleBackgroundColor);

// ������Ƥ����С����ֵ�ı��¼�
eraserSizeRange.addEventListener('input', updateEraserSize);

let isDrawingEnabled = false;

// ��ʼ�ƶ�����
function startMovingCanvas() {
    if (currentTool !== 'move') {
        currentTool = 'move';
        canvas.style.cursor = 'grabbing';
        document.addEventListener('mousedown', startMovingMouse);
        isDrawingEnabled = false; // ���û���
    }
}
// �Ҽ�����¼�������򣬷�ֹ�Ҽ��˵�����
function preventContextMenu(e) {
    e.preventDefault();
}
// ��ʼ�ƶ����
function startMovingMouse(e) {
    if (currentTool === 'move') {
        document.addEventListener('mousemove', moveCanvas);
        document.addEventListener('mouseup', stopMovingMouse);
    }
}

// ֹͣ�ƶ����
function stopMovingMouse(e) {
    document.removeEventListener('mousemove', moveCanvas);
    document.removeEventListener('mouseup', stopMovingMouse);
    if (e.target === canvas) {
        stopMovingCanvas();
    }
}
// ����Ҽ�����¼�������������ƶ�����
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // ��ֹ�Ҽ��˵�����
    startMovingCanvas();
});

// ��ȡ����λ��
function getTouchPos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.touches[0].clientX - rect.left,
        y: evt.touches[0].clientY - rect.top
    };
}


  
let isTwoFingerTouch = false;
let isDraggingCanvas = false; // ���һ����־�����ƻ����϶�

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        // ˫ָ������ʼ
        isTwoFingerTouch = true;
        isDraggingCanvas = true; // ���û����϶������û���
        isDrawing = false; // ���û���
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialTouch1X = touch1.clientX;
        initialTouch1Y = touch1.clientY;
        initialTouch2X = touch2.clientX;
        initialTouch2Y = touch2.clientY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isTwoFingerTouch && isDraggingCanvas) {
        // ˫ָ�����ƶ��������϶�����
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentTouch1X = touch1.clientX;
        const currentTouch1Y = touch1.clientY;
        const currentTouch2X = touch2.clientX;
        const currentTouch2Y = touch2.clientY;

        // ����������������ƶ�����
        const deltaX1 = currentTouch1X - initialTouch1X;
        const deltaY1 = currentTouch1Y - initialTouch1Y;
        const deltaX2 = currentTouch2X - initialTouch2X;
        const deltaY2 = currentTouch2Y - initialTouch2Y;

        // ����ƽ�����ƶ�����
        const averageDeltaX = (deltaX1 + deltaX2) / 2;
        const averageDeltaY = (deltaY1 + deltaY2) / 2;

        // ���»�����ƽ��λ��
        canvasTranslateX += averageDeltaX;
        canvasTranslateY += averageDeltaY;

        // Ӧ���ƶ�Ч��
        canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;

        // ���³�ʼ������λ��
        initialTouch1X = currentTouch1X;
        initialTouch1Y = currentTouch1Y;
        initialTouch2X = currentTouch2X;
        initialTouch2Y = currentTouch2Y;

    
    } else if (isDrawing) {
        // ������ڻ���״̬������û��ƺ���
        draw(e);
    }

    
});


canvas.addEventListener('touchend', () => {
    // ˫ָ��������
    isTwoFingerTouch = false;
    isDraggingCanvas = false; // ֹͣ�϶��������������
});

// �ƶ�����
function moveCanvas(e) {
    const deltaX = e.movementX;
    const deltaY = e.movementY;
    canvasTranslateX += deltaX;
    canvasTranslateY += deltaY;
    canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;
}

// ֹͣ�ƶ�����
function stopMovingCanvas() {
    currentTool = 'pen';
    canvas.style.cursor = 'crosshair';
    document.removeEventListener('mousedown', startMovingMouse);
}

// ��ȡ���ƫ����
function getOffset(e) {
    const { clientX, clientY } = e;
    const { left, top } = canvas.getBoundingClientRect();
    const offsetX = clientX - left;
    const offsetY = clientY - top;
    return { offsetX, offsetY };
}

// ����������ϸ
function updateLineWidth() {
    ctx.lineWidth = thicknessRange.value;
}

// ���Ļ�ͼ��ɫ
function changeColor(e) {
    currentColor = e.target.style.backgroundColor;
}

eraserSizeRange.addEventListener('input', updateEraserSize);

let currentEraserSize = eraserSize; 

function updateEraserSize() {
    currentEraserSize = eraserSizeRange.value; // ������Ƥ����С
    if (currentTool === 'eraser') {
        // �޸���Ƥ���������ʽΪһ���Ұ�ɫ��͸����Բ��ָʾ��
        canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${currentEraserSize}" height="${currentEraserSize}" viewBox="0 0 ${currentEraserSize} ${currentEraserSize}"><circle cx="${currentEraserSize / 2}" cy="${currentEraserSize / 2}" r="${currentEraserSize / 2}" fill="rgba(200, 200, 200, 0.7)" stroke="none"/></svg>') ${currentEraserSize / 2} ${currentEraserSize / 2}, auto`;
    }
}

// ������Ƥ��ָʾ����λ��
function updateEraserIndicator(x, y) {
    const eraserIndicator = document.getElementById('eraserIndicator');
    eraserIndicator.style.left = `${x}px`;
    eraserIndicator.style.top = `${y}px`;
}


// ʹ����Ƥ��
function useEraser() {
    if (currentTool === 'eraser') {
        currentTool = 'pen';
        eraserButton.classList.remove('active');
        canvas.style.cursor = 'crosshair';
        document.getElementById('eraserSubMenu').style.display = 'none';
        isErasing = false; // ����Ϊfalse���л��ػ���ʱ���ٲ���
    } else {
        currentTool = 'eraser';
        eraserButton.classList.add('active');
        document.getElementById('eraserSubMenu').style.display = 'block';
        updateEraserSize(); // ������Ƥ����С
        isErasing = true; // ����Ϊtrue���л�����Ƥ��ʱ��ʼ����
    }
    isDrawing = false;
}


/*���»��Ʋ���
function redrawStep(step) {
    const { x, y, color, type, thickness } = step;

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'line') {
        ctx.beginPath();
        ctx.moveTo(x[0], y[0]);
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i], y[i]);
        }
        ctx.stroke();
    } else if (type === 'eraser') {
        const radius = thickness / 2;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        for (let i = 0; i < x.length; i++) {
            ctx.arc(x[i], y[i], radius, 0, 2 * Math.PI);
        }
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}
*/
// �������
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    redoHistory = [];
    drawingData = []; // ��ջ��Ʋ�����������
}

// �л�������ɫ
function toggleBackgroundColor() {
    if (canvas.style.backgroundColor === 'black') {
        canvas.style.backgroundColor = 'white';
    } else {
        canvas.style.backgroundColor = 'black';
    }
}

// �޸ı���ɫ��ť����¼�
for (let i = 0; i < penColorButtons.length; i++) {
    penColorButtons[i].addEventListener('click', changePenColor);
}

// �ʰ�ť����¼�
penButton.addEventListener('click', togglePenMenu);

let isPenSelected = false;
let isPenMenuOpen = false;

// �л�����ɫ
function changePenColor(e) {
    currentColor = e.target.style.backgroundColor;
    updateLineWidth(); // ���±ʵĴ�ϸ

    // ���»�ͼ�����ĵ�������ɫ
    ctx.strokeStyle = currentColor;
}


// �л��ʶ����˵�
function togglePenMenu() {
    if (!isPenSelected) {
        isPenSelected = true;
        openPenMenu();
    } else {
        if (!isPenMenuOpen) {
            openPenMenu();
        } else {
            closePenMenu();
        }
    }
}

// �򿪱ʶ����˵�
function openPenMenu() {
    isPenMenuOpen = true;
    penSubMenu.classList.add('open');
}

// �رձʶ����˵�
function closePenMenu() {
    isPenMenuOpen = false;
    penSubMenu.classList.remove('open');
}


// ȫ�ַ�Χ��ӻ��Ʋ�����������
let drawingData = [];

// ��������ƶ��ٶ�
function calculateSpeed(currentX, currentY, previousX, previousY, deltaTime) {
    if (previousX === null || previousY === null || previousTime === null) {
        return 0;
    }
    const distance = Math.sqrt((currentX - previousX) ** 2 + (currentY - previousY) ** 2);
    const speed = distance / deltaTime;
    return speed;
}
// ����������ϸ
function calculateLineWidth(speed) {
    const minSpeed = 0;
    const maxSpeed = 10;
    const minWidth = 1;
    const maxWidth = 5;
    const normalizedSpeed = Math.max(Math.min(speed, maxSpeed), minSpeed);
    const normalizedLineWidth = ((normalizedSpeed - minSpeed) / (maxSpeed - minSpeed)) * (maxWidth - minWidth) + minWidth;
    const currentLineWidth = Math.round(normalizedLineWidth);
    return currentLineWidth;
}

// ��������͸����
function calculateLineOpacity(speed) {
    const minSpeed = 0;
    const maxSpeed = 10;
    const minOpacity = 0.1;
    const maxOpacity = 1;
    const normalizedSpeed = Math.max(Math.min(speed, maxSpeed), minSpeed);
    const normalizedOpacity = ((normalizedSpeed - minSpeed) / (maxSpeed - minSpeed)) * (maxOpacity - minOpacity) + minOpacity;
    const currentOpacity = Math.round(normalizedOpacity * 10) / 10;
    return currentOpacity;
}

// ����
function draw(e,evt) {
    if ((isDrawingEnabled || isErasing) && !isDraggingCanvas) { // ������ƻ����
        let offsetX, offsetY;

        if (e.type === 'mousemove' || e.type === 'mousedown') {
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        } else if (e.type === 'touchmove' || e.type === 'touchstart') {
            e.preventDefault();
            const touch = e.touches[0];
            offsetX = touch.clientX - canvas.getBoundingClientRect().left;
            offsetY = touch.clientY - canvas.getBoundingClientRect().top;
        }

        // ��ȡ������ϸֵ
        const lineWidth = parseFloat(thicknessRange.value);

        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentTool === 'pen') {
            // ���ƻ���
            ctx.strokeStyle = `rgba(${currentColor}, 1)`;
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();

            // ������Ʋ���
            const step = {
                x: offsetX,
                y: offsetY,
                thickness: lineWidth,
                color: ctx.strokeStyle,
                type: 'line',
            };
            currentCoordinates.push(step);
        } else if (currentTool === 'eraser') {
            
            // ʹ����Ƥ��ʱ�����Ӧ������
            const radius = currentEraserSize / 2; // ʹ���µ���Ƥ����С
            ctx.globalCompositeOperation = 'destination-out';

            
            // ����һ��Բ�����������
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, radius, 0, 2 * Math.PI);
            ctx.fill();

            // �ָ��ϳɲ���ΪĬ��
            ctx.globalCompositeOperation = 'source-over';

            // ������Ʋ���
            const step = {
                x: offsetX,
                y: offsetY,
                thickness: currentEraserSize, // ʹ���µ���Ƥ����С
                color: canvas.style.backgroundColor,
                type: 'eraser',
            };
            currentCoordinates.push(step);
        }
    }
}



// ����¼�����������ֵ�仯ʱ����������ϸ
thicknessRange.addEventListener('input', () => {
    // ��ȡ�µ�������ϸֵ��Ӧ��
    const newLineWidth = parseFloat(thicknessRange.value);
    ctx.lineWidth = newLineWidth;
});

// �������ʹ����¼�
canvas.addEventListener('mousedown', (e) => {
    isDrawingEnabled = true;
    draw(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawingEnabled) {
        draw(e);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawingEnabled = false;
});

canvas.addEventListener('touchstart', (e) => {
    isDrawingEnabled = true;
    draw(e);
});

canvas.addEventListener('touchmove', (e) => {
    if (isDrawingEnabled) {
        draw(e);
    }
});

canvas.addEventListener('touchend', () => {
    isDrawingEnabled = false;
});


// ֹͣ����
function stopDrawing() {
    isDrawing = false;
    isErasing = false;
    if (currentCoordinates.length > 0) {
        // �����Ʋ������ݱ��浽��ʷ��¼���飨���������
        history.push(currentCoordinates);

        // ��յ�ǰ���Ʋ�����������
        currentCoordinates = [];

        // ���������ʷ��¼����
        redoHistory = [];
    }
}



// �޸�undo����
function undo() {
    if (history.length > 0) {
        const undoneSteps = history.pop();
        redoHistory.push(undoneSteps);
        redrawHistory(); // ���»�����ʷ��¼
    }
}

// �޸�redo����
function redo() {
    if (redoHistory.length > 0) {
        const redoneSteps = redoHistory.pop();
        history.push(redoneSteps);
        redrawHistory(); // ���»�����ʷ��¼
    }
}


// ���»�����ʷ��¼�е����в���
function redrawHistory() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const steps of history) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const { x, y, color, thickness, type } = step;

            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (type === 'line') {
                if (i === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            } else if (type === 'eraser') {
                const radius = thickness / 2;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }
        }
    }
}

const MAX_HISTORY_LENGTH = 10; // ������ʷ��¼�����޳���

// ��ʼ����
function startDrawing(e) {
    if (!isCanvasMoving && currentTool === 'pen') {
        isDrawing = true;
        const { offsetX, offsetY } = getOffset(e);
        previousX = offsetX;
        previousY = offsetY;
        previousTime = performance.now();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);

        // ���������ʷ��¼
        redoHistory = [];
    } else if (currentTool === 'eraser') {
        isErasing = true;
        draw(e);
    }
}


const canvasList = []; // ���ڴ洢����������
const canvasHistoryList = [];


function saveCanvas() {
    if (currentCanvasIndex !== -1) {
        ctx.canvas.willReadFrequently = true; // ��������Ϊtrue

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvasList[currentCanvasIndex] = imageData;

        // �����ʷ��¼���ȳ������ޣ�ɾ���������ʷ��¼
        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }

        ctx.canvas.willReadFrequently = false; // �ָ�����Ϊfalse
    }
}


// ��canvasList������ָ�������Ļ������ݻ��Ƶ���ǰ������
function drawCurrentCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imageData = canvasList[currentCanvasIndex];
    ctx.putImageData(imageData, 0, 0);
}

// �޸�switchToPreviousCanvas����
function switchToPreviousCanvas() {
    if (currentCanvasIndex > 0 || canvasList.length <= 1) {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        currentCanvasIndex--;
        if (currentCanvasIndex < 0) {
            currentCanvasIndex = canvasList.length - 1; // �л������һ������
        }
        drawCurrentCanvas();
        if (canvasHistoryList[currentCanvasIndex]) {
            history = canvasHistoryList[currentCanvasIndex].history;
            redoHistory = canvasHistoryList[currentCanvasIndex].redoHistory;
        } else {
            history = [];
            redoHistory = [];
        }
    }
}

// �޸�switchToNextCanvas����
function switchToNextCanvas() {
    if (currentCanvasIndex < canvasList.length - 1) {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        currentCanvasIndex++;
        drawCurrentCanvas();
        if (canvasHistoryList[currentCanvasIndex]) {
            history = canvasHistoryList[currentCanvasIndex].history;
            redoHistory = canvasHistoryList[currentCanvasIndex].redoHistory;
        } else {
            history = [];
            redoHistory = [];
        }
    } else {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        const newCanvas = ctx.createImageData(canvas.width, canvas.height);
        canvasList.push(newCanvas);
        currentCanvasIndex = canvasList.length - 1;
        drawCurrentCanvas();
        history = [];
        redoHistory = [];
    }
}


// ������ť����¼�
const leftButton = document.getElementById("leftButton");
leftButton.addEventListener("click", switchToPreviousCanvas);

// �����Ұ�ť����¼�
const rightButton = document.getElementById("rightButton");
rightButton.addEventListener("click", switchToNextCanvas);

// ����Ĭ�ϻ�������������ӵ�canvasList������
const defaultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
canvasList.push(defaultImageData);
currentCanvasIndex = 0;
drawCurrentCanvas();




// ��ʼ��
function initialize() {
    canvasTranslateX = 0;
    canvasTranslateY = 0;
    minCanvasTranslateX = -canvas.width + initialCanvasWidth;
    minCanvasTranslateY = -canvas.height + initialCanvasHeight;
    maxCanvasTranslateX = 0;
    maxCanvasTranslateY = 0;
    canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;
}

// ��ʼ������
initialize();
