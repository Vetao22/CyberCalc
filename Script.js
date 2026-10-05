/**
 * CYBERPUNK NEON CALCULATOR
 * Includes multi-mode layout switching, i18n support, live evaluation,
 * and time-travel history navigation.
 */

// --- Internationalization Configuration (i18n) ---
const i18n = {
    'en-US': {
        title: 'CYBER.CALC',
        basic: 'Basic',
        scientific: 'Scientific',
        financial: 'Financial',
        historyTitle: 'Time-Travel Log',
        emptyHistory: 'No history records found.',
        calcError: 'Error'
    },
    'pt-BR': {
        title: 'CYBER.CALC',
        basic: 'Básico',
        scientific: 'Científica',
        financial: 'Financeira',
        historyTitle: 'Histórico Temporal',
        emptyHistory: 'Nenhum histórico registrado.',
        calcError: 'Erro'
    }
};

let currentLang = 'pt-BR'; // Default language

// --- Core Calculator State Variables ---
let currentMode = 'basic';
let currentExpression = '';
let lastResult = null;
let isEvaluated = false;
let calcHistory = [];

// --- DOM Elements Reference ---
const exprDisplay = document.getElementById('expr-display');
const mainDisplay = document.getElementById('main-display');
const previewDisplay = document.getElementById('preview-display');
const keypad = document.getElementById('keypad');
const historyDrawer = document.getElementById('history-drawer');
const historyList = document.getElementById('history-list');

// --- Keypad Layout Definitions ---
const layouts = {
    basic: [
        { label: 'C', type: 'btn-action', action: 'clear' },
        { label: 'DEL', type: 'btn-action', action: 'backspace' },
        { label: '%', type: 'btn-op', val: '%' },
        { label: '÷', type: 'btn-op', val: '/' },
        { label: '7', type: '' }, { label: '8', type: '' }, { label: '9', type: '' },
        { label: '×', type: 'btn-op', val: '*' },
        { label: '4', type: '' }, { label: '5', type: '' }, { label: '6', type: '' },
        { label: '-', type: 'btn-op', val: '-' },
        { label: '1', type: '' }, { label: '2', type: '' }, { label: '3', type: '' },
        { label: '+', type: 'btn-op', val: '+' },
        { label: '±', type: 'btn-action', action: 'negate' },
        { label: '0', type: '' },
        { label: '.', type: '' },
        { label: '=', type: 'btn-equals', action: 'evaluate' }
    ],
    scientific: [
        { label: 'C', type: 'btn-action', action: 'clear' },
        { label: 'DEL', type: 'btn-action', action: 'backspace' },
        { label: 'sin', type: 'btn-func', val: 'sin(' },
        { label: 'cos', type: 'btn-func', val: 'cos(' },
        { label: 'tan', type: 'btn-func', val: 'tan(' },
        { label: '(', type: 'btn-op', val: '(' },
        { label: ')', type: 'btn-op', val: ')' },
        { label: '√', type: 'btn-func', val: 'sqrt(' },
        { label: '^', type: 'btn-op', val: '^' },
        { label: '÷', type: 'btn-op', val: '/' },
        { label: '7', type: '' }, { label: '8', type: '' }, { label: '9', type: '' },
        { label: 'ln', type: 'btn-func', val: 'ln(' },
        { label: '×', type: 'btn-op', val: '*' },
        { label: '4', type: '' }, { label: '5', type: '' }, { label: '6', type: '' },
        { label: 'log', type: 'btn-func', val: 'log(' },
        { label: '-', type: 'btn-op', val: '-' },
        { label: '1', type: '' }, { label: '2', type: '' }, { label: '3', type: '' },
        { label: 'π', type: 'btn-func', val: 'π' },
        { label: '+', type: 'btn-op', val: '+' },
        { label: '0', type: '' }, { label: '.', type: '' },
        { label: 'e', type: 'btn-func', val: 'e' },
        { label: '=', type: 'btn-equals', action: 'evaluate' }
    ],
    financial: [
        { label: 'C', type: 'btn-action', action: 'clear' },
        { label: 'DEL', type: 'btn-action', action: 'backspace' },
        { label: 'CI', type: 'btn-func', action: 'compound_interest', title: 'Compound Interest' },
        { label: 'PMT', type: 'btn-func', action: 'annuity_payment', title: 'Annuity Payment' },
        { label: '7', type: '' }, { label: '8', type: '' }, { label: '9', type: '' },
        { label: '÷', type: 'btn-op', val: '/' },
        { label: '4', type: '' }, { label: '5', type: '' }, { label: '6', type: '' },
        { label: '×', type: 'btn-op', val: '*' },
        { label: '1', type: '' }, { label: '2', type: '' }, { label: '3', type: '' },
        { label: '-', type: 'btn-op', val: '-' },
        { label: '0', type: '' }, { label: '.', type: '' },
        { label: '%', type: 'btn-op', val: '%' },
        { label: '+', type: 'btn-op', val: '+' },
        { label: '=', type: 'btn-equals', action: 'evaluate' }
    ]
};

/**
 * Render the buttons dynamically for the selected mode
 */
function renderKeypad() {
    keypad.innerHTML = '';
    keypad.className = 'keypad-grid ' + currentMode;

    layouts[currentMode].forEach(btn => {
        const buttonEl = document.createElement('button');
        buttonEl.className = `btn ${btn.type || ''}`;
        buttonEl.innerText = btn.label;

        if (btn.action) {
            buttonEl.addEventListener('click', () => handleAction(btn.action));
        } else if (btn.val !== undefined) {
            buttonEl.addEventListener('click', () => handleInput(btn.val));
        } else {
            buttonEl.addEventListener('click', () => handleInput(btn.label));
        }

        keypad.appendChild(buttonEl);
    });
}

/**
 * Handle basic symbol and number inputs
 */
function handleInput(val) {
    if (isEvaluated) {
        if (['+', '-', '*', '/', '^', '%'].includes(val)) {
            currentExpression = lastResult !== null ? lastResult.toString() : '';
        } else {
            currentExpression = '';
        }
        isEvaluated = false;
    }
    currentExpression += val;
    updateDisplay();
}

/**
 * Handle special action buttons
 */
function handleAction(action) {
    switch (action) {
        case 'clear':
            currentExpression = '';
            lastResult = null;
            isEvaluated = false;
            previewDisplay.innerText = '';
            break;
        case 'backspace':
            if (isEvaluated) {
                currentExpression = '';
                isEvaluated = false;
            } else {
                currentExpression = currentExpression.slice(0, -1);
            }
            break;
        case 'negate':
            if (currentExpression) {
                if (currentExpression.startsWith('-')) {
                    currentExpression = currentExpression.slice(1);
                } else {
                    currentExpression = '-' + currentExpression;
                }
            }
            break;
        case 'evaluate':
            evaluateExpression();
            return;
        case 'compound_interest':
            // Pre-fill compound interest expression example: P*(1+r)^n
            currentExpression = '1000*(1+0.05)^5';
            break;
        case 'annuity_payment':
            // Pre-fill annuity payment formula example
            currentExpression = '(10000*0.05)/(1-(1+0.05)^-10)';
            break;
    }
    updateDisplay();
}

/**
 * Parse mathematical string and execute evaluation safely
 */
function parseAndCompute(expr) {
    if (!expr) return '';
    
    // Convert human-readable symbols to Javascript Math syntax
    let parsed = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/\^/g, '**')
        .replace(/(\d+)%/g, '($1/100)');

    try {
        const result = new Function(`'use strict'; return (${parsed})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return Number.isInteger(result) ? result : parseFloat(result.toFixed(8));
        }
        return i18n[currentLang].calcError;
    } catch (err) {
        return null;
    }
}

/**
 * Update current UI screen state
 */
function updateDisplay() {
    mainDisplay.innerText = currentExpression || '0';
    exprDisplay.innerText = isEvaluated ? currentExpression : '';

    if (currentExpression && !isEvaluated) {
        const preview = parseAndCompute(currentExpression);
        previewDisplay.innerText = (preview !== null && preview !== i18n[currentLang].calcError) ? `= ${preview}` : '';
    } else {
        previewDisplay.innerText = '';
    }
}

/**
 * Calculate final result and save to history
 */
function evaluateExpression() {
    if (!currentExpression) return;

    const res = parseAndCompute(currentExpression);

    if (res !== null && res !== i18n[currentLang].calcError) {
        calcHistory.unshift({
            expression: currentExpression,
            result: res
        });

        exprDisplay.innerText = currentExpression + ' =';
        lastResult = res;
        currentExpression = res.toString();
        mainDisplay.innerText = currentExpression;
        previewDisplay.innerText = '';
        isEvaluated = true;
        renderHistory();
    } else {
        mainDisplay.innerText = i18n[currentLang].calcError;
    }
}

/**
 * Render history drawer items with Time-Travel click binding
 */
function renderHistory() {
    historyList.innerHTML = '';

    if (calcHistory.length === 0) {
        historyList.innerHTML = `<div class="history-empty">${i18n[currentLang].emptyHistory}</div>`;
        return;
    }

    calcHistory.forEach((item) => {
        const historyEl = document.createElement('div');
        historyEl.className = 'history-item';
        historyEl.innerHTML = `
            <div class="history-expr">${item.expression}</div>
            <div class="history-res">= ${item.result}</div>
        `;

        // TIME-TRAVEL EVENT: Restore calculation state on click
        historyEl.addEventListener('click', () => {
            currentExpression = item.expression;
            lastResult = item.result;
            isEvaluated = false;
            updateDisplay();
            historyDrawer.classList.remove('open');
        });

        historyList.appendChild(historyEl);
    });
}

/**
 * Switch active language (pt-BR / en-US)
 */
function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('app-title').innerText = i18n[lang].title;
    document.getElementById('mode-basic').innerText = i18n[lang].basic;
    document.getElementById('mode-sci').innerText = i18n[lang].scientific;
    document.getElementById('mode-fin').innerText = i18n[lang].financial;
    document.getElementById('history-head-label').innerText = i18n[lang].historyTitle;
    renderHistory();
}

// --- Event Listeners Initialization ---

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMode = e.target.dataset.mode;
        renderKeypad();
    });
});

document.getElementById('lang-toggle').addEventListener('click', () => {
    setLanguage(currentLang === 'pt-BR' ? 'en-US' : 'pt-BR');
});

document.getElementById('history-toggle').addEventListener('click', () => {
    historyDrawer.classList.add('open');
});

document.getElementById('close-history').addEventListener('click', () => {
    historyDrawer.classList.remove('open');
});

document.getElementById('clear-history').addEventListener('click', () => {
    calcHistory = [];
    renderHistory();
});

// Physical Keyboard Support
window.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        handleInput(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleInput(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleAction('evaluate');
    } else if (e.key === 'Backspace') {
        handleAction('backspace');
    } else if (e.key === 'Escape') {
        handleAction('clear');
    }
});

// Start Application
window.onload = function() {
    setLanguage('pt-BR');
    renderKeypad();
    updateDisplay();
};