import WinBox from 'https://esm.sh/winbox@0.2.6';

import debounce from 'https://esm.sh/lodash-es@4.17.21/debounce';
import isEqual from 'https://esm.sh/lodash-es@4.17.21/isEqual';
import onChange from 'https://esm.sh/on-change@4.0.2';

const bricksIframe = window.bricksIframe || document.getElementById('bricks-builder-iframe');

bricksIframe.addEventListener('load', function () {
    if (window.yabeVueGlobalProp === undefined) {
        window.yabeVueGlobalProp = document.querySelector('.brx-body').__vue_app__.config.globalProperties;
        window.yabeVueGlobalPropIframe = bricksIframe.contentDocument.querySelector('.brx-body').__vue_app__.config.globalProperties;
    }

    init();
});

const window_svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M432 64H208c-8.8 0-16 7.2-16 16V96H128V80c0-44.2 35.8-80 80-80H432c44.2 0 80 35.8 80 80V304c0 44.2-35.8 80-80 80H416V320h16c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16zM0 192c0-35.3 28.7-64 64-64H320c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V192zm64 32c0 17.7 14.3 32 32 32H288c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32 14.3-32 32z"/></svg>`;

const panelSelector = '#bricks-panel';
const structureSelector = '#bricks-structure';
const previewSelector = '#bricks-preview';

let bricksBody = null;
let panel = null;
let structure = null;
let preview = null;
let toolbar = null;

let structurePinController = null;
let panelPinController = null;

let winboxRoot = null;

const winboxOptions = {
    root: winboxRoot,
    class: ['no-full'],
};

/**
 * @typedef WinBoxCollection
 * @type {object}
 * @property {WinBox} structure
 * @property {WinBox} panel
 */

/** @type {WinBoxCollection} */
const winbox = {
    structure: null,
    panel: null,
    preview: null,
};

const winboxState = {
    structure: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    },
    panel: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    },
    preview: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    },
}

const featureSession = {
    save() {
        sessionStorage.setItem('ykf-brx-floating-panel', JSON.stringify(winboxState));
    },
    restore() {
        const session = sessionStorage.getItem('ykf-brx-floating-panel');

        if (!session) {
            return;
        }

        const sessionData = JSON.parse(session);

        winboxState.structure = sessionData.structure;
        winboxState.panel = sessionData.panel;
    }
};

const debouncedSave = debounce(featureSession.save, 5000);

const watchedWinboxState = onChange(winboxState, () => {
    debouncedSave();
});

function init() {
    bricksBody = document.querySelector('div.brx-body.main');
    bricksBody.classList.add('ykf-brx-floating-panel');

    toolbar = document.querySelector('#bricks-toolbar');
    panel = document.querySelector(panelSelector);
    preview = document.querySelector(previewSelector);
    structure = document.querySelector(structureSelector);

    winboxRoot = document.createElement('div');
    winboxRoot.classList.add('ykf-brx-floating-panel-winbox');
    bricksBody.appendChild(winboxRoot);

    winboxOptions.root = winboxRoot;

    featureSession.restore();

    if (winboxState.structure.windowed) {
        createStuctureWindow();
    }

    if (winboxState.panel.windowed) {
        createPanelWindow();
    }

    registerControlElement();
}

function createStuctureWindow() {
    const offsetLeft = structure.offsetLeft;

    winbox.structure = new WinBox({
        ...winboxOptions,
        class: [...winboxOptions.class, 'winbox-structure'],
        title: 'Structure',
        mount: structure,
        width: '300px',
    });

    if (!isEqual(winboxState.structure, {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    })) {
        winbox.structure.resize(watchedWinboxState.structure.width, watchedWinboxState.structure.height);
    } else {
        watchedWinboxState.structure.x = offsetLeft;
        watchedWinboxState.structure.y = winbox.structure.y;
        watchedWinboxState.structure.width = winbox.structure.width;
        watchedWinboxState.structure.height = winbox.structure.height;
    }
    winbox.structure.move(watchedWinboxState.structure.x, watchedWinboxState.structure.y);

    watchedWinboxState.structure.windowed = true;

    winbox.structure.onresize = (width, height) => {
        watchedWinboxState.structure.width = width;
        watchedWinboxState.structure.height = height;
    };

    winbox.structure.onmove = (x, y) => {
        watchedWinboxState.structure.x = x;
        watchedWinboxState.structure.y = y;
    };

    // on close, move the element back to after the #bricks-preview
    winbox.structure.onclose = () => {
        preview.after(structure);
        watchedWinboxState.structure.windowed = false;
    }
}

function createPanelWindow() {
    winbox.panel = new WinBox({
        ...winboxOptions,
        class: [...winboxOptions.class, 'winbox-panel'],
        title: 'Panel',
        mount: panel,
        width: '300px',
    });

    if (!isEqual(winboxState.panel, {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    })) {
        winbox.panel.move(watchedWinboxState.panel.x, watchedWinboxState.panel.y);
        winbox.panel.resize(watchedWinboxState.panel.width, watchedWinboxState.panel.height);
    } else {
        watchedWinboxState.panel.x = winbox.panel.x;
        watchedWinboxState.panel.y = winbox.panel.y;
        watchedWinboxState.panel.width = winbox.panel.width;
        watchedWinboxState.panel.height = winbox.panel.height;
    }

    watchedWinboxState.panel.windowed = true;

    winbox.panel.onresize = (width, height) => {
        watchedWinboxState.panel.width = width;
        watchedWinboxState.panel.height = height;
    };

    winbox.panel.onmove = (x, y) => {
        watchedWinboxState.panel.x = x;
        watchedWinboxState.panel.y = y;
    };

    // on close, move the element back to after the #bricks-toolbar
    winbox.panel.onclose = () => {
        toolbar.after(panel);
        watchedWinboxState.panel.windowed = false;
    };
}

function createPreviewWindow() {
    winbox.panel = new WinBox({
        ...winboxOptions,
        class: [...winboxOptions.class, 'winbox-preview'],
        title: 'Preview',
        mount: preview,
        width: '300px',
    });

    if (!isEqual(winboxState.panel, {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
        windowed: false,
    })) {
        winbox.panel.move(watchedWinboxState.panel.x, watchedWinboxState.panel.y);
        winbox.panel.resize(watchedWinboxState.panel.width, watchedWinboxState.panel.height);
    } else {
        watchedWinboxState.panel.x = winbox.panel.x;
        watchedWinboxState.panel.y = winbox.panel.y;
        watchedWinboxState.panel.width = winbox.panel.width;
        watchedWinboxState.panel.height = winbox.panel.height;
    }

    watchedWinboxState.panel.windowed = true;

    winbox.panel.onresize = (width, height) => {
        watchedWinboxState.panel.width = width;
        watchedWinboxState.panel.height = height;
    };

    winbox.panel.onmove = (x, y) => {
        watchedWinboxState.panel.x = x;
        watchedWinboxState.panel.y = y;
    };

    // on close, move the element back to after the #bricks-toolbar
    winbox.panel.onclose = () => {
        toolbar.after(panel);
        watchedWinboxState.panel.windowed = false;
    };
}

/**
 * Add the handle
 */
function registerControlElement() {
    // Structure
    const structureControllerContainer = document.querySelector('#bricks-structure');

    structurePinController = document.createElement('div');
    structurePinController.classList.add('detach-window');
    structurePinController.setAttribute('data-balloon', 'Detach window');
    structurePinController.setAttribute('data-balloon-pos', 'bottom-right');
    structurePinController.innerHTML = window_svg;

    structureControllerContainer.appendChild(structurePinController);

    structurePinController.addEventListener('click', () => {
        createStuctureWindow();
    });

    // Panel
    const panelControllerContainer = document.querySelector('#bricks-panel');

    panelPinController = document.createElement('div');
    panelPinController.classList.add('detach-window');
    panelPinController.setAttribute('data-balloon', 'Detach window');
    panelPinController.setAttribute('data-balloon-pos', 'bottom-right');
    panelPinController.innerHTML = window_svg;

    panelControllerContainer.appendChild(panelPinController);

    panelPinController.addEventListener('click', () => {
        createPanelWindow();
    });
}
