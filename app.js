// Detective Novel Timetable - Enhanced JavaScript with Auto-save and Reset Functionality
class DetectiveTimetable {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.table = document.querySelector('.timetable');
        this.headerRow = this.table.querySelector('thead tr');
        this.tableBody = this.table.querySelector('tbody');
        this.insertBeforeSelect = document.getElementById('insert-before-time');
        this.confirmationModal = document.getElementById('confirmationModal');
        this.storageKey = 'detectiveTimetableData';
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupCharacterInputListeners();
        this.addInitialAnimations();
        this.setupAutoSave();
        // Initialize dropdown immediately after DOM is ready
        setTimeout(() => {
            this.updateInsertDropdown();
        }, 100);
    }

    // Load data from localStorage
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.restoreTableData(data);
                console.log('Data loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    // Save data to localStorage
    saveToStorage() {
        try {
            const data = this.getTableData();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('Data saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Get current table data
    getTableData() {
        const characters = [];
        const times = [];
        const activities = {};

        // Get characters
        const characterInputs = this.headerRow.querySelectorAll('.character-name-input');
        characterInputs.forEach(input => {
            characters.push(input.value.trim());
        });

        // Get times and activities
        const rows = this.tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const timeDisplay = row.querySelector('.time-display');
            if (timeDisplay) {
                const time = timeDisplay.textContent.trim();
                times.push(time);
                
                const activityCells = row.querySelectorAll('.activity-cell');
                activities[time] = [];
                activityCells.forEach(cell => {
                    activities[time].push(cell.textContent.trim());
                });
            }
        });

        return { characters, times, activities };
    }

    // Restore table data
    restoreTableData(data) {
        if (!data || !data.characters || !data.times) return;

        // Clear existing table
        this.headerRow.innerHTML = '<th class="time-header">時間</th>';
        this.tableBody.innerHTML = '';

        // Restore characters
        data.characters.forEach(character => {
            this.addCharacterHeader(character);
        });

        // Restore times and activities
        data.times.forEach(time => {
            const activities = data.activities[time] || [];
            this.addTimeRowWithData(time, activities);
        });

        // Setup listeners for restored elements
        this.setupCharacterInputListeners();
    }

    // Add character header
    addCharacterHeader(characterName) {
        const newHeader = document.createElement('th');
        newHeader.className = 'character-header';
        newHeader.innerHTML = `
            <div class="character-cell">
                <input type="text" value="${characterName}" class="character-name-input">
                <input type="checkbox" class="delete-checkbox">
            </div>
        `;
        this.headerRow.appendChild(newHeader);
        
        const newInput = newHeader.querySelector('.character-name-input');
        this.addCharacterInputListener(newInput);
    }

    // Add time row with data
    addTimeRowWithData(time, activities) {
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
        const characterCount = this.headerRow.children.length - 1;
        for (let i = 0; i < characterCount; i++) {
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-cell';
            activityCell.contentEditable = 'true';
            activityCell.setAttribute('data-placeholder', '活動を記入...');
            activityCell.textContent = activities[i] || '';
            row.appendChild(activityCell);
            
            this.addCellFocusEffects(activityCell);
        }

        this.tableBody.appendChild(row);
    }

    // Setup auto-save functionality
    setupAutoSave() {
        // Save on input changes with debounce
        let saveTimeout;
        const debouncedSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.saveToStorage();
            }, 1000);
        };

        // Save on character input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.character-name-input')) {
                debouncedSave();
            }
        });

        // Save on activity cell changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.activity-cell')) {
                debouncedSave();
            }
        });

        // Save on blur for activity cells
        document.addEventListener('blur', (e) => {
            if (e.target.matches('.activity-cell')) {
                this.saveToStorage();
            }
        }, true);
    }

    // Update the dropdown with current time options
    updateInsertDropdown() {
        if (!this.insertBeforeSelect) {
            console.error('Insert before select element not found');
            return;
        }

        const currentOption = this.insertBeforeSelect.value;
        
        // Clear existing options
        this.insertBeforeSelect.innerHTML = '';
        
        // Add "最後に追加" as default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '最後に追加';
        this.insertBeforeSelect.appendChild(defaultOption);
        
        // Get all existing times from the table
        const timeDisplays = this.tableBody.querySelectorAll('.time-display');
        const times = [];
        
        timeDisplays.forEach(timeDisplay => {
            const timeText = timeDisplay.textContent.trim();
            if (timeText) {
                times.push(timeText);
            }
        });
        
        // Sort times chronologically
        times.sort((a, b) => {
            const [aHours, aMinutes] = a.split(':').map(Number);
            const [bHours, bMinutes] = b.split(':').map(Number);
            return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
        });
        
        // Add time options to dropdown
        times.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            this.insertBeforeSelect.appendChild(option);
        });
        
        // Restore previously selected option if it still exists
        if (currentOption && times.includes(currentOption)) {
            this.insertBeforeSelect.value = currentOption;
        }

        console.log(`Dropdown updated with ${times.length} time options`);
    }

    // Show/hide confirmation modal
    showConfirmationModal(title, message, onConfirm) {
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Remove existing listeners
        const newModalConfirm = modalConfirm.cloneNode(true);
        const newModalCancel = modalCancel.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newModalConfirm, modalConfirm);
        modalCancel.parentNode.replaceChild(newModalCancel, modalCancel);
        
        // Add new listeners
        newModalConfirm.addEventListener('click', () => {
            this.hideConfirmationModal();
            onConfirm();
        });
        
        newModalCancel.addEventListener('click', () => {
            this.hideConfirmationModal();
        });
        
        // Show modal
        this.confirmationModal.classList.remove('hidden');
        
        // Close on backdrop click
        const backdrop = this.confirmationModal.querySelector('.modal-backdrop');
        const newBackdrop = backdrop.cloneNode(true);
        backdrop.parentNode.replaceChild(newBackdrop, backdrop);
        newBackdrop.addEventListener('click', () => {
            this.hideConfirmationModal();
        });
    }

    hideConfirmationModal() {
        this.confirmationModal.classList.add('hidden');
    }

    // Reset all data
    resetData() {
        this.showConfirmationModal(
            'データのリセット',
            '全てのデータを削除してもよろしいですか？この操作は取り消すことができません。',
            () => {
                try {
                    localStorage.removeItem(this.storageKey);
                    location.reload(); // Reload page to reset to default state
                } catch (error) {
                    console.error('Error resetting data:', error);
                    this.showNotification('リセット中にエラーが発生しました', 'error');
                }
            }
        );
    }

    // Show loading overlay with animation
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
        setTimeout(() => this.hideLoading(), 300);
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
        const addButton = document.getElementById('addButton');
        const removeButton = document.getElementById('removeButton');
        const addTimeButton = document.getElementById('addTimeButton');
        const removeTimeButton = document.getElementById('removeTimeButton');
        const resetButton = document.getElementById('resetButton');

        if (addButton) {
            addButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoading();
                setTimeout(() => this.addCharacter(), 100);
            });
        }

        if (removeButton) {
            removeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoading();
                setTimeout(() => this.removeCharacters(), 100);
            });
        }

        if (addTimeButton) {
            addTimeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoading();
                setTimeout(() => this.addTimeRows(), 100);
            });
        }

        if (removeTimeButton) {
            removeTimeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoading();
                setTimeout(() => this.removeTimeRows(), 100);
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetData();
            });
        }
    }

    // Setup character input listeners for existing inputs
    setupCharacterInputListeners() {
        const existingInputs = document.querySelectorAll('.character-name-input');
        existingInputs.forEach(input => {
            this.addCharacterInputListener(input);
        });
    }

    // Add event listener to character input for real-time updates
    addCharacterInputListener(input) {
        input.addEventListener('input', function() {
            // Visual feedback on input
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
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
                <input type="text" value="新しい登場人物" class="character-name-input">
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
        const newInput = newHeader.querySelector('.character-name-input');
        this.addCharacterInputListener(newInput);
        
        // Focus on new input
        setTimeout(() => {
            newInput.focus();
            newInput.select();
        }, 400);

        // Auto-save
        setTimeout(() => {
            this.saveToStorage();
        }, 500);

        this.showNotification('新しい登場人物を追加しました', 'success');
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
            
            // Auto-save
            this.saveToStorage();
            this.showNotification('登場人物を削除しました', 'success');
        }, 350);
    }

    // Add new time rows using dropdown selection
    addTimeRows() {
        const timeIntervalSelect = document.getElementById('time-interval');
        const timeInterval = parseInt(timeIntervalSelect.value);
        const insertBeforeTime = this.insertBeforeSelect.value;
        const characterCount = this.headerRow.children.length - 1;

        console.log(`Adding time rows: interval=${timeInterval}min, insertBefore="${insertBeforeTime}"`);

        // Find insertion point
        const rows = this.tableBody.querySelectorAll('tr');
        let insertBeforeRow = null;
        
        // If a specific time is selected, find that row
        if (insertBeforeTime) {
            for (let row of rows) {
                const timeDisplay = row.querySelector('.time-display');
                if (timeDisplay && timeDisplay.textContent.trim() === insertBeforeTime) {
                    insertBeforeRow = row;
                    break;
                }
            }
        }

        // Calculate time range
        let startTime, endTime;
        
        if (insertBeforeTime && insertBeforeRow) {
            // Insert before selected time
            const [hours, minutes] = insertBeforeTime.split(':').map(Number);
            endTime = new Date();
            endTime.setHours(hours, minutes, 0, 0);

            startTime = new Date(endTime);
            if (insertBeforeRow.previousElementSibling) {
                const prevTimeDisplay = insertBeforeRow.previousElementSibling.querySelector('.time-display');
                if (prevTimeDisplay) {
                    const [prevHours, prevMinutes] = prevTimeDisplay.textContent.split(':').map(Number);
                    startTime.setHours(prevHours, prevMinutes + timeInterval, 0, 0);
                } else {
                    startTime.setMinutes(startTime.getMinutes() - 60);
                }
            } else {
                startTime.setMinutes(startTime.getMinutes() - 60);
            }
        } else {
            // Add at the end (default option)
            const lastRow = rows[rows.length - 1];
            if (lastRow) {
                const lastTimeDisplay = lastRow.querySelector('.time-display');
                if (lastTimeDisplay) {
                    const [lastHours, lastMinutes] = lastTimeDisplay.textContent.split(':').map(Number);
                    startTime = new Date();
                    startTime.setHours(lastHours, lastMinutes + timeInterval, 0, 0);
                    endTime = new Date(startTime);
                    endTime.setHours(endTime.getHours() + 1);
                }
            } else {
                // No existing rows, start from 08:00
                startTime = new Date();
                startTime.setHours(8, 0, 0, 0);
                endTime = new Date(startTime);
                endTime.setHours(endTime.getHours() + 1);
            }
        }

        // Generate new rows
        const newRows = [];
        const currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
            const formattedTime = currentTime.toTimeString().slice(0, 5);
            
            // Check if this time already exists
            let timeExists = false;
            rows.forEach(row => {
                const timeDisplay = row.querySelector('.time-display');
                if (timeDisplay && timeDisplay.textContent.trim() === formattedTime) {
                    timeExists = true;
                }
            });
            
            if (!timeExists) {
                const newRow = this.createTimeRow(formattedTime, characterCount);
                newRows.push(newRow);
            }
            
            currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
        }

        // Insert rows with animation
        newRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            if (insertBeforeRow) {
                this.tableBody.insertBefore(row, insertBeforeRow);
            } else {
                this.tableBody.appendChild(row);
            }

            // Animate in with stagger
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
                row.classList.add('fade-in');
            }, index * 100);
        });

        // Update dropdown and auto-save after adding rows
        setTimeout(() => {
            this.updateInsertDropdown();
            this.saveToStorage();
        }, 500);

        if (newRows.length > 0) {
            this.showNotification(`${newRows.length}行の時間を追加しました`, 'success');
        } else {
            this.showNotification('追加する新しい時間がありません', 'info');
        }
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
            
            // Update dropdown and auto-save after removing rows
            this.updateInsertDropdown();
            this.saveToStorage();
            
            this.showNotification(`${rowsToDelete.length}行を削除しました`, 'success');
        }, 400);
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
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
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
    console.log('🕵️ Initializing Detective Novel Timetable...');
    
    // Initialize the timetable
    const timetable = new DetectiveTimetable();
    
    // Store reference globally for debugging
    window.timetable = timetable;

    // Add enhanced interactions to existing elements
    const activityCells = document.querySelectorAll('.activity-cell');
    activityCells.forEach(cell => {
        timetable.addCellFocusEffects(cell);
    });

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

    console.log('🕵️ Detective Novel Timetable initialized successfully with auto-save and reset functionality!');
});