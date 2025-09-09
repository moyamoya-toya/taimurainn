// Detective Novel Timetable - Enhanced with Auto-Save, Reset, and Memo functionality
class DetectiveTimetableStorage {
    constructor(storageKey = 'detectiveTimetableData') {
        this.storageKey = storageKey;
        this.initialData = {
            characters: ["人物A", "人物B", "人物C"],
            memos: ["", "", ""],
            timeRows: ["08:00", "09:00", "10:00", "11:00", "12:00"],
            cellData: {},
            lastSaved: null
        };
    }

    // Save data to localStorage
    saveData(data) {
        try {
            const dataToSave = { ...data, lastSaved: new Date().toISOString() };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
            return false;
        }
    }

    // Load data from localStorage
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
        }
        // Return initial data if nothing is saved or an error occurs
        return this.initialData;
    }

    // Clear data from localStorage
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error("Error clearing data from localStorage:", error);
        }
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
        // Only restore if the data has been saved before (check lastSaved)
        if (data && data.lastSaved) {
            this.restoreTableFromData(data);
        }
    }

    // Restore table from saved data
    restoreTableFromData(data) {
        // 1. Clear the dynamic parts of the table
        this.tableBody.innerHTML = ''; // Clear all time rows and their cells

        // Clear existing character columns (except the static "Time" header)
        const characterHeaders = this.nameRow.querySelectorAll('.character-header');
        characterHeaders.forEach(h => h.remove());
        const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
        memoHeaders.forEach(h => h.remove());

        // 2. Re-create character columns and restore their data
        data.characters.forEach((characterName, index) => {
            // Create and add the character column header
            const newNameHeader = document.createElement('th');
            newNameHeader.className = 'character-header';
            newNameHeader.innerHTML = `
                <div class="character-name-row">
                    <input type="text" class="character-name-input" value="${characterName}" placeholder="人物名">
                </div>
                <div class="character-controls-row">
                    <button class="move-btn move-left" type="button" title="左に移動">‹</button>
                    <input type="checkbox" class="delete-checkbox">
                    <button class="move-btn move-right" type="button" title="右に移動">›</button>
                </div>
            `;
            this.nameRow.appendChild(newNameHeader);

            // Create and add the memo header
            const newMemoHeader = document.createElement('th');
            newMemoHeader.className = 'character-memo-header';
            const memo = (data.memos && data.memos[index]) ? data.memos[index] : '';
            newMemoHeader.innerHTML = `
                <textarea class="character-memo-textarea" placeholder="メモ..." rows="2">${memo}</textarea>
            `;
            this.memoRow.appendChild(newMemoHeader);
            this.adjustTextareaHeight(newMemoHeader.querySelector('textarea'));
        });

        // 3. Re-create time rows
        const characterCount = data.characters.length;
        data.timeRows.forEach(time => {
            const newRow = this.createTimeRow(time, characterCount);
            this.tableBody.appendChild(newRow);
        });

        // 4. Restore cell data
        if (data.cellData) {
            const rows = this.tableBody.querySelectorAll('tr');
            Object.entries(data.cellData).forEach(([cellId, content]) => {
                const parts = cellId.split('-');
                if (parts.length === 4 && parts[0] === 'row' && parts[2] === 'col') {
                    const rowIndex = parseInt(parts[1], 10);
                    const colIndex = parseInt(parts[3], 10);

                    if (!isNaN(rowIndex) && !isNaN(colIndex) && rows[rowIndex]) {
                        const cells = rows[rowIndex].querySelectorAll('.activity-cell');
                        if (cells[colIndex]) {
                            cells[colIndex].textContent = content;
                        }
                    }
                }
            });
        }
    }

    saveCurrentState() {
        const characters = [];
        const characterInputs = this.nameRow.querySelectorAll('.character-name-input');
        characterInputs.forEach(input => {
            characters.push(input.value || '新しい人物');
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

            // 1. Clear table body completely
            this.tableBody.innerHTML = '';

            // 2. Remove extra character columns (if any)
            const characterHeaders = this.nameRow.querySelectorAll('.character-header');
            for (let i = characterHeaders.length - 1; i >= 3; i--) {
                characterHeaders[i].remove();
            }
            const memoHeaders = this.memoRow.querySelectorAll('.character-memo-header');
            for (let i = memoHeaders.length - 1; i >= 3; i--) {
                memoHeaders[i].remove();
            }

            // 3. Reset the first 3 character names and memos
            const characterInputs = this.nameRow.querySelectorAll('.character-name-input');
            const defaultNames = ['人物A', '人物B', '人物C'];
            characterInputs.forEach((input, index) => {
                if (defaultNames[index]) {
                    input.value = defaultNames[index];
                }
            });

            const memoTextareas = this.memoRow.querySelectorAll('.character-memo-textarea');
            memoTextareas.forEach((textarea) => {
                textarea.value = '';
                this.adjustTextareaHeight(textarea);
            });

            // 4. Re-create the default 5 time rows
            const defaultTimes = ['08:00', '09:00', '10:00', '11:00', '12:00'];
            const characterCount = 3; // Reset to 3 characters
            defaultTimes.forEach(time => {
                const newRow = this.createTimeRow(time, characterCount);
                this.tableBody.appendChild(newRow);
            });

            this.updateTimeSelectOptions();
            this.updateLastSavedIndicator();
            this.showNotification('データがリセットされました', 'success');
            this.hideLoading();
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
        this.addCharacterColumn('新しい人物', true);
    }

    addCharacterColumn(characterName = '新しい人物', shouldAutoSave = true) {
        const newNameHeader = document.createElement('th');
        newNameHeader.className = 'character-header';
        newNameHeader.innerHTML = `
            <div class="character-name-row">
                <input type="text" class="character-name-input" value="${characterName}" placeholder="人物名">
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
            this.showNotification('人物を追加しました', 'success');
        }

        this.hideLoading();
    }

    removeCharacters() {
        const checkboxes = document.querySelectorAll('.delete-checkbox:checked');
        if (checkboxes.length === 0) {
            this.showNotification('削除する人物を選択してください', 'warning');
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
        this.showNotification(`${indicesToRemove.length}名の人物を削除しました`, 'success');
        this.hideLoading();
    }

    addTimeRows() {
        const timeInterval = parseInt(document.getElementById('time-interval').value);
        const insertTimeSelect = document.getElementById('insert-time');
        const insertTime = insertTimeSelect.value;
        const insertPosition = document.querySelector('input[name="insert-position"]:checked').value;
        const characterCount = this.nameRow.querySelectorAll('.character-header').length;

        // 基準時間の設定
        const [hours, minutes] = insertTime.split(':').map(Number);
        const baseTime = new Date();
        baseTime.setHours(hours, minutes, 0, 0);

        // 追加する時間の計算
        const targetTime = new Date(baseTime);
        if (insertPosition === 'before') {
            targetTime.setMinutes(targetTime.getMinutes() - timeInterval);
        } else {
            targetTime.setMinutes(targetTime.getMinutes() + timeInterval);
        }

        // 重複チェック
        const targetTimeString = targetTime.toTimeString().slice(0, 5);
        const existingTimes = Array.from(this.tableBody.querySelectorAll('.time-display')).map(td => td.textContent);
        if (existingTimes.includes(targetTimeString)) {
            this.showNotification('追加しようとしている時間は既に存在します', 'warning');
            insertTimeSelect.value = targetTimeString;
            return;
        }

        // 挿入位置の行を探す
        const rows = this.tableBody.querySelectorAll('tr');
        let targetRow = null;
        
        for (let row of rows) {
            const timeDisplay = row.querySelector('.time-display');
            if (timeDisplay && timeDisplay.textContent.trim() === insertTime) {
                targetRow = row;
                break;
            }
        }

        // 開始時間と終了時間の設定（1行だけ追加するように修正）
        const startTime = targetTime;
        const endTime = new Date(targetTime);
        endTime.setMinutes(endTime.getMinutes() + 1); // 1行だけ追加するために1分後に設定

        // Generate new rows
        const newRows = [];
        const currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
            const formattedTime = currentTime.toTimeString().slice(0, 5);
            const newRow = this.createTimeRow(formattedTime, characterCount);
            newRows.push(newRow);
            currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
        }

        // Insert rows with animation
        newRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            if (targetRow) {
                if (insertPosition === 'before') {
                    this.tableBody.insertBefore(row, targetRow);
                } else {
                    this.tableBody.insertBefore(row, targetRow.nextSibling);
                }
            } else {
                this.tableBody.appendChild(row);
            }

            // Animate in with stagger
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
                row.classList.add('fade-in');

                // 最後の行が挿入された後、挿入時間を更新
                if (index === newRows.length - 1) {
                    const lastTime = row.querySelector('.time-display').textContent;
                    const insertTimeInput = document.getElementById('insert-time');
                    if (insertTimeInput) {
                        insertTimeInput.value = lastTime;
                    }
                }
            }, index * 100);
        });

        if (newRows.length > 0) {
            this.updateTimeSelectOptions(); // セレクトボックスの更新
            this.showNotification(`${newRows.length}行の時間を追加しました`, 'success');
            this.autoSave();
        } else {
            this.showNotification('追加する時間がありません', 'info');
        }
    }

    // Add time row directly (for restoring from data)
    addTimeRowDirect(time, characterCount) {
        const newRow = this.createTimeRow(time, characterCount);
        this.tableBody.appendChild(newRow);
    }

    // Create a new time row
    createTimeRow(time, characterCount) {
        const row = document.createElement('tr');
        row.className = 'table-row';

        // Time cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `
            <div class="time-cell-content">
                <input type="checkbox" class="time-delete-checkbox">
                <span class="time-display">${time}</span>
            </div>
        `;
        row.appendChild(timeCell);

        // Activity cells
        for (let i = 0; i < characterCount; i++) {
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-cell';
            activityCell.contentEditable = 'true';
            row.appendChild(activityCell);
        }

        return row;
    }

    // Remove selected time rows
    removeTimeRows() {
        const checkboxes = this.tableBody.querySelectorAll('.time-delete-checkbox:checked');
        const rowsToDelete = Array.from(checkboxes).map(cb => cb.closest('tr'));

        if (rowsToDelete.length === 0) {
            this.showNotification('削除する時間行を選択してください', 'warning');
            return;
        }

        const totalRows = this.tableBody.querySelectorAll('tr').length;
        if (totalRows - rowsToDelete.length < 1) {
            this.showNotification('最後の時間行は削除できません。', 'warning');
            checkboxes.forEach(cb => cb.checked = false);
            return;
        }

        // Animate out rows
        rowsToDelete.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-100%)';
            }, index * 50);
        });

        // Remove rows after animation
        setTimeout(() => {
            rowsToDelete.forEach(row => {
                row.remove();
            });
            
            this.updateTimeSelectOptions(); // Update the dropdown

            this.showNotification(`${rowsToDelete.length}行を削除しました`, 'success');
            this.autoSave();
        }, 300 + (rowsToDelete.length * 50));
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