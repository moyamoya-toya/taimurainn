// Detective Novel Timetable - Modern JavaScript Implementation with localStorage
class DetectiveTimetableStorage {
    constructor() {
        this.storageKey = 'detectiveTimetableData';
        this.isLocalStorageAvailable = this.checkLocalStorage();
        this.defaultData = {
            characters: ["登場人物A", "登場人物B", "登場人物C"],
            timeRows: ["08:00", "09:00", "10:00", "11:00", "12:00"],
            cellData: {},
            lastSaved: null
        };
    }

    checkLocalStorage() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    saveData(data) {
        if (this.isLocalStorageAvailable) {
            try {
                const saveData = { ...data, lastSaved: new Date().toISOString() };
                localStorage.setItem(this.storageKey, JSON.stringify(saveData));
                return true;
            } catch (error) {
                console.error('LocalStorage save failed:', error);
            }
        }
        // Fallback to in-memory for demo
        this.memoryStorage = { ...data, lastSaved: new Date().toISOString() };
        return true;
    }

    loadData() {
        if (this.isLocalStorageAvailable) {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) return JSON.parse(saved);
            } catch (error) {
                console.error('LocalStorage load failed:', error);
            }
        }
        return this.memoryStorage || this.defaultData;
    }

    clearData() {
        if (this.isLocalStorageAvailable) {
            try {
                localStorage.removeItem(this.storageKey);
            } catch (error) {
                console.error('LocalStorage clear failed:', error);
            }
        }
        this.memoryStorage = null;
    }
}

class DetectiveTimetable {
    constructor() {
        this.storage = new DetectiveTimetableStorage();
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.table = document.querySelector('.timetable');
        this.headerRow = this.table.querySelector('thead tr');
        this.tableBody = this.table.querySelector('tbody');
        this.resetModal = document.getElementById('resetModal');
        this.timeInsertDropdown = document.getElementById('insert-before-time');
        
        this.init();
    }

    init() {
        this.loadSavedData();
        this.setupEventListeners();
        this.setupCharacterInputListeners();
        this.setupAutoSave();
        this.addInitialAnimations();
        
        // Update dropdown after initial setup
        setTimeout(() => {
            this.updateTimeInsertDropdown();
        }, 100);
    }

    // Load saved data from localStorage
    loadSavedData() {
        const data = this.storage.loadData();
        if (data.lastSaved) {
            this.restoreTableFromData(data);
        } else {
            // If no saved data, ensure dropdown is populated with default times
            setTimeout(() => {
                this.updateTimeInsertDropdown();
            }, 50);
        }
    }

    // Restore table from saved data
    restoreTableFromData(data) {
        // Clear existing table
        this.headerRow.innerHTML = '<th class="time-header">時間</th>';
        this.tableBody.innerHTML = '';

        // Restore characters
        data.characters.forEach((character, index) => {
            const headerCell = document.createElement('th');
            headerCell.className = 'character-header';
            headerCell.innerHTML = `
                <div class="character-cell">
                    <input type="text" value="${character}" class="character-input">
                    <input type="checkbox" class="delete-checkbox">
                </div>
            `;
            this.headerRow.appendChild(headerCell);
        });

        // Restore time rows
        data.timeRows.forEach(time => {
            const row = this.createTimeRow(time, data.characters.length);
            this.tableBody.appendChild(row);
        });

        // Restore cell data
        Object.keys(data.cellData).forEach(key => {
            const [timeIndex, charIndex] = key.split('-').map(Number);
            const row = this.tableBody.children[timeIndex];
            if (row && row.children[charIndex + 1]) {
                row.children[charIndex + 1].textContent = data.cellData[key];
            }
        });

        // Setup listeners for restored elements
        this.setupCharacterInputListeners();
        this.setupActivityCellListeners();
        
        // Update dropdown after restoring data
        setTimeout(() => {
            this.updateTimeInsertDropdown();
        }, 100);
    }

    // Save current table state
    saveCurrentState() {
        const data = {
            characters: this.getCurrentCharacters(),
            timeRows: this.getCurrentTimeRows(),
            cellData: this.getCurrentCellData(),
            lastSaved: new Date().toISOString()
        };
        this.storage.saveData(data);
    }

    // Get current characters
    getCurrentCharacters() {
        const inputs = this.headerRow.querySelectorAll('.character-input');
        return Array.from(inputs).map(input => input.value);
    }

    // Get current time rows
    getCurrentTimeRows() {
        const timeDisplays = this.tableBody.querySelectorAll('.time-display');
        return Array.from(timeDisplays).map(display => display.textContent);
    }

    // Get current cell data
    getCurrentCellData() {
        const cellData = {};
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach((row, timeIndex) => {
            const activityCells = row.querySelectorAll('.activity-cell');
            activityCells.forEach((cell, charIndex) => {
                if (cell.textContent.trim()) {
                    cellData[`${timeIndex}-${charIndex}`] = cell.textContent.trim();
                }
            });
        });
        return cellData;
    }

    // Setup auto-save
    setupAutoSave() {
        const autoSave = () => {
            this.saveCurrentState();
        };

        // Save on character name changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('character-input') || 
                e.target.classList.contains('activity-cell')) {
                autoSave();
            }
        });

        // Save every 30 seconds
        setInterval(autoSave, 30000);
    }

    // Update time insertion dropdown
    updateTimeInsertDropdown() {
        if (!this.timeInsertDropdown) {
            console.error('Time insert dropdown not found');
            return;
        }

        const currentTimes = this.getCurrentTimeRows();
        
        // Clear existing options
        this.timeInsertDropdown.innerHTML = '';
        
        // Add "最後に追加" as first option
        const endOption = document.createElement('option');
        endOption.value = 'end';
        endOption.textContent = '最後に追加';
        this.timeInsertDropdown.appendChild(endOption);
        
        // Add current times as options (sorted)
        const sortedTimes = currentTimes.sort((a, b) => {
            const [aHours, aMinutes] = a.split(':').map(Number);
            const [bHours, bMinutes] = b.split(':').map(Number);
            const aTotal = aHours * 60 + aMinutes;
            const bTotal = bHours * 60 + bMinutes;
            return aTotal - bTotal;
        });

        sortedTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            this.timeInsertDropdown.appendChild(option);
        });

        console.log(`Updated dropdown with ${this.timeInsertDropdown.options.length} options`);
    }

    // Show loading overlay with animation
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
        setTimeout(() => this.hideLoading(), 800);
    }

    // Hide loading overlay
    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    // Add initial fade-in animations
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

    // Setup all event listeners
    setupEventListeners() {
        // Character management buttons
        document.getElementById('addButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.addCharacter(), 300);
        });

        document.getElementById('removeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.removeCharacters(), 300);
        });

        // Time management buttons
        document.getElementById('addTimeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.addTimeRows(), 300);
        });

        document.getElementById('removeTimeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.removeTimeRows(), 300);
        });

        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.showResetModal();
        });

        // Reset modal buttons
        document.getElementById('confirmReset').addEventListener('click', () => {
            this.confirmReset();
        });

        document.getElementById('cancelReset').addEventListener('click', () => {
            this.hideResetModal();
        });

        // Modal backdrop click to close
        this.resetModal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.hideResetModal();
        });

        // Add hover effects to buttons
        this.addButtonHoverEffects();
    }

    // Show reset confirmation modal
    showResetModal() {
        this.resetModal.classList.remove('hidden');
    }

    // Hide reset confirmation modal
    hideResetModal() {
        this.resetModal.classList.add('hidden');
    }

    // Confirm reset and clear all data
    confirmReset() {
        this.storage.clearData();
        this.hideResetModal();
        this.showLoading();
        
        setTimeout(() => {
            // Reset to default state
            location.reload();
        }, 800);
    }

    // Add hover effects to buttons
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

    // Setup character input listeners for existing inputs
    setupCharacterInputListeners() {
        const existingInputs = document.querySelectorAll('.character-input');
        existingInputs.forEach(input => {
            this.addCharacterInputListener(input);
        });
    }

    // Setup activity cell listeners
    setupActivityCellListeners() {
        const activityCells = document.querySelectorAll('.activity-cell');
        activityCells.forEach(cell => {
            this.addCellFocusEffects(cell);
        });
    }

    // Add event listener to character input for real-time updates
    addCharacterInputListener(input) {
        input.addEventListener('input', () => {
            // Visual feedback on input
            input.style.transform = 'scale(1.02)';
            setTimeout(() => {
                input.style.transform = 'scale(1)';
            }, 150);
        });

        input.addEventListener('focus', function() {
            this.parentElement.style.background = 'rgba(255, 215, 0, 0.1)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.background = 'transparent';
        });
    }

    // Add new character column
    addCharacter() {
        // Create new header cell
        const newHeader = document.createElement('th');
        newHeader.className = 'character-header';
        newHeader.innerHTML = `
            <div class="character-cell">
                <input type="text" value="新しい登場人物" class="character-input">
                <input type="checkbox" class="delete-checkbox">
            </div>
        `;
        
        // Add with animation
        newHeader.style.opacity = '0';
        newHeader.style.transform = 'translateX(20px)';
        this.headerRow.appendChild(newHeader);
        
        // Animate in
        setTimeout(() => {
            newHeader.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            newHeader.style.opacity = '1';
            newHeader.style.transform = 'translateX(0)';
        }, 50);

        // Add corresponding cells to all body rows
        const bodyRows = this.tableBody.querySelectorAll('tr');
        bodyRows.forEach((row, index) => {
            const newCell = document.createElement('td');
            newCell.className = 'activity-cell';
            newCell.contentEditable = 'true';
            newCell.setAttribute('data-placeholder', '活動を記入...');
            
            // Add with staggered animation
            newCell.style.opacity = '0';
            newCell.style.transform = 'translateX(20px)';
            row.appendChild(newCell);
            
            setTimeout(() => {
                newCell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                newCell.style.opacity = '1';
                newCell.style.transform = 'translateX(0)';
            }, 100 + (index * 50));

            // Add focus effects
            this.addCellFocusEffects(newCell);
        });

        // Setup listener for new character input
        const newInput = newHeader.querySelector('.character-input');
        this.addCharacterInputListener(newInput);
        
        // Focus on new input
        setTimeout(() => {
            newInput.focus();
            newInput.select();
        }, 400);
    }

    // Remove selected character columns
    removeCharacters() {
        const checkboxes = this.headerRow.querySelectorAll('.delete-checkbox');
        const columnsToDelete = [];
        const bodyRows = this.tableBody.querySelectorAll('tr');

        // Find columns marked for deletion
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                columnsToDelete.push(index + 1); // +1 to account for time column
            }
        });

        if (columnsToDelete.length === 0) {
            this.showNotification('削除する登場人物を選択してください', 'warning');
            return;
        }

        // Animate out columns before deletion
        columnsToDelete.forEach(colIndex => {
            const headerCell = this.headerRow.children[colIndex];
            if (headerCell) {
                headerCell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                headerCell.style.opacity = '0';
                headerCell.style.transform = 'translateX(-20px)';
            }

            bodyRows.forEach(row => {
                const cell = row.children[colIndex];
                if (cell) {
                    cell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    cell.style.opacity = '0';
                    cell.style.transform = 'translateX(-20px)';
                }
            });
        });

        // Remove columns after animation
        setTimeout(() => {
            columnsToDelete.reverse().forEach(colIndex => {
                if (this.headerRow.children[colIndex]) {
                    this.headerRow.removeChild(this.headerRow.children[colIndex]);
                }
                bodyRows.forEach(row => {
                    if (row.children[colIndex]) {
                        row.removeChild(row.children[colIndex]);
                    }
                });
            });
            
            this.showNotification('登場人物を削除しました', 'success');
        }, 300);
    }

    // Add new time rows
    addTimeRows() {
        const timeInterval = parseInt(document.getElementById('time-interval').value);
        const insertBeforeTime = document.getElementById('insert-before-time').value;
        const characterCount = this.headerRow.children.length - 1;

        let insertBeforeRow = null;
        
        // If not "end", find the insertion point
        if (insertBeforeTime !== 'end') {
            const rows = this.tableBody.querySelectorAll('tr');
            for (let row of rows) {
                const timeDisplay = row.querySelector('.time-display');
                if (timeDisplay && timeDisplay.textContent.trim() === insertBeforeTime) {
                    insertBeforeRow = row;
                    break;
                }
            }
        }

        // Calculate new time
        let newTime;
        if (insertBeforeRow) {
            // Insert before selected time
            const [hours, minutes] = insertBeforeTime.split(':').map(Number);
            const targetTime = new Date();
            targetTime.setHours(hours, minutes - timeInterval, 0, 0);
            newTime = targetTime.toTimeString().slice(0, 5);
        } else {
            // Add to end
            const lastRow = this.tableBody.lastElementChild;
            if (lastRow) {
                const lastTimeDisplay = lastRow.querySelector('.time-display');
                const [hours, minutes] = lastTimeDisplay.textContent.split(':').map(Number);
                const targetTime = new Date();
                targetTime.setHours(hours, minutes + timeInterval, 0, 0);
                newTime = targetTime.toTimeString().slice(0, 5);
            } else {
                newTime = '08:00';
            }
        }

        // Create and insert new row
        const newRow = this.createTimeRow(newTime, characterCount);
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateY(20px)';
        
        if (insertBeforeRow) {
            this.tableBody.insertBefore(newRow, insertBeforeRow);
        } else {
            this.tableBody.appendChild(newRow);
        }

        // Animate in
        setTimeout(() => {
            newRow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            newRow.style.opacity = '1';
            newRow.style.transform = 'translateY(0)';
            newRow.classList.add('fade-in');
        }, 50);

        // Update dropdown with new times
        setTimeout(() => {
            this.updateTimeInsertDropdown();
        }, 100);
        
        this.showNotification('時間行を追加しました', 'success');
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
            activityCell.setAttribute('data-placeholder', '活動を記入...');
            row.appendChild(activityCell);
            
            this.addCellFocusEffects(activityCell);
        }

        return row;
    }

    // Add focus effects to activity cells
    addCellFocusEffects(cell) {
        cell.addEventListener('focus', () => {
            cell.style.background = 'rgba(255, 215, 0, 0.1)';
            cell.style.transform = 'scale(1.02)';
        });

        cell.addEventListener('blur', () => {
            cell.style.background = '';
            cell.style.transform = 'scale(1)';
        });

        cell.addEventListener('input', () => {
            // Visual feedback on content change
            cell.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            setTimeout(() => {
                cell.style.borderColor = '';
            }, 1000);
        });
    }

    // Remove selected time rows
    removeTimeRows() {
        const checkboxes = this.tableBody.querySelectorAll('.time-delete-checkbox');
        const rowsToDelete = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                rowsToDelete.push(checkbox.closest('tr'));
            }
        });

        if (rowsToDelete.length === 0) {
            this.showNotification('削除する時間行を選択してください', 'warning');
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
            // Update dropdown after removing rows
            setTimeout(() => {
                this.updateTimeInsertDropdown();
            }, 50);
            this.showNotification(`${rowsToDelete.length}行を削除しました`, 'success');
        }, 300 + (rowsToDelete.length * 50));
    }

    // Show notification message
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '1001',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
        });

        // Set background based on type
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        
        notification.style.background = colors[type] || colors.info;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 50);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Enhanced interaction effects
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the timetable
    const timetable = new DetectiveTimetable();

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .btn {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);

    // Enhanced table interactions
    const tableRows = document.querySelectorAll('.table-row');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateX(5px)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateX(0)';
        });
    });

    // Smooth scroll for mobile
    if (window.innerWidth <= 768) {
        const tableWrapper = document.querySelector('.table-wrapper');
        if (tableWrapper) {
            tableWrapper.style.scrollBehavior = 'smooth';
        }
    }

    console.log('🕵️ Detective Novel Timetable initialized successfully with localStorage!');
});