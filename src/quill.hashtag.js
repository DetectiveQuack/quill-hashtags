import Quill from 'quill';
import Keys from './constants/keys';
import './quill.hashtag.css';
import './blots/hashtag';

class Hashtag {
    constructor(quill, options) {
        this.isOpen = false;
        this.itemIndex = 0;
        this.tagPos = null;
        this.cursorPos = null;
        this.values = [];

        this.quill = quill;

        this.options = {
            source: null,
            renderItem(item) {
                return `${item.value}`;
            },
            allowedChars: null,
            minChars: 0,
            maxChars: 31,
            offsetTop: 2,
            offsetLeft: 0,
            renderList: this.renderList.bind(this)
        };

        Object.assign(this.options, options);

        this.hashtagContainer = document.createElement('div');
        this.hashtagContainer.className = 'ql-hashtag-list-container';
        this.hashtagContainer.style.cssText =
            'display: none; position: absolute;';

        this.hashtagList = document.createElement('ul');
        this.hashtagList.className = 'ql-hashtag-list';
        this.hashtagContainer.appendChild(this.hashtagList);

        document.body.appendChild(this.hashtagContainer);

        quill.on('text-change', this.onTextChange.bind(this));
        quill.on('selection-change', this.onSelectionChange.bind(this));

        quill.keyboard.addBinding(
            {
                key: Keys.TAB
            },
            this.selectHandler.bind(this)
        );
        quill.keyboard.bindings[9].unshift(quill.keyboard.bindings[9].pop());

        quill.keyboard.addBinding(
            {
                key: Keys.ENTER
            },
            this.selectHandler.bind(this)
        );
        quill.keyboard.bindings[13].unshift(quill.keyboard.bindings[13].pop());

        quill.keyboard.addBinding(
            {
                key: Keys.SPACE
            },
            this.spaceHandler.bind(this)
        );

        quill.keyboard.addBinding(
            {
                key: Keys.ESCAPE
            },
            this.escapeHandler.bind(this)
        );

        quill.keyboard.addBinding(
            {
                key: Keys.UP
            },
            this.upHandler.bind(this)
        );

        quill.keyboard.addBinding(
            {
                key: Keys.DOWN
            },
            this.downHandler.bind(this)
        );
    }

    selectHandler() {
        if (this.isOpen) {
            this.selectItem();
            return false;
        }
        return true;
    }

    escapeHandler() {
        if (this.isOpen) {
            this.hideHashtagList();
            return false;
        }
        return true;
    }

    upHandler() {
        if (this.isOpen) {
            this.prevItem();
            return false;
        }
        return true;
    }

    downHandler() {
        if (this.isOpen) {
            this.nextItem();
            return false;
        }
        return true;
    }

    showHashtagList() {
        this.hashtagContainer.style.visibility = 'hidden';
        this.hashtagContainer.style.display = '';
        this.setHashtagContainerPosition();
        this.isOpen = true;
    }

    hideHashtagList() {
        this.hashtagContainer.style.display = 'none';
        this.isOpen = false;
    }

    highlightItem() {
        for (let i = 0; i < this.hashtagList.childNodes.length; i += 1) {
            this.hashtagList.childNodes[i].classList.remove('selected');
        }
        this.hashtagList.childNodes[this.itemIndex].classList.add('selected');
        const itemHeight = this.hashtagList.childNodes[this.itemIndex]
            .offsetHeight;
        this.hashtagContainer.scrollTop = this.itemIndex * itemHeight;
    }

    getItemData() {
        return {
            id: this.hashtagList.childNodes[this.itemIndex].dataset.id,
            value: this.hashtagList.childNodes[this.itemIndex].dataset.value
        };
    }

    selectItem() {
        const data = this.getItemData();
        this.quill.deleteText(
            this.tagPos,
            this.cursorPos - this.tagPos,
            Quill.sources.API
        );
        this.quill.insertEmbed(this.tagPos, 'hashtag', data, Quill.sources.API);
        this.quill.insertText(this.tagPos + 1, ' ', Quill.sources.API);
        this.quill.setSelection(this.tagPos + 2, Quill.sources.API);
        this.hideHashtagList();
    }

    onItemClick(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.itemIndex = e.currentTarget.dataset.index;
        this.highlightItem();
        this.selectItem();
    }

    renderList(data, searchTerm) {
        if (!data.length) {
            data.push({ id: null, value: searchTerm });
        }

        this.values = data;
        this.hashtagList.innerHTML = '';
        for (let i = 0; i < data.length; i += 1) {
            const li = document.createElement('li');
            li.className = 'ql-hashtag-list-item';
            li.dataset.index = i;
            li.dataset.id = data[i].id;
            li.dataset.value = data[i].value;
            li.innerHTML = this.options.renderItem(data[i], searchTerm);
            li.onclick = this.onItemClick.bind(this);
            this.hashtagList.appendChild(li);
        }
        this.itemIndex = 0;
        this.highlightItem();
        this.showHashtagList();
    }

    nextItem() {
        this.itemIndex = (this.itemIndex + 1) % this.values.length;
        this.highlightItem();
    }

    prevItem() {
        this.itemIndex =
            (this.itemIndex + this.values.length - 1) % this.values.length;
        this.highlightItem();
    }

    hasValidChars(s) {
        return this.options.allowedChars ? this.options.allowedChars.test(s) : true;
    }

    containerBottomIsNotVisible(topPos) {
        return (
            topPos + this.hashtagContainer.offsetHeight >
            window.pageYOffset + window.innerHeight
        );
    }

    containerRightIsNotVisible(leftPos) {
        const rightPos = leftPos + this.hashtagContainer.offsetWidth;
        const browserWidth =
            window.pageXOffset + document.documentElement.clientWidth;
        return rightPos > browserWidth;
    }

    setHashtagContainerPosition() {
        const containerPos = this.quill.container.getBoundingClientRect();
        const tagPos = this.quill.getBounds(this.tagPos);
        let topPos =
            window.pageYOffset +
            containerPos.top +
            tagPos.bottom +
            this.options.offsetTop;
        let leftPos =
            window.pageXOffset +
            containerPos.left +
            tagPos.left +
            this.options.offsetLeft;
        if (this.containerBottomIsNotVisible(topPos)) {
            const overAtPos = window.pageYOffset + containerPos.top + tagPos.top;
            const containerHeight =
                this.hashtagContainer.offsetHeight + this.options.offsetTop;
            topPos = overAtPos - containerHeight;
        }
        if (this.containerRightIsNotVisible(leftPos)) {
            const containerWidth =
                this.hashtagContainer.offsetWidth + this.options.offsetLeft;
            const browserWidth =
                window.pageXOffset + document.documentElement.clientWidth;
            leftPos = browserWidth - containerWidth;
        }
        this.hashtagContainer.style.top = `${topPos}px`;
        this.hashtagContainer.style.left = `${leftPos}px`;
        this.hashtagContainer.style.visibility = 'visible';
    }

    onSomethingChange(spaceRange) {
        const range = spaceRange ? spaceRange : this.quill.getSelection();
        if (range == null) return;
        this.cursorPos = range.index;
        const startPos = Math.max(0, this.cursorPos - this.options.maxChars);
        const beforeCursorPos = this.quill.getText(
            startPos,
            this.cursorPos - startPos
        );
        const tagSignIndex = beforeCursorPos.lastIndexOf('#');

        if (tagSignIndex > -1) {
            const tagPos =
                this.cursorPos - (beforeCursorPos.length - tagSignIndex);
            this.tagPos = tagPos;
            const textAfterTagPos = beforeCursorPos.substring(tagSignIndex + 1);

            if (
                textAfterTagPos.length >= this.options.minChars &&
                this.hasValidChars(textAfterTagPos) &&
                !textAfterTagPos.includes(' ')
            ) {
                this.options.source(textAfterTagPos, this.renderList);
                return true;
            } else {
                this.hideHashtagList();
            }
        } else {
            this.hideHashtagList();
        }
    }

    onTextChange(delta, oldDelta, source) {
        if (source === 'user') {
            this.onSomethingChange();
        }
    }

    onSelectionChange(range) {
        if (range && range.length === 0) {
            this.onSomethingChange();
        } else {
            this.hideHashtagList();
        }
    }

    spaceHandler(range) {
        const isValid = this.onSomethingChange(range);
        if (isValid) {
            this.selectHandler();
        }
        return true;
    }
}

Quill.register('modules/hashtag', Hashtag);
