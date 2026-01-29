// Simple test version that works without Chrome APIs
document.addEventListener('DOMContentLoaded', function() {
    console.log('Extension loaded');
    
    // DOM Elements
    const elements = {
        noteInput: document.getElementById('noteInput'),
        saveNoteBtn: document.getElementById('saveNote'),
        toggleGroupFormBtn: document.getElementById('toggleGroupForm'),
        createGroupForm: document.getElementById('createGroupForm'),
        newGroupName: document.getElementById('newGroupName'),
        createGroupBtn: document.getElementById('createGroupBtn'),
        cancelGroupBtn: document.getElementById('cancelGroupBtn'),
        groupsList: document.getElementById('groupsList'),
        urlModal: document.getElementById('urlModal'),
        urlTitleInput: document.getElementById('urlTitleInput'),
        urlInput: document.getElementById('urlInput'),
        selectGroup: document.getElementById('selectGroup'),
        saveUrlBtn: document.getElementById('saveUrlBtn'),
        cancelUrlBtn: document.getElementById('cancelUrlBtn'),
        closeModalBtn: document.querySelector('.close-modal'),
        charCount: document.getElementById('charCount'),
        addCurrentToGroupBtn: document.getElementById('addCurrentToGroup')
    };

    // State
    let state = {
        groups: JSON.parse(localStorage.getItem('groups')) || [],
        note: localStorage.getItem('note') || '',
        selectedGroupId: null
    };

    // Constants
    const MAX_URLS_PER_GROUP = 10;

    // Initialize
    init();

    function init() {
        console.log('Initializing extension...');
        console.log('Current state:', state);
        
        // Load saved data
        elements.noteInput.value = state.note;
        updateCharCount();
        renderGroups();
        updateGroupSelect();
        setupEventListeners();
    }

    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Notes
        elements.saveNoteBtn.addEventListener('click', saveNote);
        elements.noteInput.addEventListener('input', updateCharCount);
        
        // Groups
        elements.toggleGroupFormBtn.addEventListener('click', toggleGroupForm);
        elements.createGroupBtn.addEventListener('click', createGroup);
        elements.cancelGroupBtn.addEventListener('click', hideGroupForm);
        
        // URLs
        elements.addCurrentToGroupBtn.addEventListener('click', showUrlModalForCurrent);
        elements.saveUrlBtn.addEventListener('click', saveUrl);
        elements.cancelUrlBtn.addEventListener('click', hideUrlModal);
        elements.closeModalBtn.addEventListener('click', hideUrlModal);
        
        // Modal close on outside click
        elements.urlModal.addEventListener('click', function(e) {
            if (e.target === elements.urlModal) hideUrlModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveNote();
            }
            if (e.key === 'Escape' && elements.urlModal.style.display === 'block') {
                hideUrlModal();
            }
        });
    }

    function saveNote() {
        console.log('Saving note...');
        state.note = elements.noteInput.value;
        localStorage.setItem('note', state.note);
        showNotification('Note saved!', 'success');
    }

    function updateCharCount() {
        const length = elements.noteInput.value.length;
        elements.charCount.textContent = `${length} characters`;
    }

    function toggleGroupForm() {
        console.log('Toggling group form...');
        const isVisible = elements.createGroupForm.style.display === 'block';
        elements.createGroupForm.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            elements.newGroupName.focus();
        }
    }

    function hideGroupForm() {
        elements.createGroupForm.style.display = 'none';
        elements.newGroupName.value = '';
    }

    function createGroup() {
        const groupName = elements.newGroupName.value.trim();
        
        if (!groupName) {
            showNotification('Please enter a group name', 'error');
            return;
        }
        
        const newGroup = {
            id: 'group_' + Date.now(),
            name: groupName,
            urls: [],
            createdAt: new Date().toISOString(),
            isExpanded: true
        };

        state.groups.push(newGroup);
        localStorage.setItem('groups', JSON.stringify(state.groups));
        renderGroups();
        updateGroupSelect();
        hideGroupForm();
        showNotification(`Group "${groupName}" created!`, 'success');
    }

    function deleteGroup(groupId) {
        if (!confirm('Delete this group and all its URLs?')) return;
        
        state.groups = state.groups.filter(group => group.id !== groupId);
        localStorage.setItem('groups', JSON.stringify(state.groups));
        renderGroups();
        updateGroupSelect();
        showNotification('Group deleted', 'info');
    }

    function showUrlModalForCurrent() {
        elements.urlTitleInput.value = 'Example URL';
        elements.urlInput.value = 'https://example.com';
        showUrlModal();
    }

    function showUrlModalForGroup(groupId) {
        state.selectedGroupId = groupId;
        elements.urlTitleInput.value = '';
        elements.urlInput.value = '';
        showUrlModal();
    }

    function showUrlModal() {
        elements.urlModal.style.display = 'block';
        elements.urlTitleInput.focus();
    }

    function hideUrlModal() {
        elements.urlModal.style.display = 'none';
        state.selectedGroupId = null;
    }

    function saveUrl() {
        const title = elements.urlTitleInput.value.trim();
        const url = elements.urlInput.value.trim();
        const groupId = state.selectedGroupId || elements.selectGroup.value;

        if (!title || !url || !groupId) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        const group = state.groups.find(g => g.id === groupId);
        if (!group) {
            showNotification('Group not found', 'error');
            return;
        }

        if (group.urls.length >= MAX_URLS_PER_GROUP) {
            showNotification('This group already has 10 URLs (maximum)', 'error');
            return;
        }

        const newUrl = {
            id: 'url_' + Date.now(),
            title: title,
            url: url,
            addedAt: new Date().toISOString()
        };

        group.urls.push(newUrl);
        localStorage.setItem('groups', JSON.stringify(state.groups));
        renderGroups();
        hideUrlModal();
        showNotification('URL added!', 'success');
    }

    function deleteUrl(groupId, urlId) {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
            group.urls = group.urls.filter(url => url.id !== urlId);
            localStorage.setItem('groups', JSON.stringify(state.groups));
            renderGroups();
            showNotification('URL deleted', 'info');
        }
    }

    function renderGroups() {
        console.log('Rendering groups...', state.groups);
        elements.groupsList.innerHTML = '';

        if (state.groups.length === 0) {
            elements.groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No groups yet. Click "New Group" to create one!</p>
                </div>
            `;
            return;
        }

        state.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group-item';
            groupElement.dataset.groupId = group.id;

            const isExpanded = group.isExpanded !== false;
            const urlCount = group.urls.length;
            const isFull = urlCount >= MAX_URLS_PER_GROUP;

            let urlsHtml = '';
            if (group.urls.length > 0) {
                urlsHtml = group.urls.map(url => `
                    <div class="url-item" data-url-id="${url.id}">
                        <div class="url-content">
                            <div class="url-title">${url.title}</div>
                            <div class="url-address">${url.url}</div>
                        </div>
                        <div class="url-actions">
                            <button class="btn-open-url" title="Open URL">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                            <button class="btn-delete-url" title="Delete URL">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                urlsHtml = '<div class="empty-urls">No URLs yet. Click "Add URL"!</div>';
            }

            groupElement.innerHTML = `
                <div class="group-header ${isFull ? 'full' : ''}">
                    <div class="group-info">
                        <i class="fas fa-folder${isExpanded ? '-open' : ''}"></i>
                        <span class="group-name">${group.name}</span>
                        <span class="group-count">${urlCount}/${MAX_URLS_PER_GROUP}</span>
                        ${isFull ? '<span class="full-badge">Full</span>' : ''}
                    </div>
                    <div class="group-actions">
                        <button class="btn-add-url" ${isFull ? 'disabled' : ''} title="Add URL">
                            <i class="fas fa-plus"></i> Add URL
                        </button>
                        <button class="btn-delete-group" title="Delete Group">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="group-urls" style="display: ${isExpanded ? 'block' : 'none'}">
                    ${urlsHtml}
                </div>
            `;

            // Add event listeners
            const groupInfo = groupElement.querySelector('.group-info');
            const addUrlBtn = groupElement.querySelector('.btn-add-url');
            const deleteGroupBtn = groupElement.querySelector('.btn-delete-group');

            groupInfo.addEventListener('click', () => {
                group.isExpanded = !group.isExpanded;
                renderGroups();
            });

            addUrlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showUrlModalForGroup(group.id);
            });

            deleteGroupBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGroup(group.id);
            });

            elements.groupsList.appendChild(groupElement);
        });

        // Add URL event listeners
        document.querySelectorAll('.btn-open-url').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const urlItem = this.closest('.url-item');
                const urlAddress = urlItem.querySelector('.url-address').textContent;
                if (urlAddress) {
                    window.open(urlAddress, '_blank');
                }
            });
        });

        document.querySelectorAll('.btn-delete-url').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const urlItem = this.closest('.url-item');
                const groupId = urlItem.closest('.group-item').dataset.groupId;
                const urlId = urlItem.dataset.urlId;
                
                if (confirm('Delete this URL?')) {
                    deleteUrl(groupId, urlId);
                }
            });
        });
    }

    function updateGroupSelect() {
        elements.selectGroup.innerHTML = '';
        
        if (state.groups.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Create a group first';
            option.disabled = true;
            elements.selectGroup.appendChild(option);
            return;
        }

        state.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name} (${group.urls.length}/${MAX_URLS_PER_GROUP})`;
            elements.selectGroup.appendChild(option);
        });
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});