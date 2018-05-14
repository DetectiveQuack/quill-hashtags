import Quill from 'quill';

const Embed = Quill.import('blots/embed');

class HashtagBlot extends Embed {
  static blotName = 'hashtag';
  static tagName = 'span';
  static className = 'hashtag';

  static create(data) {
    const node = super.create();
    const atSign = document.createElement('span');
    atSign.className = 'ql-hashtag-at-sign';
    atSign.innerHTML = '#';
    node.appendChild(atSign);
    node.innerHTML += data.value;
    node.dataset.id = data.id;
    node.dataset.value = data.value;
    return node;
  }

  static value(domNode) {
    return {
      id: domNode.dataset.id,
      value: domNode.dataset.value,
    };
  }
}

Quill.register(HashtagBlot);
