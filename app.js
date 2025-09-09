// Detective Novel Timetable - Enhanced with Auto-Save, Reset, and Memo functionality
class DetectiveTimetableStorage {
    constructor() {
        // In-memory storage since localStorage is not available in sandbox
        this.storage = {
            characters: ["登場人物A", "登場人物B", "登場人物C"],
            memos: ["", "", ""],
            timeRows: ["08:00", "09:00", "10:00", "11:00", "12:00"],
            cellData: {},
            lastSaved: null
        };
    }

    // Save data to in-memory storage
    saveData(data) {
        this.storage = { ...data, lastSaved: new Date().toISOString() };
        return true;
    }

    // Load data from in-memory storage
    loadData() {
        return this.storage;
    }

    // Clear all data
    clearData() {
        this.storage = {
            characters: ["登場人物A", "登場人物B", "登場人物C"],
            memos: ["", "", ""],
            timeRows: ["08:00", "09:00", "10:00", "11:00", "12:00"],
            cellData: {},
            lastSaved: null
        };
    }
}

class DetectiveTimetable {
    constructor() {
        // 要素の初期化
        this.lastSavedText = this.getOrCreateElement('lastSavedText', 'last-saved-text');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.table = document.querySelector('.timetable');
        this.nameRow = this.table.querySelector('.name-row');
        this.memoRow = this.table.querySelector('.memo-row');
        this.tableBody = this.table.querySelector('tbody');
        this.resetModal = document.getElementById('resetModal');
        this.saveIndicator = document.getElementById('saveIndicator');

        // Initialize storage
        this.storage = new DetectiveTimetableStorage();

        // Auto-save debounce timer
        this.saveTimeout = null;

        // イベント処理のバインド
        this.handleMoveClick = this.handleMoveClick.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        this.init();
    }

    getOrCreateElement(id, className) {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement('div');
            element.id = id;
            element.className = className;
            document.body.appendChild(element);
        }
        return element;
    }

    init() {
        this.loadSavedData();
        this.setupEventListeners();
        this.setupResetModal();
        this.addInitialAnimations();
        this.updateLastSavedIndicator();
        this.setupMemoAutoResize();
        this.updateTimeSelectOptions();
        // 初期化後にプレースホルダーを削除
        this.removeAllPlaceholders();
    }

    // すべてのプレースホルダーを削除
    removeAllPlaceholders() {
        const activityCells = document.querySelectorAll('.activity-cell');
        activityCells.forEach(cell => {
            cell.removeAttribute('data-placeholder');
        });
    }

    // シンプルなイベントリスナー設定
    setupEventListeners() {
        // 管理ボタン
        this.setupManagementButtons();

        // 統一されたイベント委譲
        this.setupEventDelegation();

        // ボタンのホバー効果
        this.addButtonHoverEffects();
    }

    setupManagementButtons() {
        const addButton = document.getElementById('addButton');
        const removeButton = document.getElementById('removeButton');
        const addTimeButton = document.getElementById('addTimeButton');
        const removeTimeButton = document.getElementById('removeTimeButton');

        if (addButton) {
            addButton.addEventListener('click', () => {
                this.showLoading();
                setTimeout(() => this.addCharacter(), 300);
            });
        }

        if (removeButton) {
            removeButton.addEventListener('click', () => {
                this.showLoading();
                setTimeout(() => this.removeCharacters(), 300);
            });
        }

        if (addTimeButton) {
            addTimeButton.addEventListener('click', () => {
                this.showLoading();
                setTimeout(() => this.addTimeRows(), 300);
            });
        }

        if (removeTimeButton) {
            removeTimeButton.addEventListener('click', () => {
                this.showLoading();
                setTimeout(() => this.removeTimeRows(), 300);
            });
        }
    }

    setupEventDelegation() {
        // クリックイベント（移動ボタン用）
        document.addEventListener('click', this.handleMoveClick);

        // 入力イベント
        document.addEventListener('input', this.handleInput);

        // フォーカスイベント
        document.addEventListener('focus', this.handleFocus, true);

        // ブラーイベント
        document.addEventListener('blur', this.handleBlur, true);
    }

    handleMoveClick(e) {
        const target = e.target;
        
        if (target.classList.contains('move-left')) {
            e.preventDefault();
            e.stopPropagation();
            const columnIndex = this.getColumnIndex(target);
            if (columnIndex !== -1) {
                this.moveColumnLeft(columnIndex);
            }
        } else if (target.classList.contains('move-right')) {
            e.preventDefault();
            e.stopPropagation();
            const columnIndex = this.getColumnIndex(target);
            if (columnIndex !== -1) {
                this.moveColumnRight(columnIndex);
            }
        }
    }

    handleInput(e) {
        const target = e.target;
        
        if (target.classList.contains('character-name-input')) {
            this.autoSave();
            this.animateInput(target);
        } else if (target.classList.contains('character-memo-textarea')) {
            this.adjustTextareaHeight(target);
            this.autoSave();
            this.animateInput(target);
        } else if (target.classList.contains('activity-cell')) {
            this.autoSave();
            this.animateInput(target);
        }
    }

    handleFocus(e) {
        const target = e.target;
        
        if (target.classList.contains('character-name-input')) {
            const parent = target.closest('.character-header');
            if (parent) parent.style.background = 'rgba(255, 215, 0, 0.1)';
        } else if (target.classList.contains('character-memo-textarea')) {
            const parent = target.closest('.character-memo-header');
            if (parent) parent.style.background = 'rgba(255, 215, 0, 0.1)';
        } else if (target.classList.contains('activity-cell')) {
            target.style.background = 'rgba(255, 215, 0, 0.1)';
            target.style.transform = 'scale(1.02)';
        }
    }

    handleBlur(e) {
        const target = e.target;
        
        if (target.classList.contains('character-name-input')) {
            const parent = target.closest('.character-header');
            if (parent) parent.style.background = '';
        } else if (target.classList.contains('character-memo-textarea')) {
            const parent = target.closest('.character-memo-header');
            if (parent) parent.style.background = '';
        } else if (target.classList.contains('activity-cell')) {
            target.style.background = '';
            target.style.transform = 'scale(1)';
        }
    }

    animateInput(target) {
        if (target.classList.contains('activity-cell')) {
            target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            setTimeout(() => {
                target.style.borderColor = '';
            }, 1000);
        } else {
            target.style.transform = 'scale(1.02)';
            setTimeout(() => {
                target.style.transform = 'scale(1)';
            }, 150);
        }
    }

    // 列インデックスの取得を修正
    getColumnIndex(button) {
        try {
            const header = button.closest('.character-header');
            if (!header) {
                console.error('Header not found for button:', button);
                return -1;
            }

            const headers = Array.from(this.nameRow.querySelectorAll('.character-header'));
            const index = headers.indexOf(header);
            
            console.log('Found column index:', index, 'for button:', button);
            return index;
        } catch (error) {
            console.error('Error getting column index:', error);
            return -1;
        }
    }

    // 簡潔な列移動メソッド
    moveColumnLeft(columnIndex) {
        const totalColumns = this.nameRow.querySelectorAll('.character-header').length;
        const targetIndex = columnIndex === 0 ? totalColumns - 1 : columnIndex - 1;
        this.swapColumns(columnIndex, targetIndex);
    }

    moveColumnRight(columnIndex) {
        const totalColumns = this.nameRow.querySelectorAll('.character-header').length;
        const targetIndex = columnIndex === totalColumns - 1 ? 0 : columnIndex + 1;
        this.swapColumns(columnIndex, targetIndex);
    }

    // データベースの列交換（DOM操作なし）
    swapColumns(index1, index2) {
        try {
            console.log('Swapping columns:', index1, '↔', index2);

            // データを抽出
            const column1Data = this.extractColumnData(index1);
            const column2Data = this.extractColumnData(index2);

            console.log('Column 1 data:', column1Data);
            console.log('Column 2 data:', column2Data);

            // データを交換
            this.setColumnData(index1, column2Data);
            this.setColumnData(index2, column1Data);

            // 保存して通知
            this.autoSave();
            this.showNotification('列を移動しました', 'success');

        } catch (error) {
            console.error('Error swapping columns:', error);
            this.showNotification('列の移動に失敗しました', 'error');
        }
    }

    // 列データの抽出
    extractColumnData(columnIndex) {
        const nameHeaders = this.nameRow.querySelectorAll('.character-header');
        const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
        const bodyRows = this.tableBody.querySelectorAll('tr');

        if (!nameHeaders[columnIndex] || !memoHeaders[columnIndex]) {
            throw new Error(`Invalid column index: ${columnIndex}`);
        }

        const nameInput = nameHeaders[columnIndex].querySelector('.character-name-input');
        const memoTextarea = memoHeaders[columnIndex].querySelector('.character-memo-textarea');

        const activities = Array.from(bodyRows).map(row => {
            const cells = row.querySelectorAll('.activity-cell');
            return cells[columnIndex] ? cells[columnIndex].textContent : '';
        });

        return {
            name: nameInput ? nameInput.value : '',
            memo: memoTextarea ? memoTextarea.value : '',
            activities: activities
        };
    }

    // 列データの設定
    setColumnData(columnIndex, data) {
        const nameHeaders = this.nameRow.querySelectorAll('.character-header');
        const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
        const bodyRows = this.tableBody.querySelectorAll('tr');

        // 名前を設定
        const nameInput = nameHeaders[columnIndex].querySelector('.character-name-input');
        if (nameInput) {
            nameInput.value = data.name || '';
        }

        // メモを設定
        const memoTextarea = memoHeaders[columnIndex].querySelector('.character-memo-textarea');
        if (memoTextarea) {
            memoTextarea.value = data.memo || '';
            this.adjustTextareaHeight(memoTextarea);
        }

        // 活動内容を設定
        bodyRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('.activity-cell');
            if (cells[columnIndex] && data.activities && data.activities[rowIndex] !== undefined) {
                cells[columnIndex].textContent = data.activities[rowIndex];
            }
        });
    }

    // Load saved data on page load
    loadSavedData() {
        const data = this.storage.loadData();
        if (data && data.characters && data.characters.length > 0) {
            this.restoreTableFromData(data);
        }
    }

    // Restore table from saved data
    restoreTableFromData(data) {
        this.clearTable();

        data.characters.forEach((characterName, index) => {
            if (index < 3) {
                const characterInputs = this.nameRow.querySelectorAll('.character-name-input');
                if (characterInputs[index]) {
                    characterInputs[index].value = characterName;
                }
            } else {
                this.addCharacterColumn(characterName, false);
            }
        });

        if (data.memos) {
            data.memos.forEach((memo, index) => {
                const memoTextareas = this.memoRow.querySelectorAll('.character-memo-textarea');
                if (memoTextareas[index]) {
                    memoTextareas[index].value = memo;
                    this.adjustTextareaHeight(memoTextareas[index]);
                }
            });
        }

        data.timeRows.forEach((time, index) => {
            if (index < 5) {
                const timeDisplays = this.tableBody.querySelectorAll('.time-display');
                if (timeDisplays[index]) {
                    timeDisplays[index].textContent = time;
                }
            } else {
                this.addTimeRowDirect(time, data.characters.length);
            }
        });

        if (data.cellData) {
            Object.entries(data.cellData).forEach(([cellId, content]) => {
                const [, rowIndex, colIndex] = cellId.split('-').map(Number);
                const rows = this.tableBody.querySelectorAll('tr');
                if (rows[rowIndex]) {
                    const cells = rows[rowIndex].querySelectorAll('.activity-cell');
                    if (cells[colIndex]) {
                        cells[colIndex].textContent = content;
                    }
                }
            });
        }
    }

    clearTable() {
        const characterHeaders = this.nameRow.querySelectorAll('.character-header');
        for (let i = 3; i < characterHeaders.length; i++) {
            characterHeaders[i].remove();
        }

        const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
        for (let i = 3; i < memoHeaders.length; i++) {
            memoHeaders[i].remove();
        }

        const timeRows = this.tableBody.querySelectorAll('tr');
        for (let i = 5; i < timeRows.length; i++) {
            timeRows[i].remove();
        }

        const activityCells = this.tableBody.querySelectorAll('.activity-cell');
        activityCells.forEach(cell => {
            cell.textContent = '';
        });

        timeRows.forEach(row => {
            const cells = row.querySelectorAll('.activity-cell');
            for (let i = 3; i < cells.length; i++) {
                cells[i].remove();
            }
        });
    }

    saveCurrentState() {
        const characters = [];
        const characterInputs = this.nameRow.querySelectorAll('.character-name-input');
        characterInputs.forEach(input => {
            characters.push(input.value || 'New Character');
        });

        const memos = [];
        const memoTextareas = this.memoRow.querySelectorAll('.character-memo-textarea');
        memoTextareas.forEach(textarea => {
            memos.push(textarea.value || '');
        });

        const timeRows = [];
        const timeDisplays = this.tableBody.querySelectorAll('.time-display');
        timeDisplays.forEach(display => {
            timeRows.push(display.textContent);
        });

        const cellData = {};
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('.activity-cell');
            cells.forEach((cell, colIndex) => {
                const content = cell.textContent.trim();
                if (content) {
                    cellData[`row-${rowIndex}-col-${colIndex}`] = content;
                }
            });
        });

        const data = { characters, memos, timeRows, cellData };
        this.storage.saveData(data);
        this.showSaveIndicator();
        this.updateLastSavedIndicator();
    }

    autoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentState();
        }, 1000);
    }

    showSaveIndicator() {
        if (this.saveIndicator) {
            this.saveIndicator.classList.remove('hidden');
            setTimeout(() => {
                this.saveIndicator.classList.add('hidden');
            }, 1500);
        }
    }

    updateLastSavedIndicator() {
        if (!this.lastSavedText) return;

        const data = this.storage.loadData();
        if (data && data.lastSaved) {
            const date = new Date(data.lastSaved);
            const formatted = date.toLocaleString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            this.lastSavedText.textContent = `最終保存: ${formatted}`;
        } else {
            this.lastSavedText.textContent = '最終保存: 未保存';
        }
    }

    setupResetModal() {
        const resetButton = document.getElementById('resetButton');
        const confirmReset = document.getElementById('confirmReset');
        const cancelReset = document.getElementById('cancelReset');
        
        if (!this.resetModal || !resetButton || !confirmReset || !cancelReset) return;

        const modalBackdrop = this.resetModal.querySelector('.modal-backdrop');

        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetModal.classList.remove('hidden');
        });

        confirmReset.addEventListener('click', (e) => {
            e.preventDefault();
            this.performReset();
            this.resetModal.classList.add('hidden');
        });

        cancelReset.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetModal.classList.add('hidden');
        });

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => {
                this.resetModal.classList.add('hidden');
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.resetModal.classList.contains('hidden')) {
                this.resetModal.classList.add('hidden');
            }
        });
    }

    performReset() {
        this.showLoading();

        setTimeout(() => {
            this.storage.clearData();
            this.clearTable();

            const characterInputs = this.nameRow.querySelectorAll('.character-name-input');
            const defaultNames = ['登場人物A', '登場人物B', '登場人物C'];
            characterInputs.forEach((input, index) => {
                input.value = defaultNames[index] || `登場人物${index + 1}`;
            });

            const memoTextareas = this.memoRow.querySelectorAll('.character-memo-textarea');
            memoTextareas.forEach((textarea) => {
                textarea.value = '';
                textarea.rows = 2;
            });

            const timeDisplays = this.tableBody.querySelectorAll('.time-display');
            const defaultTimes = ['08:00', '09:00', '10:00', '11:00', '12:00'];
            timeDisplays.forEach((display, index) => {
                display.textContent = defaultTimes[index] || '12:00';
            });

            // プレースホルダーを削除
            this.removeAllPlaceholders();

            this.updateLastSavedIndicator();
            this.showNotification('データがリセットされました', 'success');
        }, 500);
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
            setTimeout(() => this.hideLoading(), 800);
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    setupMemoAutoResize() {
        const memoTextareas = document.querySelectorAll('.character-memo-textarea');
        memoTextareas.forEach(textarea => {
            this.adjustTextareaHeight(textarea);
        });
    }

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const minHeight = 32;
        const maxHeight = 80;
        textarea.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    }

    addInitialAnimations() {
        const elements = document.querySelectorAll('.control-group, .timetable-container');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    updateTimeSelectOptions() {
        const timeSelect = document.getElementById('insert-time');
        if (!timeSelect) return;

        const existingTimes = Array.from(this.tableBody.querySelectorAll('.time-display'))
            .map(td => td.textContent)
            .sort();

        timeSelect.innerHTML = '';
        existingTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }

    addButtonHoverEffects() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    addCharacter() {
        this.addCharacterColumn('新しい登場人物', true);
    }

    addCharacterColumn(characterName = '新しい登場人物', shouldAutoSave = true) {
        const newNameHeader = document.createElement('th');
        newNameHeader.className = 'character-header';
        newNameHeader.innerHTML = `
            <div class="character-name-row">
                <input type="text" class="character-name-input" value="${characterName}" placeholder="登場人物名">
            </div>
            <div class="character-controls-row">
                <button class="move-btn move-left" type="button" title="左に移動">‹</button>
                <input type="checkbox" class="delete-checkbox">
                <button class="move-btn move-right" type="button" title="右に移動">›</button>
            </div>
        `;
        this.nameRow.appendChild(newNameHeader);

        const newMemoHeader = document.createElement('th');
        newMemoHeader.className = 'character-memo-header';
        newMemoHeader.innerHTML = `
            <textarea class="character-memo-textarea" placeholder="メモ..." rows="2"></textarea>
        `;
        this.memoRow.appendChild(newMemoHeader);

        const existingRows = this.tableBody.querySelectorAll('tr');
        existingRows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.className = 'activity-cell';
            newCell.contentEditable = true;
            // プレースホルダーは設定しない
            row.appendChild(newCell);
        });

        const newMemoTextarea = newMemoHeader.querySelector('.character-memo-textarea');
        this.adjustTextareaHeight(newMemoTextarea);

        if (shouldAutoSave) {
            this.autoSave();
            this.showNotification('登場人物を追加しました', 'success');
        }

        this.hideLoading();
    }

    removeCharacters() {
        const checkboxes = document.querySelectorAll('.delete-checkbox:checked');
        if (checkboxes.length === 0) {
            this.showNotification('削除する登場人物を選択してください', 'warning');
            this.hideLoading();
            return;
        }

        const indicesToRemove = Array.from(checkboxes).map(checkbox => {
            const header = checkbox.closest('.character-header');
            const headers = Array.from(this.nameRow.querySelectorAll('.character-header'));
            return headers.indexOf(header);
        }).sort((a, b) => b - a);

        indicesToRemove.forEach(index => {
            const nameHeaders = this.nameRow.querySelectorAll('.character-header');
            if (nameHeaders[index]) nameHeaders[index].remove();

            const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
            if (memoHeaders[index]) memoHeaders[index].remove();

            const rows = this.tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('.activity-cell');
                if (cells[index]) cells[index].remove();
            });
        });

        this.autoSave();
        this.showNotification(`${indicesToRemove.length}名の登場人物を削除しました`, 'success');
        this.hideLoading();
    }

    addTimeRows() {
        const intervalSelect = document.getElementById('time-interval');
        const timeSelect = document.getElementById('insert-time');
        const directionRadios = document.querySelectorAll('input[name="insert-direction"]');
        
        if (!intervalSelect || !timeSelect || !directionRadios.length) {
            this.hideLoading();
            return;
        }

        const interval = parseInt(intervalSelect.value);
        const baseTime = timeSelect.value;
        const direction = Array.from(directionRadios).find(radio => radio.checked).value;

        if (!baseTime) {
            this.showNotification('挿入位置を選択してください', 'warning');
            this.hideLoading();
            return;
        }

        const [baseHour, baseMinute] = baseTime.split(':').map(Number);
        const baseDate = new Date(2000, 0, 1, baseHour, baseMinute);

        const newDate = new Date(baseDate);
        if (direction === 'after') {
            newDate.setMinutes(newDate.getMinutes() + interval);
        } else {
            newDate.setMinutes(newDate.getMinutes() - interval);
        }

        const newTime = String(newDate.getHours()).padStart(2, '0') + ':' + 
                       String(newDate.getMinutes()).padStart(2, '0');

        const existingTimes = Array.from(this.tableBody.querySelectorAll('.time-display'))
            .map(td => td.textContent);
        
        if (existingTimes.includes(newTime)) {
            this.showNotification('その時間は既に存在します', 'warning');
            this.hideLoading();
            return;
        }

        const characterCount = this.nameRow.querySelectorAll('.character-header').length;
        this.addTimeRowDirect(newTime, characterCount);
        this.updateTimeSelectOptions();

        this.autoSave();
        this.showNotification('時間行を追加しました', 'success');
        this.hideLoading();
    }

    addTimeRowDirect(time, characterCount) {
        const newRow = document.createElement('tr');
        newRow.className = 'table-row';

        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `
            <div class="time-cell-content">
                <span class="time-display">${time}</span>
                <button class="move-btn move-left" title="上に移動">↑</button>
                <button class="move-btn move-right" title="下に移動">↓</button>
                <input type="checkbox" class="delete-checkbox">
            </div>
        `;
        newRow.appendChild(timeCell);

        for (let i = 0; i < characterCount; i++) {
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-cell';
            activityCell.contentEditable = true;
            // プレースホルダーは設定しない
            newRow.appendChild(activityCell);
        }

        this.tableBody.appendChild(newRow);
    }

    removeTimeRows() {
        const checkboxes = this.tableBody.querySelectorAll('.delete-checkbox:checked');
        if (checkboxes.length === 0) {
            this.showNotification('削除する時間行を選択してください', 'warning');
            this.hideLoading();
            return;
        }

        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row) row.remove();
        });

        this.updateTimeSelectOptions();
        this.autoSave();
        this.showNotification(`${checkboxes.length}行を削除しました`, 'success');
        this.hideLoading();
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const timetable = new DetectiveTimetable();
    window.timetable = timetable; // デバッグ用
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetectiveTimetable;
}