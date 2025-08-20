document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanbanBoard');
    const addColumnBtn = document.getElementById('addColumnBtn');

    let draggedCard = null;
    let currentColumnId = 3;
    let currentCardId = 4;

    function handleDragStart(e) {
        draggedCard = e.target;
        e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
        e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedCard = null;
        saveBoardState(); 
    }

    function handleDragOver(e) {
        e.preventDefault();
        const currentList = e.currentTarget;
        const draggingCard = document.querySelector('.card.dragging');

        if (!draggingCard) return;

        const afterElement = getDragAfterElement(currentList, e.clientY);

        if (afterElement == null) {
            currentList.appendChild(draggingCard);
        } else {
            currentList.insertBefore(draggingCard, afterElement);
        }
    }

    function getDragAfterElement(container, y) {
        const draggableCards = [...container.querySelectorAll('.card:not(.dragging)')];

        return draggableCards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: -Infinity }).element;
    }

    function handleDrop(e) {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const droppedCard = document.querySelector(`[data-card-id="${cardId}"]`);

        let targetList = e.target.closest('.card-list');
        if (!targetList) {
            targetList = e.target.querySelector('.card-list');
        }

        if (targetList && droppedCard) {
            targetList.classList.remove('drag-over');
            droppedCard.classList.remove('dragging');
            saveBoardState(); 
        }

        document.querySelectorAll('.column.drag-over').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    function handleDragEnter(e) {
        e.preventDefault();
        const column = e.target.closest('.column');
        if (column) {
            column.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const column = e.target.closest('.column');
        if (column) {
            column.classList.remove('drag-over');
        }
    }

    function createCard(content = 'Nueva Tarea') {
        const card = document.createElement('div');
        currentCardId++;
        card.classList.add('card');
        card.setAttribute('draggable', 'true');
        card.dataset.cardId = currentCardId;
        card.textContent = content;

        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        card.addEventListener('dblclick', () => {
            const newText = prompt('Editar tarea:', card.textContent);
            if (newText !== null && newText.trim() !== '') {
                card.textContent = newText.trim();
                saveBoardState(); 
            }
        });

        return card;
    }

    function addCardToColumn(columnId) {
        const list = document.querySelector(`.card-list[data-column-id="${columnId}"]`);
        if (list) {
            const card = createCard();
            list.appendChild(card);
            saveBoardState(); 
        }
    }

    function createColumn(title = 'Nueva Columna') {
        currentColumnId++;
        const column = document.createElement('div');
        column.classList.add('column');
        column.id = `column-${currentColumnId}`;
        column.dataset.columnId = currentColumnId;

        column.innerHTML = `
            <h2 class="column-header">${title}</h2>
            <div class="card-list" data-column-id="${currentColumnId}"></div>
            <button class="add-card-btn" data-column-id="${currentColumnId}">Añadir Tarea</button>
        `;

        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);

        column.querySelector('.add-card-btn').addEventListener('click', (e) => {
            addCardToColumn(e.target.dataset.columnId);
        });

        column.querySelector('.column-header').addEventListener('dblclick', (e) => {
            const newTitle = prompt('Editar título de la columna:', e.target.textContent);
            if (newTitle !== null && newTitle.trim() !== '') {
                e.target.textContent = newTitle.trim();
                saveBoardState(); 
            }
        });

        kanbanBoard.appendChild(column);
    }

    function saveBoardState() {
        const columns = [...document.querySelectorAll('.column')].map(column => {
            const columnId = column.dataset.columnId;
            const cards = [...column.querySelectorAll('.card')].map(card => card.textContent);
            return { columnId, cards };
        });
        localStorage.setItem('kanbanBoard', JSON.stringify(columns));
    }

    function loadBoardState() {
        const savedBoard = localStorage.getItem('kanbanBoard');
        if (savedBoard) {
            const columns = JSON.parse(savedBoard);
            columns.forEach(col => {
                createColumn(`Columna ${col.columnId}`); 
                col.cards.forEach(cardContent => {
                    addCardToColumn(col.columnId);
                    const card = document.querySelector(`.card[data-card-id="${currentCardId}"]`);
                    if (card) {
                        card.textContent = cardContent;
                    }
                });
            });
        }
    }

    loadBoardState(); 

    addColumnBtn.addEventListener('click', () => {
        const newColumnTitle = prompt('Introduce el título de la nueva columna:');
        if (newColumnTitle !== null && newColumnTitle.trim() !== '') {
            createColumn(newColumnTitle.trim());
            saveBoardState(); 
        }
    });
});
